/**
 * @fileoverview Token storage utility for JWT management.
 *
 * Manages the JWT lifecycle in localStorage:
 * - Store: saves token after login/register
 * - Retrieve: returns token if valid, null if expired
 * - Clear: removes token on logout or 401 response
 * - Decode: extracts payload without signature verification
 *
 * Security notes:
 * - localStorage is accessible to JavaScript on the same
 *   origin. XSS attacks could steal the token. Mitigate
 *   by keeping Content Security Policy strict and never
 *   eval-ing user input.
 * - The token is validated server-side on every request.
 *   A stolen token is still a 7-day risk — acceptable
 *   for this application's threat model.
 * - Never store sensitive data beyond the token string
 *   itself in localStorage.
 */

/**
 * TOKEN_KEY — localStorage key for the JWT token.
 * Configured via VITE_TOKEN_KEY environment variable.
 * Falls back to 'pathfinder_auth_token' if the variable
 * is not set (development safety net only).
 */
const TOKEN_KEY =
  import.meta.env.VITE_TOKEN_KEY || 'pathfinder_auth_token';

/**
 * decodePayload — decodes the JWT payload without
 * verifying the signature. Used only to read the
 * exp claim for client-side expiration checks.
 *
 * This is safe because:
 * 1. We never trust the payload for authorization —
 *    the server verifies the signature on every request.
 * 2. We only use exp to decide whether to include the
 *    token in requests — an expired token will still
 *    be rejected server-side.
 *
 * @param {string} token - JWT string.
 * @returns {Object|null} Decoded payload or null.
 */
const decodePayload = (token) => {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;

    // Pad base64 to a multiple of 4 characters
    const padded = base64Payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(
        base64Payload.length +
          (4 - (base64Payload.length % 4)) % 4,
        '='
      );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

/**
 * isTokenExpired — checks if the token exp claim is
 * in the past. Returns true if expired or undecodable.
 *
 * @param {string} token - JWT string.
 * @returns {boolean}
 */
const isTokenExpired = (token) => {
  const payload = decodePayload(token);
  if (!payload || !payload.exp) return true;
  // exp is in seconds, Date.now() is in milliseconds
  // Add 10s buffer to account for clock skew
  return payload.exp * 1000 < Date.now() - 10000;
};

/**
 * setToken — stores the JWT in localStorage.
 *
 * @param {string} token - JWT string from auth response.
 * @returns {void}
 */
const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    // localStorage may be unavailable in some browsers
    // (private mode, storage quota exceeded)
    console.error('tokenStore: failed to save token', error);
  }
};

/**
 * getToken — retrieves the stored token if valid.
 * Returns null if no token exists or if expired.
 * Clears the token automatically on expiration.
 *
 * @returns {string|null} Valid token or null.
 */
const getToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    if (isTokenExpired(token)) {
      clearToken();
      return null;
    }

    return token;
  } catch {
    return null;
  }
};

/**
 * clearToken — removes the stored token from localStorage.
 * Called on logout or when a 401 response is received.
 *
 * @returns {void}
 */
const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Silently fail — nothing critical depends on this
  }
};

/**
 * getTokenPayload — returns the decoded payload of the
 * current valid token, or null if no valid token exists.
 *
 * Used to read userId and email from the stored token
 * without an API call.
 *
 * @returns {{ userId: string, email: string } | null}
 */
const getTokenPayload = () => {
  const token = getToken();
  if (!token) return null;
  return decodePayload(token);
};

/**
 * isAuthenticated — returns true if a valid, non-expired
 * token exists in localStorage.
 *
 * @returns {boolean}
 */
const isAuthenticated = () => getToken() !== null;

export const tokenStore = {
  setToken,
  getToken,
  clearToken,
  getTokenPayload,
  isAuthenticated,
};
