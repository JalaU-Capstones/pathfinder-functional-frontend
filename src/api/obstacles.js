/**
 * @fileoverview Obstacles API client.
 * Endpoint base: /api/obstacles
 */

import { client } from './client.js';

const BASE = '/api/obstacles';

/**
 * getAllObstacles — fetch all obstacles, optionally
 * filtered by map.
 * @param {string} [mapId] - Optional Map UUID filter.
 * @returns {Promise<Obstacle[]>}
 */
export const getAllObstacles = (mapId) => {
  const url = mapId ? `${BASE}?mapId=${mapId}` : BASE;
  return client.get(url);
};

/**
 * getObstacleById — fetch a single obstacle by UUID.
 * @param {string} id - Obstacle UUID.
 * @returns {Promise<Obstacle>}
 */
export const getObstacleById = (id) =>
  client.get(`${BASE}/${id}`);

/**
 * createObstacle — add an obstacle to a map.
 * @param {Object} payload
 * @param {string} payload.mapId
 * @param {{ x: number, y: number }} payload.position
 * @param {number} payload.size
 * @returns {Promise<Obstacle>}
 */
export const createObstacle = (payload) =>
  client.post(BASE, payload);

/**
 * updateObstacle — update obstacle position or size.
 * @param {string} id - Obstacle UUID.
 * @param {Object} payload
 * @returns {Promise<Obstacle>}
 */
export const updateObstacle = (id, payload) =>
  client.put(`${BASE}/${id}`, payload);

/**
 * deleteObstacle — remove an obstacle from its map.
 * @param {string} id - Obstacle UUID.
 * @returns {Promise<null>}
 */
export const deleteObstacle = (id) =>
  client.del(`${BASE}/${id}`);
