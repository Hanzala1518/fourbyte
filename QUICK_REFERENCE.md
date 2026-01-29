# 🔷 FOURBYTE - Quick Reference

## 🚀 Quick Start Commands

### Development
```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client  
cd client
npx ng serve
```

**URLs**: 
- Frontend: http://localhost:4200
- Backend: http://localhost:3000
- Health: http://localhost:3000/health

---

## 📦 Installation

### First Time Setup
```bash
# Automated setup (Windows)
setup.bat

# Automated setup (Unix/Mac)
./setup.sh

# Manual setup
cd server && npm install
cd ../client && npm install
```

---

## 📤 Push to GitHub

### Quick Push (After Creating GitHub Repo)
```bash
# In project root
git init
git add .
git commit -m "Initial commit: FOURBYTE anonymous chat app"
git remote add origin https://github.com/YOUR_USERNAME/fourbyte.git
git branch -M main
git push -u origin main
```

**Full Guide**: See [PUSH_TO_GITHUB.md](PUSH_TO_GITHUB.md)

---

## 🌐 Vercel Deployment

### Deploy Server
```bash
cd server
vercel --prod
# Save URL: https://fourbyte-server.vercel.app
```

### Update Client Config
```typescript
// client/src/app/services/socket.ts (line 72)
private readonly SERVER_URL = 'https://fourbyte-server.vercel.app';
```

### Deploy Client
```bash
cd client
vercel --prod
# Save URL: https://fourbyte.vercel.app
```

### Update CORS
```bash
# In Vercel dashboard for server:
# Settings → Environment Variables
CORS_ORIGIN=https://fourbyte.vercel.app
# Then redeploy
```

---

## 🔧 Common Commands

### Build
```bash
# Client production build
cd client
npm run build
# Output: dist/client/browser/
```

### Clean Install
```bash
# Server
cd server
rm -rf node_modules package-lock.json
npm install

# Client
cd client
rm -rf node_modules package-lock.json
npm install
```

### Stop Processes
```powershell
# Windows
Stop-Process -Name node -Force

# Find what's using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

```bash
# Mac/Linux
killall node
# Or specific port
lsof -ti:3000 | xargs kill -9
```

---

## 📁 Project Structure

```
Fourbyte/
├── client/              # Angular frontend
│   └── src/app/
│       ├── components/  # UI components
│       └── services/    # Socket service
├── server/              # Node.js backend  
│   └── src/
│       ├── index.js        # Entry point
│       ├── socket.js       # Socket.IO
│       ├── roomManager.js  # Room logic
│       ├── rateLimiter.js  # Rate limiting
│       └── config.js       # Configuration
├── .github/            # GitHub templates
├── README.md           # Main documentation
├── DEPLOYMENT.md       # Deploy guide
├── TROUBLESHOOTING.md  # Fix common issues
└── vercel.json         # Vercel config
```

---

## 🐛 Quick Fixes

### "ng: command not found"
```bash
npx ng serve  # Use npx instead
```

### Port already in use
```bash
# Windows
Stop-Process -Name node -Force

# Mac/Linux  
killall node
```

### Socket connection failed
1. Check server running: `http://localhost:3000/health`
2. Check `SERVER_URL` in `client/src/app/services/socket.ts`
3. Check browser console for errors

### CORS error
```javascript
// server/src/config.js
CORS_ORIGIN: 'http://localhost:4200'  // Dev
CORS_ORIGIN: 'https://your-app.vercel.app'  // Prod
```

---

## 📊 Configuration

### Environment Variables (.env)
```bash
# Server
PORT=3000
CORS_ORIGIN=http://localhost:4200
```

### Rate Limits (server/src/config.js)
```javascript
RATE_LIMIT: {
  MAX_MESSAGES: 10,    # Messages
  WINDOW_MS: 10000     # Per 10 seconds
}
```

### Socket URL (client/src/app/services/socket.ts)
```typescript
private readonly SERVER_URL = 'http://localhost:3000';
```

---

## 🔗 Important URLs

### Documentation
- 📖 Main: [README.md](README.md)
- 🚀 Deploy: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🔧 Issues: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- 🤝 Contribute: [CONTRIBUTING.md](CONTRIBUTING.md)
- 🎯 Status: [PROJECT_STATUS.md](PROJECT_STATUS.md)

### GitHub
- Issues: `https://github.com/YOUR_USERNAME/fourbyte/issues`
- PRs: `https://github.com/YOUR_USERNAME/fourbyte/pulls`

### Vercel
- Dashboard: https://vercel.com/dashboard
- Server logs: Check deployment logs
- Client logs: Check deployment logs

---

## 📝 Socket.IO Events

### Client → Server
- `create-room` - Create new room
- `check-room` - Check if room exists  
- `join-room` - Join room
- `leave-room` - Leave room
- `send-message` - Send message
- `update-name` - Change username

### Server → Client
- `identity` - User ID & name
- `room-info` - Room metadata
- `message` - New message
- `user-joined` - User joined
- `user-left` - User left
- `user-renamed` - Name changed
- `rate-limit` - Spam warning

---

## 🎨 Design System

**Colors**:
- Background: `#0a0a0a`
- Text: `#e8e4df`  
- Accent: `#c8ff00`

**Fonts**:
- Display: Syne
- Monospace: JetBrains Mono

---

## 📞 Help & Support

**Before asking**:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Search existing [GitHub issues](../../issues)
3. Check browser console for errors

**Get help**:
- Create [new issue](../../issues/new/choose)
- Tag appropriately: `bug`, `question`, `enhancement`

---

**Last Updated**: January 28, 2026
**Version**: 1.0.0
