/**
 * Socket Service
 *
 * Flexible environment-aware Socket.IO client
 * Works in:
 * - Local development
 * - Railway production
 * - Runtime-injected deployments
 */

import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

// ===============================
// TYPES
// ===============================
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

export interface UserEvent {
  userId: string;
  userName: string;
  userCount: number;
}

interface RateLimitInfo {
  message: string;
  resetIn: number;
}

// ===============================
// SESSION STORAGE KEYS
// ===============================
const SESSION_KEYS = {
  USERNAME: 'fourbyte_username',
  LAST_ROOM: 'fourbyte_last_room'
} as const;

// ===============================
// SERVER URL RESOLUTION (CORE FIX)
// ===============================
const resolveServerUrl = (): string => {
  // 1️⃣ Runtime injected (best for Railway / Docker)
  if (
    typeof window !== 'undefined' &&
    (window as any).__FOURBYTE_SERVER_URL__
  ) {
    return (window as any).__FOURBYTE_SERVER_URL__;
  }

  // 2️⃣ Angular environment files
  if (environment?.SERVER_URL) {
    return environment.SERVER_URL;
  }

  // 3️⃣ Localhost auto-detection
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3000';
    }
  }

  // 4️⃣ Final hard fallback (should almost never be used)
  return 'https://fourbyte-backend.up.railway.app';
};

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly SERVER_URL = resolveServerUrl();

  // ===============================
  // CONNECTION STATE
  // ===============================
  private pendingRoomId: string | null = null;
  private isReconnecting = false;

  // ===============================
  // RXJS STREAMS
  // ===============================
  private messagesSubject = new Subject<ChatMessage>();
  private roomInfoSubject = new BehaviorSubject<RoomInfo | null>(null);
  private userIdSubject = new BehaviorSubject<string | null>(null);
  private userNameSubject = new BehaviorSubject<string | null>(null);
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private rateLimitSubject = new Subject<RateLimitInfo>();
  private userEventSubject = new Subject<{
    type: 'joined' | 'left' | 'renamed';
    event: UserEvent;
  }>();

  // Public observables
  public messages$ = this.messagesSubject.asObservable();
  public roomInfo$ = this.roomInfoSubject.asObservable();
  public userId$ = this.userIdSubject.asObservable();
  public userName$ = this.userNameSubject.asObservable();
  public connected$ = this.connectionSubject.asObservable();
  public rateLimit$ = this.rateLimitSubject.asObservable();
  public userEvents$ = this.userEventSubject.asObservable();

  // ===============================
  // SESSION HELPERS
  // ===============================
  getStoredUserName(): string | null {
    try {
      return sessionStorage.getItem(SESSION_KEYS.USERNAME);
    } catch {
      return null;
    }
  }

  private storeUserName(name: string): void {
    try {
      sessionStorage.setItem(SESSION_KEYS.USERNAME, name);
    } catch {}
  }

  private storeLastRoom(roomId: string | null): void {
    try {
      roomId
        ? sessionStorage.setItem(SESSION_KEYS.LAST_ROOM, roomId)
        : sessionStorage.removeItem(SESSION_KEYS.LAST_ROOM);
    } catch {}
  }

  // ===============================
  // CONNECTION
  // ===============================
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      upgrade: true,
      rememberUpgrade: true,
      path: '/socket.io/',
    });

    this.socket.on('connect', () => {
      this.connectionSubject.next(true);

      if (this.isReconnecting && this.pendingRoomId) {
        this.rejoinRoom(this.pendingRoomId);
      }
      this.isReconnecting = false;
    });

    this.socket.on('disconnect', () => {
      this.connectionSubject.next(false);
      const room = this.roomInfoSubject.getValue();
      if (room) {
        this.pendingRoomId = room.roomId;
        this.isReconnecting = true;
      }
    });

    this.socket.on('identity', (data: { id: string; name: string }) => {
      this.userIdSubject.next(data.id);
      this.userNameSubject.next(data.name);
      this.storeUserName(data.name);
    });

    this.socket.on('message', msg => this.messagesSubject.next(msg));
    this.socket.on('room-info', info => {
      this.roomInfoSubject.next(info);
      this.storeLastRoom(info.roomId);
    });

    this.socket.on('rate-limited', info =>
      this.rateLimitSubject.next(info)
    );
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.roomInfoSubject.next(null);
    this.pendingRoomId = null;
    this.isReconnecting = false;
    this.storeLastRoom(null);
  }

  // ===============================
  // ROOM & MESSAGE APIs
  // ===============================
  createRoom(): Observable<string> {
    return new Observable(observer => {
      this.socket?.emit('create-room', (res: any) =>
        res.success ? observer.next(res.roomId) : observer.error(res.error)
      );
    });
  }

  joinRoom(roomId: string): Observable<boolean> {
    return new Observable(observer => {
      const preferredName = this.getStoredUserName();
      this.socket?.emit(
        'join-room',
        preferredName ? { roomId, preferredName } : roomId,
        (res: any) =>
          res.success ? observer.next(true) : observer.error(res.error)
      );
    });
  }

  private rejoinRoom(roomId: string): void {
    const preferredName = this.getStoredUserName();
    this.socket?.emit(
      'join-room',
      preferredName ? { roomId, preferredName } : roomId
    );
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit('leave-room', roomId);
    this.roomInfoSubject.next(null);
    this.pendingRoomId = null;
    this.storeLastRoom(null);
  }

  sendMessage(roomId: string, content: string): void {
    this.socket?.emit('send-message', { roomId, content });
  }

  updateUserName(roomId: string, newName: string): Observable<string> {
    return new Observable(observer => {
      this.socket?.emit(
        'update-username',
        { roomId, newName },
        (res: any) =>
          res.success
            ? (this.storeUserName(res.name), observer.next(res.name))
            : observer.error(res.error)
      );
    });
  }

  checkRoom(roomId: string): Observable<boolean> {
    return new Observable(observer => {
      this.socket?.emit('check-room', roomId, (res: any) => {
        observer.next(res.exists);
        observer.complete();
      });
    });
  }
}
