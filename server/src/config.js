/**
 * FOURBYTE Server Configuration
 * 
 * Centralized configuration for server behavior.
 * All limits and timeouts are defined here for easy tuning.
 */

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===========================================
// SECURITY CONFIGURATION
// ===========================================
const SECURITY = {
  // Maximum connections allowed per IP address
  MAX_CONNECTIONS_PER_IP: parseInt(process.env.MAX_CONNECTIONS_PER_IP) || 5,
  // Event rate limit (non-message events like join, create)
  EVENT_RATE_LIMIT: parseInt(process.env.EVENT_RATE_LIMIT) || 10,
  EVENT_RATE_WINDOW_MS: parseInt(process.env.EVENT_RATE_WINDOW_MS) || 60000
};

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
  MAX_MESSAGES: parseInt(process.env.RATE_LIMIT_MAX) || 10,
  // Time window in milliseconds (10 seconds)
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW) || 10000,
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
  MAX_LENGTH: parseInt(process.env.MESSAGE_MAX_LENGTH) || 1000,
  // Minimum characters (prevents empty-ish messages)
  MIN_LENGTH: 1,
  // Maximum messages stored per room (older messages are discarded)
  HISTORY_LIMIT: parseInt(process.env.MESSAGE_HISTORY_LIMIT) || 100
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
  MAX_USERS: parseInt(process.env.ROOM_MAX_USERS) || 50,
  // Room auto-destroy delay after last user leaves (ms)
  // Set to 0 for immediate cleanup
  CLEANUP_DELAY_MS: parseInt(process.env.ROOM_CLEANUP_DELAY) || 0,
  // Maximum rooms that can exist simultaneously (0 = unlimited)
  MAX_ROOMS: parseInt(process.env.ROOM_MAX_ROOMS) || 1000
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

// ===========================================
// ENVIRONMENT VALIDATION
// ===========================================
// Warn about potential misconfigurations in production
if (NODE_ENV === 'production') {
  if (CORS_ORIGIN === 'http://localhost:4200') {
    console.warn('[Config] WARNING: CORS_ORIGIN is set to localhost in production!');
  }
  if (!process.env.CORS_ORIGIN) {
    console.warn('[Config] WARNING: CORS_ORIGIN not set, using default.');
  }
}

console.log(`[Config] Environment: ${NODE_ENV}`);
console.log(`[Config] CORS Origin: ${CORS_ORIGIN}`);
console.log(`[Config] Rate Limit: ${RATE_LIMIT.MAX_MESSAGES} msgs per ${RATE_LIMIT.WINDOW_MS}ms`);

module.exports = {
  PORT,
  CORS_ORIGIN,
  NODE_ENV,
  SECURITY,
  RATE_LIMIT,
  MESSAGE,
  ROOM,
  USERNAME
};
