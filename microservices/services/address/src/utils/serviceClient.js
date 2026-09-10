const DEFAULT_TIMEOUT_MS = Number(
  process.env.SERVICE_REQUEST_TIMEOUT_MS || 8000,
);
const crypto = require("node:crypto");
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

  if (circuit.state === "CLOSED") {
    return true;
  }

  if (circuit.state === "OPEN") {
    const elapsed = Date.now() - circuit.openedAt;

    if (elapsed < CIRCUIT_RESET_TIMEOUT_MS) {
      return false;
    }

    circuit.state = "HALF_OPEN";
    circuit.halfOpenRequests = 0;
  }

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
   * If a HALF_OPEN request fails,
   * immediately reopen the circuit.
   */
  if (circuit.state === "HALF_OPEN") {
    circuit.state = "OPEN";
    circuit.openedAt = Date.now();
    circuit.halfOpenRequests = 0;

    return;
  }

  circuit.failures += 1;

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
*/

function isSafeMethod(method) {
  return ["GET", "HEAD", "OPTIONS"].includes(
    String(method || "GET").toUpperCase(),
  );
}

function isRetryableStatus(status) {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

function shouldRetry({ method, retrySafe, status, error }) {
  /*
   * Unsafe HTTP methods are not retried
   * unless explicitly marked retrySafe.
   */
  if (!isSafeMethod(method) && retrySafe !== true) {
    return false;
  }

  /*
   * Network and timeout errors can be retried.
   */
  if (error) {
    return true;
  }

  /*
   * Temporary HTTP errors can be retried.
   */
  return isRetryableStatus(status);
}

/*
|--------------------------------------------------------------------------
| Retry delay
|--------------------------------------------------------------------------
*/

function getRetryDelay(attempt) {
  const exponentialDelay = DEFAULT_RETRY_DELAY_MS * Math.pow(2, attempt);

  const jitter = crypto.randomInt(0, DEFAULT_RETRY_DELAY_MS);

  return exponentialDelay + jitter;
}

/*
|--------------------------------------------------------------------------
| Response parsing
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

async function request(baseUrl, path = "", options = {}) {
  const {
    headers: customHeaders = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retrySafe = false,
    ...fetchOptions
  } = options;

  const method = String(fetchOptions.method || "GET").toUpperCase();

  /*
   * Support both:
   *
   * request("http://service", "/path")
   *
   * and:
   *
   * request("http://service/path", "")
   */
  const url = path === "" ? baseUrl : `${baseUrl.replace(/\/$/, "")}${path}`;

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
        error: {
          code: "CIRCUIT_OPEN",
        },
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
   * Add internal service token when configured.
   */
  if (
    process.env.INTERNAL_SERVICE_TOKEN &&
    !headers["x-internal-service-token"]
  ) {
    headers["x-internal-service-token"] = process.env.INTERNAL_SERVICE_TOKEN;
  }

  /*
   * Generate request ID unless caller supplied one.
   */
  if (!headers["x-request-id"] && !headers["X-Request-Id"]) {
    headers["x-request-id"] =
      `${process.pid}-${Date.now()}-${crypto.randomUUID()}`;
  }

  /*
   * Prepare request body.
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
        `[SERVICE CLIENT] ${method} ${url} attempt ${
          attempt + 1
        }/${maxAttempts}`,
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
       * Successful response closes/resets circuit.
       */
      if (response.ok) {
        recordSuccess(baseUrl);

        return result;
      }

      /*
       * Determine whether HTTP failure should retry.
       */
      const retry = shouldRetry({
        method,
        retrySafe,
        status: response.status,
      });

      /*
       * Return immediately if:
       *
       * - status isn't retryable
       * - retry isn't allowed
       * - this was the final attempt
       */
      if (!retry || attempt === maxAttempts - 1) {
        /*
         * Only 5xx failures affect the circuit.
         *
         * 4xx responses are business/client errors.
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

      /*
       * No more attempts.
       */
      if (!retry || attempt === maxAttempts - 1) {
        recordFailure(baseUrl);

        const errorCode = isTimeout
          ? "DOWNSTREAM_TIMEOUT"
          : "DOWNSTREAM_UNAVAILABLE";

        const errorType = isTimeout ? "TIMEOUT" : "NETWORK_ERROR";

        return {
          ok: false,

          status: isTimeout ? 504 : 503,

          data: {
            success: false,

            message: isTimeout
              ? "Downstream service request timed out."
              : "Downstream service unavailable.",

            /*
             * Keep the error code inside data.error
             * because callers/tests expect this shape.
             */
            error: {
              code: errorCode,
              type: errorType,
              message: error.message,
            },
          },

          error: {
            type: errorType,
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
        error: {
          code: "DOWNSTREAM_UNAVAILABLE",
        },
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

/*
 * GET supports both:
 *
 * getJson(
 *   "http://localhost:5002",
 *   "/internal/users/123"
 * )
 *
 * and:
 *
 * getJson(
 *   "http://localhost:5002/internal/users/123",
 *   { retries: 0 }
 * )
 */
async function getJson(baseUrl, pathOrOptions, headers = {}, options = {}) {
  /*
   * Full URL + options style.
   */
  if (
    typeof pathOrOptions === "object" &&
    pathOrOptions !== null &&
    !Array.isArray(pathOrOptions)
  ) {
    return request(baseUrl, "", {
      ...pathOrOptions,
      method: "GET",
    });
  }

  /*
   * Base URL + path + headers + options style.
   */
  return request(baseUrl, pathOrOptions, {
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

function getCircuitStatus(baseUrl) {
  /*
   * If a URL is provided, return that circuit only.
   */
  if (baseUrl) {
    const circuit = circuits.get(getCircuitKey(baseUrl));

    if (!circuit) {
      return undefined;
    }

    return {
      state: circuit.state,
      failures: circuit.failures,
      openedAt: circuit.openedAt,
    };
  }

  /*
   * Otherwise return all circuits.
   */
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
