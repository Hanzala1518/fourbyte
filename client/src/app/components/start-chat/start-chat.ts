import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-start-chat',
  imports: [FormsModule, CommonModule],
  templateUrl: './start-chat.html',
  styleUrl: './start-chat.css',
})
export class StartChat implements OnInit, OnDestroy {
  roomCode = '';
  errorMessage = '';
  isConnected = false;
  isCreating = false;
  isJoining = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.socketService.connect();
    this.subscriptions.push(
      this.socketService.connected$.subscribe(connected => {
        this.isConnected = connected;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  createRoom(): void {
    if (!this.isConnected || this.isCreating) {
      return;
    }

    this.errorMessage = '';
    this.isCreating = true;
    
    this.socketService.createRoom().subscribe({
      next: (roomId) => {
        this.router.navigate(['/chat', roomId]);
      },
      error: (err) => {
        this.errorMessage = typeof err === 'string' ? err : 'Failed to create room';
        this.isCreating = false;
      }
    });
  }

  joinRoom(): void {
    if (!this.isConnected || this.isJoining) {
      return;
    }

    // Validate: exactly 4 digits
    const sanitized = this.roomCode.replace(/\D/g, '');
    if (sanitized.length !== 4) {
      this.errorMessage = 'Enter a 4-digit code';
      return;
    }

    this.errorMessage = '';
    this.isJoining = true;
    
    this.socketService.checkRoom(sanitized).subscribe({
      next: (exists) => {
        if (exists) {
          this.router.navigate(['/chat', sanitized]);
        } else {
          this.errorMessage = 'Room does not exist';
          this.isJoining = false;
        }
      },
      error: () => {
        this.errorMessage = 'Connection error';
        this.isJoining = false;
      }
    });
  }

  // Handle input: only allow digits
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
    this.roomCode = input.value;
  }

  // Clear error on new input
  clearError(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  // Navigate back to landing
  goBack(): void {
    this.router.navigate(['/']);
  }
}
