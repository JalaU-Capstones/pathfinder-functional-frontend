/**
 * @fileoverview User profile API client.
 *
 * After the JWT auth implementation, users can only
 * access and modify their own account. All endpoints
 * use /api/users/me — the server identifies the user
 * from the JWT, not from a URL parameter.
 *
 * No createUser here — account creation is handled
 * by src/api/auth.js (POST /api/auth/signin).
 */

import { client } from './client.js';

const BASE = '/api/users/me';

/**
 * getProfile — GET /api/users/me
 * Returns the authenticated user's own profile.
 * The server reads userId from the JWT — no ID needed
 * in the request.
 *
 * @returns {Promise<{ id, name, email, age, createdAt }>}
 */
export const getProfile = () => client.get(BASE);

/**
 * updateProfile — PUT /api/users/me
 * Updates the authenticated user's own profile.
 * At least one field required: name, email, or age.
 *
 * @param {Object} payload - Fields to update.
 * @param {string} [payload.name]
 * @param {string} [payload.email]
 * @param {number} [payload.age]
 * @returns {Promise<{ id, name, email, age, createdAt }>}
 */
export const updateProfile = (payload) =>
  client.put(BASE, payload);

/**
 * deleteAccount — DELETE /api/users/me
 * Permanently deletes the authenticated user's account.
 * The user's maps, obstacles, waypoints, and routes
 * will have their userId set to null (SET NULL cascade)
 * but will NOT be deleted.
 *
 * @returns {Promise<null>}
 */
export const deleteAccount = () => client.del(BASE);
