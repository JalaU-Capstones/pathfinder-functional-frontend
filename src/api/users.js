/**
 * @fileoverview Users API client.
 * Endpoint base: /api/users
 */

import { client } from './client.js';

const BASE = '/api/users';

/**
 * getAllUsers — fetch all users.
 * @returns {Promise<User[]>}
 */
export const getAllUsers = () => client.get(BASE);

/**
 * getUserById — fetch a single user by UUID.
 * @param {string} id - User UUID.
 * @returns {Promise<User>}
 */
export const getUserById = (id) => client.get(`${BASE}/${id}`);

/**
 * createUser — create a new user account.
 * @param {Object} payload
 * @param {string} payload.name
 * @param {number} payload.age
 * @param {string} payload.email - Must be unique.
 * @returns {Promise<User>}
 */
export const createUser = (payload) =>
  client.post(BASE, payload);

/**
 * updateUser — update user details.
 * At least one field required (name, age, or email).
 * @param {string} id - User UUID.
 * @param {Object} payload - Fields to update.
 * @returns {Promise<User>}
 */
export const updateUser = (id, payload) =>
  client.put(`${BASE}/${id}`, payload);

/**
 * deleteUser — delete a user account.
 * @param {string} id - User UUID.
 * @returns {Promise<null>}
 */
export const deleteUser = (id) =>
  client.del(`${BASE}/${id}`);
