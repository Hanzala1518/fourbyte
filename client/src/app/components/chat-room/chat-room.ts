/**
 * Chat Room Component
 * 
 * ROBUSTNESS FEATURES:
 * 1. Handles socket disconnect/reconnect gracefully
 * 2. Displays system messages (join/leave/rename)
 * 3. Shows rate limit warnings
 * 4. Preserves scroll position and message history
 * 5. Session-based username persistence via SocketService
 */

import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SocketService, ChatMessage, RoomInfo, MessageType } from '../../services/socket';
import { Subscription } from 'rxjs';

// Avatar pool: Distinctive geometric symbols, not typical emoji faces
const AVATAR_POOL = ['◆', '◇', '○', '●', '□', '■', '△', '▲', '▽', '▼', '◈', '◉', '◎', '⬡', '⬢', '✦'];

// PERFORMANCE: Maximum messages to keep in memory
const MAX_CLIENT_MESSAGES = 200;

// Extended message with local tracking
interface DisplayMessage extends ChatMessage {
  avatar: string;
  isNew: boolean;
  isSystem: boolean;
}

@Component({
  selector: 'app-chat-room',
  imports: [FormsModule, CommonModule],
  templateUrl: './chat-room.html',
  styleUrl: './chat-room.css',
})
export class ChatRoom implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  
  roomId = '';
  messageContent = '';
  messages: DisplayMessage[] = [];
  roomInfo: RoomInfo | null = null;
  userId: string | null = null;
  userName: string | null = null;
  userAvatar = '◆';
  isConnected = false;
  errorMessage = '';
  
  // Username editing state
  isEditingName = false;
  editNameValue = '';
  
  // Rate limiting feedback
  rateLimitMessage = '';
  private rateLimitTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // Reconnection state
  isReconnecting = false;
  private hasJoinedRoom = false;
  
  // Avatar mapping: senderId -> avatar
  private avatarMap = new Map<string, string>();
  private avatarIndex = 0;
  private shouldScrollToBottom = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    
    if (!this.roomId) {
      this.router.navigate(['/start']);
      return;
    }

    this.socketService.connect();

    // Connection state handling
    this.subscriptions.push(
      this.socketService.connected$.subscribe(connected => {
        const wasDisconnected = this.isConnected && !connected;
        this.isConnected = connected;
        
        if (wasDisconnected) {
          // We just disconnected
          this.isReconnecting = true;
          this.addLocalSystemMessage('Connection lost. Reconnecting...');
        } else if (connected && this.isReconnecting) {
          // We just reconnected
          this.isReconnecting = false;
          this.addLocalSystemMessage('Reconnected');
        } else if (connected && !this.hasJoinedRoom) {
          // Initial connection
          this.joinRoom();
        }
      })
    );

    // Message stream (includes both user and system messages from server)
    this.subscriptions.push(
      this.socketService.messages$.subscribe(message => {
        const displayMessage = this.enhanceMessage(message);
        this.messages.push(displayMessage);
        
        // PERFORMANCE: Trim old messages to prevent memory exhaustion
        while (this.messages.length > MAX_CLIENT_MESSAGES) {
          this.messages.shift();
        }
        
        this.shouldScrollToBottom = true;
        
        // Remove "new" flag after animation
        setTimeout(() => {
          displayMessage.isNew = false;
        }, 500);
      })
    );

    // Room info updates
    this.subscriptions.push(
      this.socketService.roomInfo$.subscribe(info => {
        this.roomInfo = info;
      })
    );

    // User identity
    this.subscriptions.push(
      this.socketService.userId$.subscribe(id => {
        this.userId = id;
        if (id) {
          this.userAvatar = this.getAvatarForUser(id);
        }
      })
    );

    this.subscriptions.push(
      this.socketService.userName$.subscribe(name => {
        this.userName = name;
        this.editNameValue = name || '';
      })
    );

    // Rate limiting feedback
    this.subscriptions.push(
      this.socketService.rateLimit$.subscribe(info => {
        this.showRateLimitWarning(info.message, info.resetIn);
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    if (this.roomId) {
      this.socketService.leaveRoom(this.roomId);
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    if (this.rateLimitTimeout) {
      clearTimeout(this.rateLimitTimeout);
    }
  }

  private joinRoom(): void {
    this.socketService.joinRoom(this.roomId).subscribe({
      next: () => {
        this.errorMessage = '';
        this.hasJoinedRoom = true;
        // Focus input after joining
        setTimeout(() => this.focusInput(), 100);
      },
      error: (err) => {
        this.errorMessage = typeof err === 'string' ? err : 'Failed to join room';
        setTimeout(() => this.router.navigate(['/start']), 2000);
      }
    });
  }

  /**
   * Add a local system message (for connection status, etc.)
   * These are client-side only, not broadcast to other users
   */
  private addLocalSystemMessage(content: string): void {
    const message: DisplayMessage = {
      id: `local_${Date.now()}`,
      type: 'system',
      senderId: 'system',
      senderName: 'System',
      content,
      timestamp: new Date(),
      avatar: '◎',
      isNew: true,
      isSystem: true
    };
    this.messages.push(message);
    this.shouldScrollToBottom = true;
    
    setTimeout(() => {
      message.isNew = false;
    }, 500);
  }

  private enhanceMessage(message: ChatMessage): DisplayMessage {
    const isSystem = message.type === 'system' || message.senderId === 'system';
    return {
      ...message,
      avatar: isSystem ? '◎' : this.getAvatarForUser(message.senderId),
      isNew: true,
      isSystem
    };
  }

  private getAvatarForUser(userId: string): string {
    if (userId === 'system') {
      return '◎';
    }
    if (!this.avatarMap.has(userId)) {
      const avatar = AVATAR_POOL[this.avatarIndex % AVATAR_POOL.length];
      this.avatarMap.set(userId, avatar);
      this.avatarIndex++;
    }
    return this.avatarMap.get(userId)!;
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {
      // Ignore scroll errors
    }
  }

  private focusInput(): void {
    this.messageInput?.nativeElement?.focus();
  }

  private showRateLimitWarning(message: string, resetIn: number): void {
    this.rateLimitMessage = message;
    
    // Clear existing timeout
    if (this.rateLimitTimeout) {
      clearTimeout(this.rateLimitTimeout);
    }
    
    // Auto-hide after reset time + buffer
    this.rateLimitTimeout = setTimeout(() => {
      this.rateLimitMessage = '';
    }, Math.min(resetIn + 1000, 5000));
  }

  sendMessage(): void {
    const content = this.messageContent.trim();
    if (!content || !this.isConnected) {
      return;
    }

    this.socketService.sendMessage(this.roomId, content);
    this.messageContent = '';
    this.focusInput();
  }

  leaveRoom(): void {
    this.socketService.leaveRoom(this.roomId);
    this.router.navigate(['/start']);
  }

  isOwnMessage(message: DisplayMessage): boolean {
    return message.senderId === this.userId;
  }

  // Username editing
  startEditingName(): void {
    this.isEditingName = true;
    this.editNameValue = this.userName || '';
  }

  cancelEditingName(): void {
    this.isEditingName = false;
    this.editNameValue = this.userName || '';
  }

  saveName(): void {
    const newName = this.editNameValue.trim();
    if (!newName || newName === this.userName) {
      this.cancelEditingName();
      return;
    }

    this.socketService.updateUserName(this.roomId, newName).subscribe({
      next: () => {
        this.isEditingName = false;
      },
      error: () => {
        // Revert on error
        this.editNameValue = this.userName || '';
        this.isEditingName = false;
      }
    });
  }

  onNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveName();
    } else if (event.key === 'Escape') {
      this.cancelEditingName();
    }
  }

  // Copy room code to clipboard
  copyRoomCode(): void {
    navigator.clipboard.writeText(this.roomId).catch(() => {
      // Fallback: show code visually
    });
  }

  // Format timestamp
  formatTime(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Track messages by ID for ngFor
  trackByMessageId(index: number, message: DisplayMessage): string {
    return message.id;
  }
}
