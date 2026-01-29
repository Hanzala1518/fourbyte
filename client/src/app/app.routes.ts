import { Routes } from '@angular/router';

import { Landing } from './components/landing/landing';
import { StartChat } from './components/start-chat/start-chat';
import { ChatRoom } from './components/chat-room/chat-room';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'start', component: StartChat },
  { path: 'chat/:roomId', component: ChatRoom },
  { path: '**', redirectTo: '' }
];
