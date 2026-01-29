/**
 * FOURBYTE Server Configuration
 * 
 * Centralized configuration for server behavior.
 * All limits and timeouts are defined here for easy tuning.
 */

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

// ===========================================
// RATE LIMITING CONFIGURATION
// ===========================================
// 
// Why rate limiting?
// - Prevents spam attacks that could degrade service for all users
// - Limits resource consumption per client
// - Simple token bucket algorithm: refills over time
//
const RATE_LIMIT = {
  // Maximum messages a user can send in the time window
  MAX_MESSAGES: 10,
  // Time window in milliseconds (10 seconds)
  WINDOW_MS: 10000,
  // Cooldown message shown to rate-limited users
  COOLDOWN_MESSAGE: 'Slow down! You\'re sending messages too fast.'
};

// ===========================================
// MESSAGE CONSTRAINTS
// ===========================================
//
// Why enforce limits?
// - Prevents memory exhaustion from oversized messages
// - Ensures consistent UX across clients
// - Protects against payload-based attacks
//
const MESSAGE = {
  // Maximum characters per message
  MAX_LENGTH: 1000,
  // Minimum characters (prevents empty-ish messages)
  MIN_LENGTH: 1,
  // Maximum messages stored per room (older messages are discarded)
  HISTORY_LIMIT: 100
};

// ===========================================
// ROOM CONFIGURATION
// ===========================================
//
// Why room limits?
// - Prevents resource exhaustion from abandoned rooms
// - Ensures fair resource distribution
//
const ROOM = {
  // Maximum users per room (0 = unlimited)
  MAX_USERS: 50,
  // Room auto-destroy delay after last user leaves (ms)
  // Set to 0 for immediate cleanup
  CLEANUP_DELAY_MS: 0,
  // Maximum rooms that can exist simultaneously (0 = unlimited)
  MAX_ROOMS: 1000
};

// ===========================================
// USERNAME CONSTRAINTS
// ===========================================
const USERNAME = {
  MAX_LENGTH: 20,
  MIN_LENGTH: 1,
  // Regex pattern for allowed characters (alphanumeric, underscore, dash)
  PATTERN: /^[a-zA-Z0-9_-]+$/
};

module.exports = {
  PORT,
  CORS_ORIGIN,
  RATE_LIMIT,
  MESSAGE,
  ROOM,
  USERNAME
};
