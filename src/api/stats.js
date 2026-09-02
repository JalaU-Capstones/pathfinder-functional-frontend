/**
 * @fileoverview Stats API client.
 * Covers all four /stats/* endpoints.
 * These endpoints require authentication
 * (Authorization: Bearer token is added automatically
 * by the API client).
 */

import { client } from './client.js';

const BASE = '/stats';

/**
 * getRequestStats — GET /stats/requests
 * Returns total request count and breakdown by
 * endpoint and HTTP method.
 *
 * @returns {Promise<{
 *   total_requests: number,
 *   breakdown: Object
 * }>}
 */
export const getRequestStats = () =>
  client.get(`${BASE}/requests`);

/**
 * getResponseTimeStats — GET /stats/response-times
 * Returns avg, min, and max response time per endpoint.
 *
 * @returns {Promise<Object>} Map of endpoint to timing.
 */
export const getResponseTimeStats = () =>
  client.get(`${BASE}/response-times`);

/**
 * getStatusCodeStats — GET /stats/status-codes
 * Returns count of each HTTP status code returned.
 *
 * @returns {Promise<Object>} Map of status code to count.
 */
export const getStatusCodeStats = () =>
  client.get(`${BASE}/status-codes`);

/**
 * getPopularEndpoints — GET /stats/popular-endpoints
 * Returns endpoints ranked by request count.
 *
 * @returns {Promise<{
 *   most_popular: string,
 *   request_count: number,
 *   ranked: Array
 * }>}
 */
export const getPopularEndpoints = () =>
  client.get(`${BASE}/popular-endpoints`);
