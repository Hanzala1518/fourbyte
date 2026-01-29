/**
 * Rate Limiter - Token Bucket Implementation
 * 
 * ARCHITECTURE DECISION:
 * We use a token bucket algorithm because:
 * 1. Simple to implement and understand
 * 2. Allows bursts while enforcing average rate
 * 3. Memory efficient (stores only timestamp + count per user)
 * 4. No external dependencies (Redis, etc.)
 * 
 * TRADE-OFFS:
 * - In-memory storage means limits reset on server restart
 * - Not suitable for distributed systems (would need Redis)
 * - Acceptable for ephemeral chat rooms where persistence isn't needed
 */

class RateLimiter {
  /**
   * @param {number} maxRequests - Maximum requests allowed in window
   * @param {number} windowMs - Time window in milliseconds
   */
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Map of identifier -> { count, windowStart }
    // Using Map for O(1) lookups
    this.clients = new Map();
    
    // Periodic cleanup to prevent memory leaks from disconnected clients
    // Runs every minute to remove stale entries
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request should be allowed
   * @param {string} identifier - Unique client identifier (socket ID)
   * @returns {object} { allowed: boolean, remaining: number, resetIn: number }
   */
  check(identifier) {
    const now = Date.now();
    let client = this.clients.get(identifier);

    // New client or window expired - reset
    if (!client || now - client.windowStart >= this.windowMs) {
      client = { count: 0, windowStart: now };
      this.clients.set(identifier, client);
    }

    // Check if under limit
    if (client.count < this.maxRequests) {
      client.count++;
      return {
        allowed: true,
        remaining: this.maxRequests - client.count,
        resetIn: this.windowMs - (now - client.windowStart)
      };
    }

    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetIn: this.windowMs - (now - client.windowStart)
    };
  }

  /**
   * Remove a client's rate limit tracking (on disconnect)
   * @param {string} identifier 
   */
  remove(identifier) {
    this.clients.delete(identifier);
  }

  /**
   * Clean up stale entries (windows that have long expired)
   * This prevents memory leaks from clients that disconnected
   */
  cleanup() {
    const now = Date.now();
    const staleThreshold = this.windowMs * 2; // Keep for 2x window duration

    for (const [identifier, client] of this.clients.entries()) {
      if (now - client.windowStart > staleThreshold) {
        this.clients.delete(identifier);
      }
    }
  }

  /**
   * Stop the cleanup interval (for graceful shutdown)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get current stats (for monitoring)
   * @returns {object}
   */
  getStats() {
    return {
      trackedClients: this.clients.size,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs
    };
  }
}

module.exports = { RateLimiter };
