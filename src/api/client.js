/**
 * @fileoverview Base HTTP client for the Pathfinder API.
 *
 * Wraps the native fetch API with consistent error handling,
 * JSON parsing, and request configuration. All API modules
 * import from this file — never call fetch directly from
 * components or composables.
 *
 * Base URL: requests use relative paths (/api/...) which
 * Vite proxies to http://localhost:3000 in development.
 */

/**
 * parseErrorResponse — extracts a normalized error object
 * from a failed fetch response. Pure function.
 *
 * @param {Response} response - The failed fetch Response.
 * @returns {Promise<{message: string, status: number, code: string}>}
 */
const parseErrorResponse = async (response) => {
  let body = {};
  try {
    body = await response.json();
  } catch {
    // Response body is not JSON — use status text as message
  }

  return {
    message:
      body?.error?.message ||
      body?.message ||
      response.statusText ||
      'An unexpected error occurred.',
    status: response.status,
    code: body?.error?.code || 'UNKNOWN_ERROR',
  };
};

/**
 * request — core fetch wrapper. Pure in intent: given the
 * same inputs, produces the same HTTP request. Side effects
 * are isolated to this function.
 *
 * @param {string} path - API path, e.g. '/api/maps'.
 * @param {RequestInit} [options={}] - Fetch options.
 * @returns {Promise<any>} Parsed JSON response body.
 * @throws {{message, status, code}} On non-2xx responses
 *   or network failures.
 */
const request = async (path, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    ...options,
  };

  let response;
  try {
    response = await fetch(path, config);
  } catch (networkError) {
    throw {
      message:
        'Unable to reach the server. ' +
        'Ensure the backend is running at localhost:3000.',
      status: 0,
      code: 'NETWORK_ERROR',
    };
  }

  if (!response.ok) {
    const error = await parseErrorResponse(response);
    throw error;
  }

  // Handle 204 No Content (delete operations)
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  // Backend wraps successful responses in { success, data }
  // Return only the data payload to keep components clean
  return data?.data !== undefined ? data.data : data;
};

/**
 * HTTP method helpers. Each is a thin wrapper around request
 * with the method pre-configured.
 */
const get = (path, options = {}) =>
  request(path, { ...options, method: 'GET' });

const post = (path, body, options = {}) =>
  request(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });

const put = (path, body, options = {}) =>
  request(path, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });

const del = (path, options = {}) =>
  request(path, { ...options, method: 'DELETE' });

export const client = { get, post, put, del };
