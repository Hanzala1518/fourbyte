# 🔧 Troubleshooting Guide

Common issues and their solutions for FOURBYTE development and deployment.

---

## 🚫 Common Issues

### 1. "ng: command not found" or "ng is not recognized"

**Problem**: Angular CLI not installed or not in PATH.

**Solution**:
```bash
# Use npx instead
cd client
npx ng serve

# Or install globally (optional)
npm install -g @angular/cli
```

---

### 2. Port 3000 Already in Use

**Problem**: Another process is using port 3000.

**Solution** (Windows):
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or stop all Node processes
Stop-Process -Name node -Force
```

**Solution** (Mac/Linux):
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

---

### 3. Socket.IO Connection Failed

**Symptoms**:
- Messages not sending
- "Reconnecting..." banner stuck
- Console error: `WebSocket connection failed`

**Solution**:
1. **Check server is running**: Visit http://localhost:3000/health
2. **Check client SERVER_URL**: 
   ```typescript
   // client/src/app/services/socket.ts
   private readonly SERVER_URL = 'http://localhost:3000';
   ```
3. **Check CORS**: Server logs should show successful connection
4. **Disable browser extensions**: Some ad blockers block WebSockets

---

### 4. CORS Policy Error

**Symptoms**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:
1. **Development**: Ensure server `config.js` has:
   ```javascript
   CORS_ORIGIN: 'http://localhost:4200'
   ```

2. **Production**: Set environment variable:
   ```bash
   # Vercel dashboard
   CORS_ORIGIN=https://your-app.vercel.app
   ```

3. **Multiple origins** (not recommended for production):
   ```javascript
   origin: process.env.CORS_ORIGIN || '*'
   ```

---

### 5. Module Not Found Errors

**Problem**: Dependencies not installed.

**Solution**:
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

---

### 6. Build Fails on Vercel

**Problem**: Deployment fails during build.

**Solutions**:
1. **Check Node version**: Vercel uses Node 18 by default
   ```json
   // package.json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

2. **Check build output path**:
   ```json
   // client/angular.json
   "outputPath": "dist/client/browser"
   ```

3. **Environment variables**: Add in Vercel dashboard

4. **Check Vercel logs**: Dashboard → Deployments → Click deployment → View logs

---

### 7. Messages Not Showing Across Browsers

**Problem**: Users in different browsers can't see each other's messages.

**Solution**:
1. **Ensure same room code**: All users must join the same 4-digit room
2. **Check server logs**: Should show multiple connections
3. **Clear browser cache**: Old Socket.IO client might be cached
4. **Try incognito mode**: Rules out extension interference

---

### 8. Username Not Persisting After Refresh

**Problem**: Username resets to random name after page refresh.

**Expected behavior**: Username should persist due to `sessionStorage`.

**Solution**:
1. **Check sessionStorage**: Open DevTools → Application → Session Storage
2. **Should see**: `fourbyte_username` key
3. **If missing**: Browser might have storage disabled
4. **Workaround**: Re-enter desired username (it will persist for session)

---

### 9. Rate Limit Warning Appears Unexpectedly

**Problem**: "Slow down!" warning appears too quickly.

**Configured limit**: 10 messages per 10 seconds.

**Solutions**:
1. **Expected behavior**: This is spam protection working correctly
2. **Wait 10 seconds**: Token bucket refills
3. **Adjust limit** (development only):
   ```javascript
   // server/src/config.js
   RATE_LIMIT: {
     MAX_MESSAGES: 20,    // Increase limit
     WINDOW_MS: 10000
   }
   ```

---

### 10. TypeScript Errors in VS Code

**Problem**: Red squiggles in TypeScript files.

**Solution**:
```bash
# Client
cd client
npm install
# Restart VS Code TypeScript server: Cmd/Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## 🔍 Debugging Tips

### Enable Verbose Socket.IO Logs

**Client** (`socket.ts`):
```typescript
this.socket = io(this.SERVER_URL, {
  transports: ['websocket', 'polling'],
  debug: true  // Add this
});
```

**Server** (`socket.js`):
```javascript
const io = new Server(httpServer, {
  cors: { /* ... */ },
  debug: true  // Add this
});
```

### Check Server Health

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Monitor Socket Events

**Browser DevTools**:
1. Open Console
2. Network tab → WS filter
3. Should see `socket.io` connection

**Server Logs**:
```
[Socket] Client connected: abc123
[Socket] Client joined room: 1234
```

---

## 🆘 Still Having Issues?

1. **Check existing issues**: https://github.com/yourusername/fourbyte/issues
2. **Create new issue**: Use bug report template
3. **Provide details**:
   - OS and browser
   - Node.js version (`node -v`)
   - Console errors (screenshot)
   - Steps to reproduce

---

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Angular Debugging Guide](https://angular.io/guide/debugging)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Vercel Documentation](https://vercel.com/docs)

---

**Pro Tip**: When in doubt, try the classic:
```bash
# Clean install everything
cd server && rm -rf node_modules && npm install
cd ../client && rm -rf node_modules && npm install
```
