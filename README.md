<div align="center">

# 🔷 FOURBYTE

### Anonymous, Real-Time Room-Based Chat Application

*No login. No database. Just pure, ephemeral conversation.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)](https://angular.io/)

[Live Demo](#) | [Report Bug](../../issues) | [Request Feature](../../issues)

</div>

---

## 🎯 About

**FOURBYTE** is a minimalist, privacy-first chat application where conversations happen in real-time within ephemeral rooms. No account creation, no data persistence—just instant, anonymous communication.

### ✨ Key Features

- 🎭 **Fully Anonymous** - No registration, no tracking, no data storage
- 🔢 **4-Digit Room Codes** - Simple, memorable room identifiers
- ⚡ **Real-Time Messaging** - Powered by WebSocket technology
- 🎨 **Terminal Noir Design** - Distinctive, typography-first interface
- 🔄 **Auto-Reconnection** - Seamless recovery from network issues
- 🛡️ **Rate Limiting** - Built-in spam protection
- 📱 **Responsive Design** - Works on all devices
- 💨 **Ephemeral Rooms** - Auto-cleanup when empty

---

## 🛠️ Tech Stack

<div align="center">

### Frontend
![Angular](https://img.shields.io/badge/Angular_21-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-B7178C?style=for-the-badge&logo=reactivex&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io_Client-010101?style=for-the-badge&logo=socket.io&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

### Deployment
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

</div>

---

## 📁 Project Structure

```
Fourbyte/
├── client/                      # Angular 21 Frontend
│   ├── src/
│   │   └── app/
│   │       ├── components/
│   │       │   ├── landing/            # Landing page (/)
│   │       │   ├── start-chat/         # Create/Join room (/start)
│   │       │   └── chat-room/          # Active chat (/chat/:roomId)
│   │       └── services/
│   │           └── socket.ts           # Socket.IO service
│   └── package.json
│
├── server/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── index.js                    # Express server entry
│   │   ├── config.js                   # Configuration
│   │   ├── socket.js                   # Socket.IO handlers
│   │   ├── roomManager.js              # Room management
│   │   └── rateLimiter.js              # Rate limiting
│   └── package.json
│
├── .gitignore                   # Git ignore rules
├── vercel.json                  # Vercel deployment config
├── LICENSE                      # MIT License
└── README.md                    # You are here
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **Angular CLI** (optional, will use npx)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fourbyte.git
   cd fourbyte
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running Locally

You'll need **two terminal windows**:

#### Terminal 1: Start the Backend Server
```bash
cd server
npm start
```
Server will run on **http://localhost:3000**

#### Terminal 2: Start the Frontend
```bash
cd client
npx ng serve
```
Client will run on **http://localhost:4200**

### 🎉 Open Your Browser

Navigate to **http://localhost:4200** and start chatting!

---

## 📡 API Reference

### Socket.IO Events

#### Client → Server

| Event | Payload | Response | Description |
|-------|---------|----------|-------------|
| `create-room` | - | `{ success, roomId }` | Create new 4-digit room |
| `check-room` | `roomId: string` | `{ exists: boolean }` | Check if room exists |
| `join-room` | `{ roomId, preferredName? }` | `{ success, error? }` | Join existing room |
| `leave-room` | `roomId: string` | - | Leave current room |
| `send-message` | `{ roomId, content }` | - | Send message to room |
| `update-name` | `{ roomId, newName }` | - | Change username |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `identity` | `{ id, name }` | Initial user identity |
| `room-info` | `{ roomId, userCount }` | Room metadata update |
| `message` | `{ id, type, senderId, senderName, content, timestamp }` | New message (user or system) |
| `user-joined` | `{ userId, userName, userCount }` | User joined room |
| `user-left` | `{ userId, userName, userCount }` | User left room |
| `user-renamed` | `{ userId, oldName, newName }` | User changed name |
| `rate-limit` | `{ message, resetIn }` | Rate limit warning |

---

## 🔧 Configuration

### Server Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=3000
CORS_ORIGIN=http://localhost:4200
```

For production, set:
```env
PORT=3000
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### Client Configuration

Update the Socket.IO server URL in `client/src/app/services/socket.ts`:

```typescript
private readonly SERVER_URL = 'http://localhost:3000'; // Development
// private readonly SERVER_URL = 'https://your-api.vercel.app'; // Production
```

### Rate Limiting

Configured in `server/src/config.js`:

```javascript
RATE_LIMIT: {
  MAX_MESSAGES: 10,      // Max messages
  WINDOW_MS: 10000       // Per 10 seconds
}
```

---

## 🌐 Deployment

### Client (Frontend): Vercel

**Deploy frontend to Vercel:**

```bash
cd client
npx vercel --prod
```

Your client will be live at: `https://fourbyte.vercel.app`

### Server (Backend): Railway

**Vercel cannot host Socket.IO** due to serverless limitations. Deploy server to Railway:

#### Option 1: Railway CLI (Fastest)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from server directory
cd server
railway init
railway up

# Set environment variable
railway variables set CORS_ORIGIN=https://fourbyte.vercel.app

# Get your server URL
railway domain
```

#### Option 2: Railway Dashboard

1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo, root directory: `server`
4. Add environment variable: `CORS_ORIGIN=https://fourbyte.vercel.app`
5. Click "Deploy"

### Update Client with Server URL

After Railway deployment:

1. Copy your Railway URL (e.g., `https://fourbyte-server-production.up.railway.app`)
2. Edit `client/src/app/services/socket.ts` line 72:
   ```typescript
   private readonly SERVER_URL = 'https://fourbyte-server-production.up.railway.app';
   ```
3. Redeploy client: `cd client && npx vercel --prod`

**See [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md) for detailed instructions.**

---

## 🎨 Design System: "Terminal Noir"

FOURBYTE uses a distinctive aesthetic inspired by terminal interfaces:

- **Colors**: Deep blacks (#0a0a0a), off-whites (#e8e4df), accent lime (#c8ff00)
- **Typography**: Syne (display), JetBrains Mono (monospace)
- **Philosophy**: Typography-first, no message bubbles, clean metadata separation
- **Motion**: Subtle, purposeful animations using expo easing

---

## 🔒 Security & Privacy

- ✅ **No user data stored** - Everything lives in memory
- ✅ **Rate limiting** - Token bucket algorithm prevents spam
- ✅ **Message validation** - Max length + sanitization
- ✅ **CORS protection** - Configurable origin whitelist
- ✅ **Auto room cleanup** - 30-second grace period after last user leaves
- ✅ **No persistent logs** - Messages disappear when room closes

---

## 🛣️ Roadmap

- [ ] End-to-end encryption
- [ ] File/image sharing
- [ ] Typing indicators
- [ ] User presence (online/away)
- [ ] Room passwords (optional)
- [ ] Message reactions
- [ ] Dark/light theme toggle
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Socket.IO](https://socket.io/) - Real-time communication
- [Angular](https://angular.io/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework
- [Vercel](https://vercel.com/) - Hosting platform

---

<div align="center">

### Made with ❤️ for the open web

**[⬆ Back to Top](#-fourbyte)**

</div>
