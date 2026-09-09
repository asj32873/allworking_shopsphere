const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

let accessTokenGetter = null;

/*
 * Allows Redux/auth bootstrap to provide
 * the current ShopSphere JWT.
 */
export const configureAccessTokenGetter = (getter) => {
  accessTokenGetter = getter;
};

const getToken = async () => {
  /*
   * Prefer the configured token getter when available.
   * This supports React/Auth bootstrap.
   */
  if (accessTokenGetter) {
    try {
      const token = await accessTokenGetter();

      if (token) {
        return token;
      }
    } catch (error) {
      console.error("Failed to get access token:", error);
    }
  }

  /*
   * Fallback to the persisted ShopSphere JWT.
   *
   * This prevents an application-startup race where
   * api/client.js is called before AppContext's useEffect
   * has registered the token getter.
   */
  return localStorage.getItem("shopsphere_token") || null;
};

const request = async (method, endpoint, body) => {
  const token = await getToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, options);
  } catch (error) {
    const networkError = new Error(
      error.message || "Unable to connect to the server.",
    );

    networkError.status = 0;

    throw networkError;
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Some endpoints may return an empty response.
  }

  if (!response.ok) {
    console.error("API ERROR:", data);

    const error = new Error(
      data?.message || `Request failed with status ${response.status}`,
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  /*
   * Support both backend response formats:
   *
   * { success: true, data: ... }
   *
   * and
   *
   * { ...actualData }
   */
  if (data && typeof data === "object" && "success" in data && "data" in data) {
    return data.data;
  }

  return data;
};

export const api = {
  get: (endpoint) => request("GET", endpoint),

  post: (endpoint, body) => request("POST", endpoint, body),

  put: (endpoint, body) => request("PUT", endpoint, body),

  patch: (endpoint, body) => request("PATCH", endpoint, body),

  delete: (endpoint, body) => request("DELETE", endpoint, body),
};
