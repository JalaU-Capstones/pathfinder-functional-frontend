/**
 * @fileoverview Waypoints API client.
 * Endpoint base: /api/waypoints
 */

import { client } from './client.js';

const BASE = '/api/waypoints';

/**
 * getAllWaypoints — fetch all waypoints, optionally
 * filtered by map.
 * @param {string} [mapId] - Optional Map UUID filter.
 * @returns {Promise<Waypoint[]>}
 */
export const getAllWaypoints = (mapId) => {
  const url = mapId ? `${BASE}?mapId=${mapId}` : BASE;
  return client.get(url);
};

/**
 * getWaypointById — fetch a single waypoint by UUID.
 * @param {string} id - Waypoint UUID.
 * @returns {Promise<Waypoint>}
 */
export const getWaypointById = (id) =>
  client.get(`${BASE}/${id}`);

/**
 * createWaypoint — add a waypoint to a map.
 * @param {Object} payload
 * @param {string} payload.mapId
 * @param {{ x: number, y: number }} payload.position
 * @param {string} payload.name
 * @returns {Promise<Waypoint>}
 */
export const createWaypoint = (payload) =>
  client.post(BASE, payload);

/**
 * updateWaypoint — update waypoint position or name.
 * @param {string} id - Waypoint UUID.
 * @param {Object} payload
 * @returns {Promise<Waypoint>}
 */
export const updateWaypoint = (id, payload) =>
  client.put(`${BASE}/${id}`, payload);

/**
 * deleteWaypoint — remove a waypoint from its map.
 * @param {string} id - Waypoint UUID.
 * @returns {Promise<null>}
 */
export const deleteWaypoint = (id) =>
  client.del(`${BASE}/${id}`);
