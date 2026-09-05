/**
 * @fileoverview Maps API client.
 * Covers all CRUD operations for the Map entity.
 * Endpoint base: /api/maps
 *
 * Map response shape:
 * {
 *   id: string (UUID),
 *   name: string,
 *   dimensions: { width: number, height: number },
 *   obstacles: [{ id, mapId, position: {x,y}, size }],
 *   waypoints: [{ id, mapId, position: {x,y}, name }],
 *   createdAt: string,
 *   updatedAt: string
 * }
 */

import { client } from './client.js';

const BASE = '/api/maps';

/**
 * getAllMaps — fetch all maps.
 * @returns {Promise<Map[]>}
 */
export const getAllMaps = () => client.get(BASE);

/**
 * getMapById — fetch a single map by UUID, including its
 * obstacles and waypoints.
 * @param {string} id - Map UUID.
 * @returns {Promise<Map>}
 */
export const getMapById = (id) => client.get(`${BASE}/${id}`);

export const createMap = (payload) => {
  const data = {
    name: payload.name,
    width: payload.dimensions?.width || payload.width,
    height: payload.dimensions?.height || payload.height,
  };
  if (payload.obstacles) {
    data.obstacles = payload.obstacles.map(obs => ({
      startX: obs.startX,
      startY: obs.startY,
      endX: obs.endX,
      endY: obs.endY
    }));
  }
  if (payload.waypoints) {
    data.waypoints = payload.waypoints;
  }
  return client.post(BASE, data);
};

/**
 * updateMap — update an existing map's name or dimensions.
 * @param {string} id - Map UUID.
 * @param {Object} payload - Fields to update.
 * @returns {Promise<Map>}
 */
export const updateMap = (id, payload) =>
  client.put(`${BASE}/${id}`, payload);

/**
 * deleteMap — delete a map and all its associated
 * obstacles, waypoints, and routes (cascade).
 * @param {string} id - Map UUID.
 * @returns {Promise<null>}
 */
export const deleteMap = (id) => client.del(`${BASE}/${id}`);
