const DEFAULT_TIMEOUT_MS = Number(
  process.env.SERVICE_REQUEST_TIMEOUT_MS || 8000,
);

const DEFAULT_RETRIES = Number(process.env.SERVICE_REQUEST_RETRIES || 2);

const DEFAULT_RETRY_DELAY_MS = Number(
  process.env.SERVICE_RETRY_DELAY_MS || 250,
);

const CIRCUIT_FAILURE_THRESHOLD = Number(
  process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || 5,
);

const CIRCUIT_RESET_TIMEOUT_MS = Number(
  process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS || 30000,
);

/*
|--------------------------------------------------------------------------
| Circuit breaker state
|--------------------------------------------------------------------------
|
| Each downstream service gets its own circuit.
|
| Example:
|
| auth-service
| vendor-service
| payment-service
|
*/

const circuits = new Map();

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCircuitKey(baseUrl) {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return baseUrl;
  }
}

function getCircuit(baseUrl) {
  const key = getCircuitKey(baseUrl);

  if (!circuits.has(key)) {
    circuits.set(key, {
      state: "CLOSED",
      failures: 0,
      openedAt: null,
      halfOpenRequests: 0,
    });
  }

  return circuits.get(key);
}

/*
|--------------------------------------------------------------------------
| Circuit breaker
|--------------------------------------------------------------------------
*/

function canRequest(baseUrl) {
  const circuit = getCircuit(baseUrl);

  /*
   * CLOSED
   *
   * Everything is normal.
   */

  if (circuit.state === "CLOSED") {
    return true;
  }

  /*
   * OPEN
   *
   * Fail immediately until reset timeout expires.
   */

  if (circuit.state === "OPEN") {
    const elapsed = Date.now() - circuit.openedAt;

    if (elapsed < CIRCUIT_RESET_TIMEOUT_MS) {
      return false;
    }

    /*
     * Move to HALF_OPEN.
     *
     * Allow one test request.
     */

    circuit.state = "HALF_OPEN";
    circuit.halfOpenRequests = 0;
  }

  /*
   * HALF_OPEN
   *
   * Allow only one request to test recovery.
   */

  if (circuit.state === "HALF_OPEN") {
    if (circuit.halfOpenRequests >= 1) {
      return false;
    }

    circuit.halfOpenRequests += 1;
    return true;
  }

  return true;
}

function recordSuccess(baseUrl) {
  const circuit = getCircuit(baseUrl);

  circuit.state = "CLOSED";
  circuit.failures = 0;
  circuit.openedAt = null;
  circuit.halfOpenRequests = 0;
}

function recordFailure(baseUrl) {
  const circuit = getCircuit(baseUrl);

  /*
   * HALF_OPEN failure means
   * the service is still unhealthy.
   */

  if (circuit.state === "HALF_OPEN") {
    circuit.state = "OPEN";
    circuit.openedAt = Date.now();
    circuit.halfOpenRequests = 0;

    return;
  }

  circuit.failures += 1;

  /*
   * Open the circuit after enough failures.
   */

  if (circuit.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuit.state = "OPEN";
    circuit.openedAt = Date.now();

    console.error(`[CIRCUIT BREAKER] OPEN for ${getCircuitKey(baseUrl)}`);
  }
}

/*
|--------------------------------------------------------------------------
| Retry policy
|--------------------------------------------------------------------------
|
| GET, HEAD and OPTIONS are safe to retry automatically.
|
| POST, PATCH, PUT and DELETE are NOT retried automatically.
|
| They can be retried only when explicitly marked retrySafe.
|
*/

function isSafeMethod(method) {
  return ["GET", "HEAD", "OPTIONS"].includes(
    String(method || "GET").toUpperCase(),
  );
}

function isRetryableStatus(status) {
  return [
    408, // Request Timeout
    429, // Too Many Requests
    500,
    502,
    503,
    504,
  ].includes(status);
}

function shouldRetry({ method, retrySafe, status, error }) {
  /*
   * Never retry unsafe writes automatically.
   */

  if (!isSafeMethod(method) && retrySafe !== true) {
    return false;
  }

  /*
   * Network / timeout errors.
   */

  if (error) {
    return true;
  }

  /*
   * Retry temporary server failures.
   */

  return isRetryableStatus(status);
}

/*
|--------------------------------------------------------------------------
| Exponential backoff with jitter
|--------------------------------------------------------------------------
*/

function getRetryDelay(attempt) {
  const exponentialDelay = DEFAULT_RETRY_DELAY_MS * Math.pow(2, attempt);

  /*
   * Add random jitter to prevent
   * retry storms.
   */

  const jitter = Math.floor(Math.random() * DEFAULT_RETRY_DELAY_MS);

  return exponentialDelay + jitter;
}

/*
|--------------------------------------------------------------------------
| Parse response safely
|--------------------------------------------------------------------------
*/

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: "Invalid JSON response from downstream service.",
      raw: text.slice(0, 1000),
    };
  }
}

/*
|--------------------------------------------------------------------------
| Timeout fetch
|--------------------------------------------------------------------------
*/

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/*
|--------------------------------------------------------------------------
| Main request
|--------------------------------------------------------------------------
*/

async function request(baseUrl, path, options = {}) {
  const {
    headers: customHeaders = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retrySafe = false,

    /*
     * Prevent internal control options
     * from being passed into fetch().
     */

    ...fetchOptions
  } = options;

  const method = String(fetchOptions.method || "GET").toUpperCase();

  const url = `${baseUrl.replace(/\/$/, "")}${path}`;

  /*
   * Circuit breaker check.
   */

  if (!canRequest(baseUrl)) {
    return {
      ok: false,
      status: 503,

      data: {
        success: false,

        message:
          "Downstream service temporarily unavailable. Circuit breaker is open.",

        code: "CIRCUIT_OPEN",
      },

      error: {
        type: "CIRCUIT_OPEN",
        message: "Circuit breaker is open for downstream service.",
      },

      attempts: 0,
    };
  }

  /*
   * Build headers.
   */

  const headers = {
    ...customHeaders,
  };

  /*
   * Add internal service token only
   * when configured.
   */

  if (
    process.env.INTERNAL_SERVICE_TOKEN &&
    !headers["x-internal-service-token"]
  ) {
    headers["x-internal-service-token"] = process.env.INTERNAL_SERVICE_TOKEN;
  }

  /*
   * Correlation / request ID propagation.
   *
   * If the caller already provides one,
   * preserve it.
   */

  if (!headers["x-request-id"] && !headers["X-Request-Id"]) {
    headers["x-request-id"] = `${process.pid}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  /*
   * Prepare body once.
   */

  let body = fetchOptions.body;

  if (
    body !== undefined &&
    body !== null &&
    typeof body !== "string" &&
    !Buffer.isBuffer(body)
  ) {
    headers["content-type"] =
      headers["content-type"] || headers["Content-Type"] || "application/json";

    body = JSON.stringify(body);
  }

  const maxAttempts = Math.max(1, Number(retries) + 1);

  let lastError = null;
  let lastResult = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      console.log(
        `[SERVICE CLIENT] ${method} ${url} attempt ${attempt + 1}/${maxAttempts}`,
      );

      const response = await fetchWithTimeout(
        url,
        {
          ...fetchOptions,
          method,
          headers,
          body,
        },
        timeoutMs,
      );

      const data = await parseResponse(response);

      const result = {
        ok: response.ok,
        status: response.status,
        data,
        error: null,
        attempts: attempt + 1,
      };

      lastResult = result;

      /*
       * Successful response.
       */

      if (response.ok) {
        recordSuccess(baseUrl);

        return result;
      }

      /*
       * Retry only temporary failures.
       */

      const retry = shouldRetry({
        method,
        retrySafe,
        status: response.status,
      });

      if (!retry || attempt === maxAttempts - 1) {
        /*
         * 4xx business errors should not
         * trip the circuit breaker.
         */

        if (response.status >= 500) {
          recordFailure(baseUrl);
        }

        return result;
      }

      const delay = getRetryDelay(attempt);

      console.warn(
        `[SERVICE CLIENT] retrying ${method} ${url} after ${delay}ms (status ${response.status})`,
      );

      await sleep(delay);
    } catch (error) {
      lastError = error;

      const isTimeout = error.name === "AbortError";

      console.error(`[SERVICE CLIENT] ${method} ${url} failed:`, error.message);

      const retry = shouldRetry({
        method,
        retrySafe,
        error,
      });

      if (!retry || attempt === maxAttempts - 1) {
        recordFailure(baseUrl);

        return {
          ok: false,

          status: isTimeout ? 504 : 503,

          data: {
            success: false,

            message: isTimeout
              ? "Downstream service request timed out."
              : "Downstream service unavailable.",

            code: isTimeout ? "DOWNSTREAM_TIMEOUT" : "DOWNSTREAM_UNAVAILABLE",
          },

          error: {
            type: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",

            message: error.message,
          },

          attempts: attempt + 1,
        };
      }

      const delay = getRetryDelay(attempt);

      console.warn(
        `[SERVICE CLIENT] retrying ${method} ${url} after network failure in ${delay}ms`,
      );

      await sleep(delay);
    }
  }

  /*
   * Defensive fallback.
   */

  recordFailure(baseUrl);

  return (
    lastResult || {
      ok: false,

      status: 503,

      data: {
        success: false,
        message: "Downstream service unavailable.",
      },

      error: lastError
        ? {
            type: "NETWORK_ERROR",
            message: lastError.message,
          }
        : null,

      attempts: maxAttempts,
    }
  );
}

/*
|--------------------------------------------------------------------------
| Convenience methods
|--------------------------------------------------------------------------
*/

async function getJson(baseUrl, path, headers = {}, options = {}) {
  return request(baseUrl, path, {
    ...options,
    method: "GET",
    headers,
  });
}

async function postJson(baseUrl, path, body, headers = {}, options = {}) {
  return request(baseUrl, path, {
    ...options,
    method: "POST",
    body,
    headers,
  });
}

async function putJson(baseUrl, path, body, headers = {}, options = {}) {
  return request(baseUrl, path, {
    ...options,
    method: "PUT",
    body,
    headers,
  });
}

async function patchJson(baseUrl, path, body, headers = {}, options = {}) {
  return request(baseUrl, path, {
    ...options,
    method: "PATCH",
    body,
    headers,
  });
}

async function deleteJson(baseUrl, path, headers = {}, options = {}) {
  return request(baseUrl, path, {
    ...options,
    method: "DELETE",
    headers,
  });
}

/*
|--------------------------------------------------------------------------
| Circuit breaker diagnostics
|--------------------------------------------------------------------------
*/

function getCircuitStatus() {
  const status = {};

  for (const [key, value] of circuits.entries()) {
    status[key] = {
      state: value.state,
      failures: value.failures,
      openedAt: value.openedAt,
    };
  }

  return status;
}

module.exports = {
  request,

  getJson,
  postJson,
  putJson,
  patchJson,
  deleteJson,

  getCircuitStatus,
};
