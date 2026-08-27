const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

let accessTokenGetter = async () => null;

export function configureAccessTokenGetter(getter) {
  accessTokenGetter = typeof getter === "function" ? getter : async () => null;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = await accessTokenGetter();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body:
      options.body !== undefined && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  let payload = null;

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else {
    const text = await response.text();

    payload = text ? { message: text } : null;
  }

  if (!response.ok) {
    const error = new Error(
      payload?.message || `Request failed with status ${response.status}`,
    );

    error.status = response.status;

    error.details = payload?.details;

    throw error;
  }

  return payload?.data !== undefined ? payload.data : payload;
}

export const api = {
  get: (path) => request(path),

  post: (path, body) =>
    request(path, {
      method: "POST",
      body,
    }),

  put: (path, body) =>
    request(path, {
      method: "PUT",
      body,
    }),

  patch: (path, body) =>
    request(path, {
      method: "PATCH",
      body,
    }),

  delete: (path) =>
    request(path, {
      method: "DELETE",
    }),
};

export { API_URL };
