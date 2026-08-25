/**
 * @fileoverview Routes API client.
 * Endpoint base: /api/routes
 *
 * Route response shape includes:
 *   optimal_path: [{x,y},...] — A* computed path
 *   distance: number — total path length
 */

import { client } from './client.js';

const BASE = '/api/routes';

/**
 * getAllRoutes — fetch all routes, optionally filtered
 * by map.
 * @param {string} [mapId] - Optional Map UUID filter.
 * @returns {Promise<Route[]>}
 */
export const getAllRoutes = (mapId) => {
  const url = mapId ? `${BASE}?mapId=${mapId}` : BASE;
  return client.get(url);
};

/**
 * getRouteById — fetch a single route including its
 * stored optimal_path array.
 * @param {string} id - Route UUID.
 * @returns {Promise<Route>}
 */
export const getRouteById = (id) =>
  client.get(`${BASE}/${id}`);

/**
 * createRoute — calculate and store an optimal route.
 * Triggers the A* algorithm on the backend.
 * @param {Object} payload
 * @param {string} payload.mapId
 * @param {{ x: number, y: number }} payload.start
 * @param {{ x: number, y: number }} payload.end
 * @returns {Promise<Route>} Includes optimal_path and distance.
 */
export const createRoute = (payload) =>
  client.post(BASE, payload);

/**
 * deleteRoute — remove a stored route.
 * @param {string} id - Route UUID.
 * @returns {Promise<null>}
 */
export const deleteRoute = (id) =>
  client.del(`${BASE}/${id}`);
