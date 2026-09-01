/**
 * @fileoverview Auth API client.
 * Covers the two public auth endpoints.
 * These endpoints do NOT require an Authorization header
 * (they are public — the header is simply absent since
 * no token exists yet when these are called).
 */

import { client } from './client.js';
import { tokenStore } from '../auth/tokenStore.js';

const BASE = '/api/auth';

/**
 * register — POST /api/auth/signin
 * Creates a new user account and returns a JWT.
 * Automatically stores the returned token in localStorage.
 *
 * @param {Object} payload
 * @param {string} payload.name
 * @param {string} payload.email
 * @param {string} payload.password
 * @param {number} payload.age
 * @returns {Promise<{ token, expiresIn, user }>}
 */
export const register = async (payload) => {
  const data = await client.post(`${BASE}/signin`, payload);
  if (data?.token) {
    tokenStore.setToken(data.token);
  }
  return data;
};

/**
 * login — POST /api/auth/login
 * Verifies credentials and returns a JWT.
 * Automatically stores the returned token in localStorage.
 *
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.password
 * @returns {Promise<{ token, expiresIn, user }>}
 */
export const login = async (payload) => {
  const data = await client.post(`${BASE}/login`, payload);
  if (data?.token) {
    tokenStore.setToken(data.token);
  }
  return data;
};

/**
 * logout — clears the stored token.
 * Does NOT call a backend endpoint (the JWT is stateless
 * — there is no server-side session to invalidate).
 * The token simply becomes unused on the client.
 *
 * @returns {void}
 */
export const logout = () => {
  tokenStore.clearToken();
};
