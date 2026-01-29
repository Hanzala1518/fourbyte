/**
 * In-memory Room Manager
 * 
 * ARCHITECTURE DECISIONS:
 * 
 * 1. WHY IN-MEMORY?
 *    - Rooms are ephemeral by design (no persistence needed)
 *    - Simplifies architecture (no database dependencies)
 *    - Fast O(1) lookups with Map data structures
 *    - Acceptable trade-off: data lost on server restart
 * 
 * 2. WHY SINGLETON?
 *    - Single source of truth for room state
 *    - Avoids synchronization issues between instances
 *    - Easy to access from socket handlers
 * 
 * 3. DATA STRUCTURE CHOICES:
 *    - Map for rooms: O(1) lookup by roomId
 *    - Map for userSockets: O(1) lookup for disconnect handling
 *    - Dual tracking allows efficient cleanup from either direction
 */

const { ROOM, MESSAGE, USERNAME } = require('./config');

class RoomManager {
  constructor() {
    // Primary data stores
    // rooms: roomId -> Room object
    this.rooms = new Map();
    // userSockets: socketId -> { roomId, userId, userName }
    // Reverse index for efficient disconnect handling
    this.userSockets = new Map();
    
    // Cleanup timers for delayed room destruction
    // roomId -> timeoutId
    this.cleanupTimers = new Map();
  }

  /**
   * Generate a unique 4-digit room code
   * 
   * WHY 4 DIGITS?
   * - Easy to communicate verbally
   * - 9000 possible codes (1000-9999) is sufficient for expected load
   * - Collision handled by retry loop
   * 
   * @returns {string} 4-digit room code
   */
  generateRoomCode() {
    // Guard against infinite loop if all codes are taken
    const maxAttempts = 100;
    let attempts = 0;
    let code;
    
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique room code. Server at capacity.');
      }
    } while (this.rooms.has(code));
    
    return code;
  }

  /**
   * Generate anonymous username
   * @returns {string} Anonymous username like "User_1234"
   */
  generateUserName() {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `User_${suffix}`;
  }

  /**
   * Validate and sanitize username
   * @param {string} name 
   * @returns {string|null} Sanitized name or null if invalid
   */
  sanitizeUserName(name) {
    if (!name || typeof name !== 'string') {
      return null;
    }
    
    // Trim and limit length
    const sanitized = name.trim().substring(0, USERNAME.MAX_LENGTH);
    
    if (sanitized.length < USERNAME.MIN_LENGTH) {
      return null;
    }
    
    // For now, allow most characters but strip control characters
    // This is more permissive than the config pattern to support international names
    return sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  }

  /**
   * Create a new room
   * 
   * ROOM LIFECYCLE:
   * 1. Created when first user requests
   * 2. Active while users are present
   * 3. Destroyed when last user leaves (immediate or delayed based on config)
   * 
   * @returns {object} Room object with roomId
   */
  createRoom() {
    // Check room limit
    if (ROOM.MAX_ROOMS > 0 && this.rooms.size >= ROOM.MAX_ROOMS) {
      throw new Error('Server at capacity. Please try again later.');
    }
    
    const roomId = this.generateRoomCode();
    const room = {
      id: roomId,
      users: new Map(), // socketId -> { id, name }
      createdAt: new Date(),
      messages: []
    };
    
    this.rooms.set(roomId, room);
    console.log(`[RoomManager] Room created: ${roomId}`);
    return room;
  }

  /**
   * Check if a room exists
   * @param {string} roomId 
   * @returns {boolean}
   */
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  /**
   * Get room by ID
   * @param {string} roomId 
   * @returns {object|null}
   */
  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Add user to a room
   * 
   * IMPORTANT: This method handles the case where a user might be
   * in another room already (e.g., stale connection). We clean up
   * the old room membership before adding to the new one.
   * 
   * @param {string} roomId 
   * @param {string} socketId 
   * @param {string} [preferredName] - Optional preferred username (from session)
   * @returns {object} User info { id, name }
   */
  joinRoom(roomId, socketId, preferredName = null) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check room capacity
    if (ROOM.MAX_USERS > 0 && room.users.size >= ROOM.MAX_USERS) {
      throw new Error('Room is full');
    }

    // Cancel any pending cleanup for this room
    this.cancelRoomCleanup(roomId);

    // Check if user is already in another room - clean up first
    const existingUserInfo = this.userSockets.get(socketId);
    if (existingUserInfo && existingUserInfo.roomId !== roomId) {
      this.leaveRoom(existingUserInfo.roomId, socketId);
    }

    // Check if user is already in this room (reconnection scenario)
    if (room.users.has(socketId)) {
      return room.users.get(socketId);
    }

    // Generate or use preferred username
    const userId = `user_${socketId.substring(0, 8)}`;
    let userName;
    
    if (preferredName) {
      const sanitized = this.sanitizeUserName(preferredName);
      userName = sanitized || this.generateUserName();
    } else {
      userName = this.generateUserName();
    }
    
    const userInfo = { id: userId, name: userName };
    room.users.set(socketId, userInfo);
    this.userSockets.set(socketId, { roomId, ...userInfo });

    console.log(`[RoomManager] User ${userName} (${socketId}) joined room ${roomId}. Users: ${room.users.size}`);
    return userInfo;
  }

  /**
   * Remove user from a room
   * 
   * CLEANUP STRATEGY:
   * When a room becomes empty, we can either:
   * 1. Delete immediately (CLEANUP_DELAY_MS = 0)
   * 2. Wait a bit for reconnections (CLEANUP_DELAY_MS > 0)
   * 
   * @param {string} roomId 
   * @param {string} socketId 
   * @returns {object|null} Removed user info, or null if not found
   */
  leaveRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    const userInfo = room.users.get(socketId);
    if (!userInfo) {
      return null;
    }
    
    room.users.delete(socketId);
    this.userSockets.delete(socketId);
    
    console.log(`[RoomManager] User ${userInfo.name} left room ${roomId}. Users: ${room.users.size}`);

    // Schedule room cleanup if empty
    if (room.users.size === 0) {
      this.scheduleRoomCleanup(roomId);
    }

    return userInfo;
  }

  /**
   * Schedule room cleanup after delay
   * @param {string} roomId 
   */
  scheduleRoomCleanup(roomId) {
    // Cancel existing timer if any
    this.cancelRoomCleanup(roomId);
    
    if (ROOM.CLEANUP_DELAY_MS <= 0) {
      // Immediate cleanup
      this.destroyRoom(roomId);
    } else {
      // Delayed cleanup - allows for reconnection
      const timerId = setTimeout(() => {
        const room = this.rooms.get(roomId);
        if (room && room.users.size === 0) {
          this.destroyRoom(roomId);
        }
        this.cleanupTimers.delete(roomId);
      }, ROOM.CLEANUP_DELAY_MS);
      
      this.cleanupTimers.set(roomId, timerId);
      console.log(`[RoomManager] Room ${roomId} scheduled for cleanup in ${ROOM.CLEANUP_DELAY_MS}ms`);
    }
  }

  /**
   * Cancel pending room cleanup
   * @param {string} roomId 
   */
  cancelRoomCleanup(roomId) {
    const timerId = this.cleanupTimers.get(roomId);
    if (timerId) {
      clearTimeout(timerId);
      this.cleanupTimers.delete(roomId);
    }
  }

  /**
   * Destroy a room immediately
   * @param {string} roomId 
   */
  destroyRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    
    // Clean up any users still tracked (shouldn't happen, but defensive)
    for (const socketId of room.users.keys()) {
      this.userSockets.delete(socketId);
    }
    
    this.rooms.delete(roomId);
    this.cancelRoomCleanup(roomId);
    
    console.log(`[RoomManager] Room ${roomId} destroyed`);
  }

  /**
   * Handle user disconnect - remove from all rooms
   * 
   * This is the primary cleanup path for abrupt disconnections.
   * Socket.IO calls this when the underlying connection is lost.
   * 
   * @param {string} socketId 
   * @returns {object|null} { roomId, userInfo } if user was in a room
   */
  handleDisconnect(socketId) {
    const userInfo = this.userSockets.get(socketId);
    if (!userInfo) {
      return null;
    }
    
    const { roomId } = userInfo;
    const removedUser = this.leaveRoom(roomId, socketId);
    
    if (removedUser) {
      return { roomId, userInfo: removedUser };
    }
    return null;
  }

  /**
   * Get user count in a room
   * @param {string} roomId 
   * @returns {number}
   */
  getRoomUserCount(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.users.size : 0;
  }

  /**
   * Get user info by socket ID
   * @param {string} socketId 
   * @returns {object|null}
   */
  getUserInfo(socketId) {
    return this.userSockets.get(socketId) || null;
  }

  /**
   * Add message to room history
   * 
   * MEMORY MANAGEMENT:
   * We cap message history to prevent unbounded growth.
   * Old messages are discarded FIFO when limit is reached.
   * 
   * @param {string} roomId 
   * @param {object} message 
   */
  addMessage(roomId, message) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    
    room.messages.push(message);
    
    // Enforce message history limit
    while (room.messages.length > MESSAGE.HISTORY_LIMIT) {
      room.messages.shift();
    }
  }

  /**
   * Update username for a user
   * @param {string} socketId 
   * @param {string} newName 
   * @returns {object|null} Updated user info
   */
  updateUserName(socketId, newName) {
    const sanitizedName = this.sanitizeUserName(newName);
    if (!sanitizedName) {
      return null;
    }
    
    const userInfo = this.userSockets.get(socketId);
    if (!userInfo) {
      return null;
    }

    const room = this.rooms.get(userInfo.roomId);
    if (!room) {
      return null;
    }

    const roomUser = room.users.get(socketId);
    if (roomUser) {
      roomUser.name = sanitizedName;
      userInfo.name = sanitizedName;
      return { id: userInfo.id, name: sanitizedName };
    }
    return null;
  }

  /**
   * Get room statistics (for monitoring/debugging)
   * @returns {object}
   */
  getStats() {
    return {
      totalRooms: this.rooms.size,
      totalUsers: this.userSockets.size,
      pendingCleanups: this.cleanupTimers.size,
      rooms: Array.from(this.rooms.values()).map(room => ({
        id: room.id,
        userCount: room.users.size,
        messageCount: room.messages.length,
        createdAt: room.createdAt
      }))
    };
  }
}

// Singleton instance
const roomManager = new RoomManager();

module.exports = { roomManager, RoomManager };
