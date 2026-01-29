/**
 * Socket Service
 * 
 * ARCHITECTURE DECISIONS:
 * 
 * 1. RECONNECTION STRATEGY
 *    - Socket.IO handles reconnection automatically
 *    - We track connection state and re-join rooms on reconnect
 *    - Pending room stored to survive brief disconnects
 * 
 * 2. SESSION PERSISTENCE
 *    - Username stored in sessionStorage (survives refresh, not tab close)
 *    - SessionStorage chosen over localStorage for privacy (ephemeral chat)
 *    - Sent as preferredName when joining rooms
 * 
 * 3. OBSERVABLE PATTERN
 *    - RxJS Subjects for reactive data flow
 *    - Components subscribe to streams, no direct socket access
 *    - Clean separation of concerns
 * 
 * 4. SYSTEM MESSAGES
 *    - Distinguished by 'type' field
 *    - Same stream as user messages for unified display
 *    - Client can filter/style based on type
 */

import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

// Message types for distinguishing user vs system messages
export type MessageType = 'user' | 'system';

export interface ChatMessage {
  id: string;
  type?: MessageType;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

export interface RoomInfo {
  roomId: string;
  userCount: number;
}

// User join/leave event for system messages
export interface UserEvent {
  userId: string;
  userName: string;
  userCount: number;
}

// Rate limit notification from server
interface RateLimitInfo {
  message: string;
  resetIn: number;
}

// Session storage keys
const SESSION_KEYS = {
  USERNAME: 'fourbyte_username',
  LAST_ROOM: 'fourbyte_last_room'
} as const;

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly SERVER_URL = 'http://localhost:3000';
  
  // Reconnection state
  private pendingRoomId: string | null = null;
  private isReconnecting = false;
  
  // RxJS Subjects for reactive streams
  private messagesSubject = new Subject<ChatMessage>();
  private roomInfoSubject = new BehaviorSubject<RoomInfo | null>(null);
  private userIdSubject = new BehaviorSubject<string | null>(null);
  private userNameSubject = new BehaviorSubject<string | null>(null);
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private rateLimitSubject = new Subject<RateLimitInfo>();
  private userEventSubject = new Subject<{ type: 'joined' | 'left' | 'renamed', event: UserEvent }>();

  // Public observables for components
  public messages$ = this.messagesSubject.asObservable();
  public roomInfo$ = this.roomInfoSubject.asObservable();
  public userId$ = this.userIdSubject.asObservable();
  public userName$ = this.userNameSubject.asObservable();
  public connected$ = this.connectionSubject.asObservable();
  public rateLimit$ = this.rateLimitSubject.asObservable();
  public userEvents$ = this.userEventSubject.asObservable();

  /**
   * Get stored username from session
   */
  getStoredUserName(): string | null {
    try {
      return sessionStorage.getItem(SESSION_KEYS.USERNAME);
    } catch {
      return null;
    }
  }

  /**
   * Store username in session
   */
  private storeUserName(name: string): void {
    try {
      sessionStorage.setItem(SESSION_KEYS.USERNAME, name);
    } catch {
      // Session storage not available
    }
  }

  /**
   * Store last room ID for potential reconnection
   */
  private storeLastRoom(roomId: string | null): void {
    try {
      if (roomId) {
        sessionStorage.setItem(SESSION_KEYS.LAST_ROOM, roomId);
      } else {
        sessionStorage.removeItem(SESSION_KEYS.LAST_ROOM);
      }
    } catch {
      // Session storage not available
    }
  }

  /**
   * Connect to Socket.IO server
   * Handles initial connection and reconnection logic
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.SERVER_URL, {
      transports: ['websocket', 'polling'],
      // Reconnection settings
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Timeout settings
      timeout: 20000
    });

    // =========================================
    // CONNECTION EVENTS
    // =========================================
    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      this.connectionSubject.next(true);
      
      // If we were in a room before disconnect, try to rejoin
      if (this.isReconnecting && this.pendingRoomId) {
        console.log('[Socket] Reconnecting to room:', this.pendingRoomId);
        this.rejoinRoom(this.pendingRoomId);
      }
      this.isReconnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.connectionSubject.next(false);
      
      // Mark as reconnecting if we were in a room
      const currentRoom = this.roomInfoSubject.getValue();
      if (currentRoom) {
        this.pendingRoomId = currentRoom.roomId;
        this.isReconnecting = true;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    // =========================================
    // IDENTITY
    // =========================================
    this.socket.on('identity', (data: { id: string; name: string }) => {
      this.userIdSubject.next(data.id);
      this.userNameSubject.next(data.name);
      this.storeUserName(data.name);
    });

    // =========================================
    // MESSAGES (both user and system)
    // =========================================
    this.socket.on('message', (message: ChatMessage) => {
      this.messagesSubject.next(message);
    });

    // =========================================
    // ROOM INFO
    // =========================================
    this.socket.on('room-info', (info: RoomInfo) => {
      this.roomInfoSubject.next(info);
      this.storeLastRoom(info.roomId);
    });

    // =========================================
    // USER EVENTS
    // =========================================
    this.socket.on('user-joined', (event: UserEvent) => {
      const current = this.roomInfoSubject.getValue();
      if (current) {
        this.roomInfoSubject.next({ ...current, userCount: event.userCount });
      }
      this.userEventSubject.next({ type: 'joined', event });
    });

    this.socket.on('user-left', (event: UserEvent) => {
      const current = this.roomInfoSubject.getValue();
      if (current) {
        this.roomInfoSubject.next({ ...current, userCount: event.userCount });
      }
      this.userEventSubject.next({ type: 'left', event });
    });

    this.socket.on('user-renamed', (event: { userId: string; oldName: string; newName: string }) => {
      this.userEventSubject.next({ 
        type: 'renamed', 
        event: { userId: event.userId, userName: event.newName, userCount: 0 } 
      });
    });

    // =========================================
    // RATE LIMITING
    // =========================================
    this.socket.on('rate-limited', (info: RateLimitInfo) => {
      this.rateLimitSubject.next(info);
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.roomInfoSubject.next(null);
      this.pendingRoomId = null;
      this.isReconnecting = false;
      this.storeLastRoom(null);
    }
  }

  /**
   * Create a new room
   */
  createRoom(): Observable<string> {
    return new Observable<string>(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.emit('create-room', (response: { success: boolean; roomId?: string; error?: string }) => {
        if (response.success && response.roomId) {
          observer.next(response.roomId);
          observer.complete();
        } else {
          observer.error(response.error || 'Failed to create room');
        }
      });
    });
  }

  /**
   * Join an existing room
   * Sends preferred username from session if available
   */
  joinRoom(roomId: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      const preferredName = this.getStoredUserName();
      const joinData = preferredName 
        ? { roomId, preferredName }
        : roomId;

      this.socket.emit('join-room', joinData, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          this.pendingRoomId = roomId;
          observer.next(true);
          observer.complete();
        } else {
          observer.error(response.error || 'Failed to join room');
        }
      });
    });
  }

  /**
   * Rejoin a room after reconnection
   * Private method used internally
   */
  private rejoinRoom(roomId: string): void {
    if (!this.socket) return;

    const preferredName = this.getStoredUserName();
    const joinData = preferredName 
      ? { roomId, preferredName }
      : roomId;

    this.socket.emit('join-room', joinData, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        console.log('[Socket] Rejoined room:', roomId);
      } else {
        console.error('[Socket] Failed to rejoin room:', response.error);
        this.pendingRoomId = null;
        this.roomInfoSubject.next(null);
      }
    });
  }

  /**
   * Leave current room
   */
  leaveRoom(roomId: string): void {
    if (this.socket) {
      this.socket.emit('leave-room', roomId);
      this.roomInfoSubject.next(null);
      this.pendingRoomId = null;
      this.storeLastRoom(null);
    }
  }

  /**
   * Send a message to the room
   */
  sendMessage(roomId: string, content: string): void {
    if (this.socket) {
      this.socket.emit('send-message', { roomId, content });
    }
  }

  /**
   * Update username
   * Also stores in session for persistence
   */
  updateUserName(roomId: string, newName: string): Observable<string> {
    return new Observable<string>(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.emit('update-username', { roomId, newName }, (response: { success: boolean; name?: string; error?: string }) => {
        if (response.success && response.name) {
          this.userNameSubject.next(response.name);
          this.storeUserName(response.name);
          observer.next(response.name);
          observer.complete();
        } else {
          observer.error(response.error || 'Failed to update name');
        }
      });
    });
  }

  /**
   * Check if a room exists
   */
  checkRoom(roomId: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.emit('check-room', roomId, (response: { exists: boolean }) => {
        observer.next(response.exists);
        observer.complete();
      });
    });
  }
}
