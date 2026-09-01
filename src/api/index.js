/**
 * @fileoverview API module barrel export.
 * Import all API functions from this file:
 *   import { getAllMaps, createRoute } from '@/api';
 */

export * from './maps.js';
export * from './obstacles.js';
export * from './waypoints.js';
export * from './routes.js';
export * from './users.js';
export * from './validation.js';

// Export client for direct use if needed
export { client } from './client.js';

export * from './auth.js';
export { tokenStore } from '../auth/tokenStore.js';
