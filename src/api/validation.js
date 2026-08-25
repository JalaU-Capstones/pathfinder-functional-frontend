/**
 * @fileoverview Validation API client.
 * Covers all /api/validation/* endpoints.
 * These endpoints expose the backend validation and
 * pathfinding analysis operations.
 */

import { client } from './client.js';

const BASE = '/api/validation';

/**
 * validateMapIdFormat — check UUID format (recursive).
 * @param {string} mapId - UUID to validate.
 * @returns {Promise<{message: string}>}
 */
export const validateMapIdFormat = (mapId) =>
  client.get(`${BASE}/map-id/${mapId}`);

/**
 * checkMapExists — verify map UUID exists in database.
 * @param {string} mapId - Map UUID.
 * @returns {Promise<{message: string}>}
 */
export const checkMapExists = (mapId) =>
  client.get(`${BASE}/map-exists/${mapId}`);

/**
 * validateMapConfig — validate map has obstacles
 * and waypoints configured (recursive validation).
 * @param {string} mapId
 * @param {Object} mapConfig - { obstacles: [], waypoints: [] }
 * @returns {Promise<{message: string}>}
 */
export const validateMapConfig = (mapId, mapConfig) =>
  client.post(`${BASE}/map-config`, { mapId, mapConfig });

/**
 * validateDimensions — check dimensions within limits.
 * @param {{ width: number, height: number }} dimensions
 * @returns {Promise<{message: string}>}
 */
export const validateDimensions = (dimensions) =>
  client.post(`${BASE}/dimensions`, dimensions);

/**
 * detectCyclicDependencies — DFS cycle detection.
 * @param {{ connections: [{source,target}] }} mapConfig
 * @returns {Promise<{message: string}>}
 */
export const detectCyclicDependencies = (mapConfig) =>
  client.post(`${BASE}/cyclic-dependencies`, { mapConfig });

/**
 * validateStartEndNotObstructed — verify path exists
 * between start and end points.
 * @param {string} mapId
 * @param {{ x, y }} startPoint
 * @param {{ x, y }} endPoint
 * @param {Array} obstacles
 * @returns {Promise<{message: string}>}
 */
export const validateStartEndNotObstructed = (
  mapId, startPoint, endPoint, obstacles
) =>
  client.post(`${BASE}/start-end-obstructed`, {
    mapId, startPoint, endPoint, obstacles,
  });

/**
 * validateAtLeastOnePath — verify at least one valid
 * path exists from start to end on the map.
 * @param {string} mapId
 * @param {{ x, y }} startPoint
 * @param {{ x, y }} endPoint
 * @returns {Promise<{message: string}>}
 */
export const validateAtLeastOnePath = (
  mapId, startPoint, endPoint
) =>
  client.post(`${BASE}/valid-path`, {
    mapId, startPoint, endPoint,
  });

/**
 * analyzePerformance — run parallel pathfinding analysis.
 * @param {{ x, y }} startPoint
 * @param {{ x, y }} endPoint
 * @param {Array} obstacles
 * @returns {Promise<{analysis: Object}>}
 */
export const analyzePerformance = (
  startPoint, endPoint, obstacles
) =>
  client.post(`${BASE}/performance`, {
    startPoint, endPoint, obstacles,
  });

/**
 * validateRouteIntersections — verify path does not
 * intersect any obstacle.
 * @param {Array<{x,y}>} path
 * @param {Array} obstacles
 * @returns {Promise<{message: string}>}
 */
export const validateRouteIntersections = (path, obstacles) =>
  client.post(`${BASE}/route-intersections`, {
    path, obstacles,
  });

/**
 * validateRouteLength — verify path length is within
 * acceptable limits (MAX_ROUTE_LENGTH = 50000).
 * @param {Array<{x,y}>} path
 * @returns {Promise<{message: string, length: number}>}
 */
export const validateRouteLength = (path) =>
  client.post(`${BASE}/route-length`, { path });

/**
 * checkSamePoint — handle start equals end special case.
 * @param {{ x, y }} startPoint
 * @param {{ x, y }} endPoint
 * @returns {Promise<{samePoint: boolean, message: string}>}
 */
export const checkSamePoint = (startPoint, endPoint) =>
  client.post(`${BASE}/same-point`, { startPoint, endPoint });

/**
 * validateComprehensive — run all independent checks
 * in parallel (showcase of concurrency).
 * @param {string} mapId
 * @param {{ x, y }} startPoint
 * @param {{ x, y }} endPoint
 * @param {Array} obstacles
 * @param {Array} [path]
 * @returns {Promise<{results: Array}>}
 */
export const validateComprehensive = (
  mapId, startPoint, endPoint, obstacles, path
) =>
  client.post(`${BASE}/comprehensive`, {
    mapId, startPoint, endPoint, obstacles, path,
  });

/**
 * validateMapWaypoints — filter for valid stopping points.
 * @param {Object} map - { startingPoint, stoppingPoints, obstacles }
 * @returns {Promise<{valid, validCount, message}>}
 */
export const validateMapWaypoints = (map) =>
  client.post(`${BASE}/map-waypoints`, { map });

/**
 * checkReachability — accumulator for waypoint connectivity.
 * @param {Object} map
 * @returns {Promise<{reachable, unreachablePoints}>}
 */
export const checkReachability = (map) =>
  client.post(`${BASE}/reachability`, { map });

/**
 * getOptimalRoute — pipe of accumulators for optimal route.
 * @param {Object} map
 * @returns {Promise<{optimal, optimalRoute, distance}>}
 */
export const getOptimalRoute = (map) =>
  client.post(`${BASE}/optimal-route`, { map });
