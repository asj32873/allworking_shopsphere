const crypto = require("node:crypto");

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
   * Temporary server failures.
   */
  return isRetryableStatus(status);
}

/*
|--------------------------------------------------------------------------
| Retry delay
|--------------------------------------------------------------------------
|
| crypto.randomInt() is used instead of Math.random().
|
| This avoids SonarQube's pseudorandom-number-generator security hotspot
| while also providing unbiased jitter.
|
*/

function getRetryDelay(attempt) {
  const exponentialDelay = DEFAULT_RETRY_DELAY_MS * Math.pow(2, attempt);

  const jitter = crypto.randomInt(0, Math.max(1, DEFAULT_RETRY_DELAY_MS));

  return exponentialDelay + jitter;
}

/*
|--------------------------------------------------------------------------
| URL / options
|--------------------------------------------------------------------------
*/

function buildUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function normalizeOptions(options) {
  const {
    headers: customHeaders = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retrySafe = false,
    ...fetchOptions
  } = options;

  return {
    customHeaders,
    timeoutMs,
    retries,
    retrySafe,
    fetchOptions,
  };
}

/*
|--------------------------------------------------------------------------
| Headers
|--------------------------------------------------------------------------
*/

function buildHeaders(customHeaders) {
  const headers = {
    ...customHeaders,
  };

  /*
   * Add internal service token only when configured.
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
   * Use an RFC-compliant UUID rather than Math.random().
   */
  if (!headers["x-request-id"] && !headers["X-Request-Id"]) {
    headers["x-request-id"] = crypto.randomUUID();
  }

  return headers;
}

/*
|--------------------------------------------------------------------------
| Body
|--------------------------------------------------------------------------
*/

function prepareBody(body, headers) {
  if (
    body === undefined ||
    body === null ||
    typeof body === "string" ||
    Buffer.isBuffer(body)
  ) {
    return body;
  }

  headers["content-type"] =
    headers["content-type"] || headers["Content-Type"] || "application/json";

  return JSON.stringify(body);
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
| Results
|--------------------------------------------------------------------------
*/

function circuitOpenResult() {
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

function networkErrorResult(error) {
  const isTimeout = error.name === "AbortError";

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
  };
}

/*
|--------------------------------------------------------------------------
| Response attempt
|--------------------------------------------------------------------------
*/

async function executeAttempt({
  baseUrl,
  url,
  method,
  fetchOptions,
  timeoutMs,
  attempt,
  maxAttempts,
}) {
  console.log(
    `[SERVICE CLIENT] ${method} ${url} attempt ${attempt}/${maxAttempts}`,
  );

  const response = await fetchWithTimeout(url, fetchOptions, timeoutMs);

  const data = await parseResponse(response);

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: null,
    attempts: attempt,
    baseUrl,
    method,
    url,
  };
}

/*
|--------------------------------------------------------------------------
| HTTP response handling
|--------------------------------------------------------------------------
*/

function handleHttpFailure({
  result,
  baseUrl,
  method,
  url,
  retrySafe,
  attempt,
  maxAttempts,
}) {
  const retry = shouldRetry({
    method,
    retrySafe,
    status: result.status,
  });

  if (!retry || attempt === maxAttempts) {
    /*
     * Only server-side failures trip the circuit breaker.
     * 4xx business errors do not.
     */
    if (result.status >= 500) {
      recordFailure(baseUrl);
    }

    return {
      shouldReturn: true,
      result,
    };
  }

  const delay = getRetryDelay(attempt - 1);

  console.warn(
    `[SERVICE CLIENT] retrying ${method} ${url} after ${delay}ms ` +
      `(status ${result.status})`,
  );

  return {
    shouldReturn: false,
    delay,
  };
}

/*
|--------------------------------------------------------------------------
| Network error handling
|--------------------------------------------------------------------------
*/

function handleNetworkFailure({
  error,
  baseUrl,
  method,
  url,
  retrySafe,
  attempt,
  maxAttempts,
}) {
  const retry = shouldRetry({
    method,
    retrySafe,
    error,
  });

  const isLastAttempt = attempt === maxAttempts;

  console.error(`[SERVICE CLIENT] ${method} ${url} failed:`, error.message);

  if (!retry || isLastAttempt) {
    recordFailure(baseUrl);

    return {
      shouldReturn: true,
      result: {
        ...networkErrorResult(error),
        attempts: attempt,
      },
    };
  }

  const delay = getRetryDelay(attempt - 1);

  console.warn(
    `[SERVICE CLIENT] retrying ${method} ${url} ` +
      `after network failure in ${delay}ms`,
  );

  return {
    shouldReturn: false,
    delay,
  };
}

/*
|--------------------------------------------------------------------------
| Retry execution
|--------------------------------------------------------------------------
*/

async function executeWithRetries({
  baseUrl,
  url,
  method,
  fetchOptions,
  timeoutMs,
  retries,
  retrySafe,
}) {
  const maxAttempts = Math.max(1, Number(retries) + 1);

  let lastResult = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await executeAttempt({
        baseUrl,
        url,
        method,
        fetchOptions,
        timeoutMs,
        attempt,
        maxAttempts,
      });

      lastResult = result;

      if (result.ok) {
        recordSuccess(baseUrl);

        return result;
      }

      const failure = handleHttpFailure({
        result,
        baseUrl,
        method,
        url,
        retrySafe,
        attempt,
        maxAttempts,
      });

      if (failure.shouldReturn) {
        return failure.result;
      }

      await sleep(failure.delay);
    } catch (error) {
      const failure = handleNetworkFailure({
        error,
        baseUrl,
        method,
        url,
        retrySafe,
        attempt,
        maxAttempts,
      });

      if (failure.shouldReturn) {
        return failure.result;
      }

      await sleep(failure.delay);
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

      error: null,

      attempts: maxAttempts,
    }
  );
}

/*
|--------------------------------------------------------------------------
| Main request
|--------------------------------------------------------------------------
*/

async function request(baseUrl, path, options = {}) {
  const { customHeaders, timeoutMs, retries, retrySafe, fetchOptions } =
    normalizeOptions(options);

  const method = String(fetchOptions.method || "GET").toUpperCase();

  const url = buildUrl(baseUrl, path);

  /*
   * Circuit breaker check.
   */
  if (!canRequest(baseUrl)) {
    return circuitOpenResult();
  }

  /*
   * Build headers.
   */
  const headers = buildHeaders(customHeaders);

  /*
   * Prepare body once.
   */
  const body = prepareBody(fetchOptions.body, headers);

  return executeWithRetries({
    baseUrl,
    url,
    method,
    timeoutMs,
    retries,
    retrySafe,
    fetchOptions: {
      ...fetchOptions,
      method,
      headers,
      body,
    },
  });
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