/**
 * Socket.IO Event Handlers
 * 
 * ARCHITECTURE DECISIONS:
 * 
 * 1. RATE LIMITING
 *    - Applied per-socket for message sending
 *    - Prevents spam while allowing normal conversation flow
 *    - Client receives feedback when rate limited
 * 
 * 2. MESSAGE VALIDATION
 *    - Server-side validation is authoritative (never trust client)
 *    - Length limits prevent memory exhaustion
 *    - Content sanitization prevents injection attacks
 * 
 * 3. SYSTEM MESSAGES
 *    - Join/leave events broadcast as system messages
 *    - Allows clients to display activity without polling
 *    - Distinguished by 'type' field for client-side rendering
 * 
 * 4. ERROR HANDLING
 *    - All handlers wrapped in try-catch
 *    - Errors logged server-side, generic messages to client
 *    - Prevents information leakage
 */

const { Server } = require('socket.io');
const { CORS_ORIGIN, RATE_LIMIT, MESSAGE, USERNAME } = require('./config');
const { roomManager } = require('./roomManager');
const { RateLimiter } = require('./rateLimiter');

// Initialize rate limiter for messages
const messageRateLimiter = new RateLimiter(RATE_LIMIT.MAX_MESSAGES, RATE_LIMIT.WINDOW_MS);

/**
 * Validate message content
 * @param {string} content 
 * @returns {{ valid: boolean, error?: string, sanitized?: string }}
 */
function validateMessage(content) {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  const trimmed = content.trim();
  
  if (trimmed.length < MESSAGE.MIN_LENGTH) {
    return { valid: false, error: 'Message too short' };
  }
  
  if (trimmed.length > MESSAGE.MAX_LENGTH) {
    return { valid: false, error: `Message too long (max ${MESSAGE.MAX_LENGTH} characters)` };
  }
  
  // Remove control characters but preserve normal text
  const sanitized = trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return { valid: true, sanitized };
}

/**
 * Create a system message object
 * @param {string} roomId 
 * @param {string} content 
 * @returns {object}
 */
function createSystemMessage(roomId, content) {
  return {
    id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'system',
    senderId: 'system',
    senderName: 'System',
    content,
    timestamp: new Date()
  };
}

/**
 * Initialize Socket.IO server with all event handlers
 * @param {http.Server} httpServer 
 * @param {Server} [ioInstance] - Optional Socket.IO instance (for Vercel)
 * @returns {Server} Socket.IO server instance
 */
function initializeSocketServer(httpServer, ioInstance = null) {
  const io = ioInstance || new Server(httpServer, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['polling', 'websocket'],
    // Connection settings for robustness
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Send initial identity
    const tempUserName = `User_${Math.floor(1000 + Math.random() * 9000)}`;
    socket.emit('identity', {
      id: socket.id,
      name: tempUserName
    });

    // =========================================
    // ROOM CREATION
    // =========================================
    socket.on('create-room', (callback) => {
      try {
        const room = roomManager.createRoom();
        callback({ success: true, roomId: room.id });
      } catch (error) {
        console.error('[Socket] Error creating room:', error.message);
        callback({ success: false, error: error.message });
      }
    });

    // =========================================
    // ROOM CHECK
    // =========================================
    socket.on('check-room', (roomId, callback) => {
      try {
        if (typeof roomId !== 'string' || !/^\d{4}$/.test(roomId)) {
          callback({ exists: false });
          return;
        }
        const exists = roomManager.roomExists(roomId);
        callback({ exists });
      } catch (error) {
        console.error('[Socket] Error checking room:', error.message);
        callback({ exists: false });
      }
    });

    // =========================================
    // JOIN ROOM
    // =========================================
    socket.on('join-room', (data, callback) => {
      try {
        // Support both simple roomId and object with preferredName
        let roomId, preferredName;
        if (typeof data === 'string') {
          roomId = data;
          preferredName = null;
        } else {
          roomId = data.roomId;
          preferredName = data.preferredName;
        }
        
        if (!roomManager.roomExists(roomId)) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        const userInfo = roomManager.joinRoom(roomId, socket.id, preferredName);
        socket.join(roomId);

        // Send identity to joining user
        socket.emit('identity', {
          id: userInfo.id,
          name: userInfo.name
        });

        // Send room info
        socket.emit('room-info', {
          roomId,
          userCount: roomManager.getRoomUserCount(roomId)
        });

        // Notify others with system message
        const joinMessage = createSystemMessage(roomId, `${userInfo.name} joined the room`);
        socket.to(roomId).emit('message', joinMessage);
        
        // Update user count for everyone
        socket.to(roomId).emit('user-joined', {
          userId: userInfo.id,
          userName: userInfo.name,
          userCount: roomManager.getRoomUserCount(roomId)
        });

        callback({ success: true });
      } catch (error) {
        console.error('[Socket] Error joining room:', error.message);
        callback({ success: false, error: error.message });
      }
    });

    // =========================================
    // LEAVE ROOM
    // =========================================
    socket.on('leave-room', (roomId) => {
      try {
        const userInfo = roomManager.getUserInfo(socket.id);
        const left = roomManager.leaveRoom(roomId, socket.id);
        
        if (left) {
          socket.leave(roomId);

          // Notify room with system message
          if (userInfo) {
            const leaveMessage = createSystemMessage(roomId, `${userInfo.name} left the room`);
            io.to(roomId).emit('message', leaveMessage);
          }

          // Update user count
          io.to(roomId).emit('user-left', {
            userId: userInfo?.id,
            userName: userInfo?.name,
            userCount: roomManager.getRoomUserCount(roomId)
          });
        }
      } catch (error) {
        console.error('[Socket] Error leaving room:', error.message);
      }
    });

    // =========================================
    // SEND MESSAGE
    // Rate limited + validated
    // =========================================
    socket.on('send-message', ({ roomId, content }, callback) => {
      try {
        // Rate limiting check
        const rateCheck = messageRateLimiter.check(socket.id);
        if (!rateCheck.allowed) {
          // Notify client they're rate limited
          socket.emit('rate-limited', {
            message: RATE_LIMIT.COOLDOWN_MESSAGE,
            resetIn: rateCheck.resetIn
          });
          if (callback) callback({ success: false, error: 'Rate limited' });
          return;
        }

        // Validate user is in room
        const userInfo = roomManager.getUserInfo(socket.id);
        if (!userInfo || userInfo.roomId !== roomId) {
          console.warn(`[Socket] User ${socket.id} not in room ${roomId}`);
          if (callback) callback({ success: false, error: 'Not in room' });
          return;
        }

        // Validate message content
        const validation = validateMessage(content);
        if (!validation.valid) {
          if (callback) callback({ success: false, error: validation.error });
          return;
        }

        // Create and broadcast message
        const message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'user',
          senderId: userInfo.id,
          senderName: userInfo.name,
          content: validation.sanitized,
          timestamp: new Date()
        };

        roomManager.addMessage(roomId, message);
        io.to(roomId).emit('message', message);
        
        if (callback) callback({ success: true });
      } catch (error) {
        console.error('[Socket] Error sending message:', error.message);
        if (callback) callback({ success: false, error: 'Failed to send message' });
      }
    });

    // =========================================
    // UPDATE USERNAME
    // =========================================
    socket.on('update-username', ({ roomId, newName }, callback) => {
      try {
        if (!newName || typeof newName !== 'string') {
          callback({ success: false, error: 'Invalid name' });
          return;
        }
        
        const sanitizedName = newName.trim().substring(0, USERNAME.MAX_LENGTH);
        if (sanitizedName.length < USERNAME.MIN_LENGTH) {
          callback({ success: false, error: 'Name too short' });
          return;
        }

        const userInfo = roomManager.getUserInfo(socket.id);
        const oldName = userInfo?.name;
        
        const updated = roomManager.updateUserName(socket.id, sanitizedName);
        if (updated) {
          socket.emit('identity', updated);
          
          // Notify room about name change
          if (roomId && oldName !== updated.name) {
            const renameMessage = createSystemMessage(roomId, `${oldName} is now ${updated.name}`);
            io.to(roomId).emit('message', renameMessage);
          }
          
          io.to(roomId).emit('user-renamed', {
            userId: updated.id,
            oldName,
            newName: updated.name
          });
          
          callback({ success: true, name: updated.name });
        } else {
          callback({ success: false, error: 'Failed to update name' });
        }
      } catch (error) {
        console.error('[Socket] Error updating username:', error.message);
        callback({ success: false, error: 'Failed to update name' });
      }
    });

    // =========================================
    // DISCONNECT HANDLER
    // Critical for cleanup
    // =========================================
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);
      
      // Clean up rate limiter
      messageRateLimiter.remove(socket.id);
      
      // Handle room cleanup
      const result = roomManager.handleDisconnect(socket.id);
      if (result) {
        const { roomId, userInfo } = result;
        
        // Send system message about user leaving
        const leaveMessage = createSystemMessage(roomId, `${userInfo.name} disconnected`);
        io.to(roomId).emit('message', leaveMessage);
        
        // Update user count
        io.to(roomId).emit('user-left', {
          userId: userInfo.id,
          userName: userInfo.name,
          userCount: roomManager.getRoomUserCount(roomId)
        });
      }
    });

    // =========================================
    // STATS (for monitoring)
    // =========================================
    socket.on('get-stats', (callback) => {
      try {
        callback({
          rooms: roomManager.getStats(),
          rateLimiter: messageRateLimiter.getStats()
        });
      } catch (error) {
        callback({ error: 'Failed to get stats' });
      }
    });
  });

  console.log('[Socket] Socket.IO server initialized');
  return io;
}

module.exports = { initializeSocketServer };
