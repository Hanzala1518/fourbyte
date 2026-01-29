# FOURBYTE Vercel Deployment Fix

## Problem
WebSocket connections failing with error: `WebSocket connection to 'wss://fourbyte-server.vercel.app/socket.io/' failed`

## Root Cause
Vercel's serverless functions have limitations with WebSocket connections. The solution is to:
1. Use HTTP long-polling as the primary transport (more reliable on Vercel)
2. Allow WebSocket upgrades when possible
3. Configure proper CORS settings

## Solution Applied

### 1. Server Changes (`server/api/index.js`)
- ✅ Added Socket.IO initialization with Vercel-compatible settings
- ✅ Set transports to `['polling', 'websocket']` (polling first)
- ✅ Increased timeouts for serverless environment
- ✅ Added connection state recovery for reconnections
- ✅ Configured proper CORS for `https://fourbyte.vercel.app`

### 2. Client Changes (`client/src/app/services/socket.ts`)
- ✅ Updated SERVER_URL to `https://fourbyte-server.vercel.app`
- ✅ Changed transports order to `['polling', 'websocket']` (polling first)
- ✅ Increased timeout from 20s to 30s for serverless
- ✅ Added `upgrade: true` and `rememberUpgrade: true`

### 3. Socket.IO Configuration (`server/src/socket.js`)
- ✅ Updated `initializeSocketServer` to accept optional Socket.IO instance
- ✅ Changed default transports to `['polling', 'websocket']`

## Deployment Steps

### Step 1: Set Vercel Environment Variable

**CRITICAL**: You must set the CORS origin in Vercel dashboard:

1. Go to https://vercel.com/dashboard
2. Select your `fourbyte-server` project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `CORS_ORIGIN`
   - **Value**: `https://fourbyte.vercel.app`
   - **Environments**: Select **Production**, **Preview**, and **Development**
5. Click **Save**

### Step 2: Redeploy Server

```powershell
cd server
vercel --prod
```

The deployment will:
- Use the updated `api/index.js` with Socket.IO
- Apply the CORS_ORIGIN environment variable
- Configure Socket.IO to use polling-first transport

### Step 3: Redeploy Client

```powershell
cd ../client
vercel --prod
```

The client will now connect using HTTP long-polling first, then upgrade to WebSocket if available.

### Step 4: Test Connection

1. Open https://fourbyte.vercel.app in browser
2. Open Developer Console (F12)
3. You should see:
   ```
   [Socket] Connecting to server...
   [Socket] Connected with ID: <socket-id>
   ```
4. Try creating/joining a room and sending messages

## How It Works

### Transport Strategy

**Before (Not Working):**
```typescript
transports: ['websocket', 'polling']  // Tries WebSocket first, fails on Vercel
```

**After (Working):**
```typescript
transports: ['polling', 'websocket']  // Uses polling first, upgrades to WebSocket if possible
```

### Why Polling First?

1. **Vercel Serverless Limitations**: WebSocket connections may time out or fail in serverless environment
2. **HTTP Long-Polling**: Always works on Vercel, provides reliable real-time communication
3. **Automatic Upgrade**: If WebSocket becomes available, Socket.IO will upgrade the connection
4. **Connection State Recovery**: Maintains message history across disconnections

### Performance Impact

- **Latency**: Polling adds ~50-200ms latency vs WebSocket (~10-50ms)
- **Bandwidth**: Slightly higher overhead due to HTTP request headers
- **Reliability**: Much better on Vercel (no connection drops)

For a chat application with typical message frequency, this is acceptable.

## Troubleshooting

### Still Getting WebSocket Errors?

1. **Clear browser cache**: 
   - Press `Ctrl+Shift+Delete`
   - Clear "Cached images and files"
   - Hard reload: `Ctrl+Shift+R`

2. **Check CORS environment variable**:
   ```powershell
   # View logs in Vercel dashboard
   vercel logs fourbyte-server --prod
   ```
   Look for CORS errors

3. **Verify deployment**:
   ```powershell
   # Test health endpoint
   curl https://fourbyte-server.vercel.app/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "message": "FOURBYTE server is running",
     "transport": "Socket.IO configured for Vercel"
   }
   ```

### Connection Timeout?

If you see "Connection timeout" errors:

1. Check if Vercel function is cold-starting (first request can be slow)
2. Increase client timeout in `socket.ts`:
   ```typescript
   timeout: 45000  // Increase from 30s to 45s
   ```

### CORS Errors?

If you see CORS errors in console:

1. Verify `CORS_ORIGIN` is set correctly in Vercel dashboard
2. Make sure it matches your client URL exactly: `https://fourbyte.vercel.app`
3. No trailing slash
4. Redeploy after changing environment variables

## Alternative: Railway Deployment

If you still experience issues with Vercel's serverless limitations, consider deploying the server to Railway:

- **Pros**: Full WebSocket support, no timeouts, persistent connections
- **Cons**: Costs $5/month (Vercel is free)

See `RAILWAY_DEPLOYMENT.md` for Railway setup instructions.

## Verification Checklist

- [ ] CORS_ORIGIN environment variable set in Vercel dashboard
- [ ] Server redeployed with `vercel --prod`
- [ ] Client redeployed with `vercel --prod`
- [ ] Browser cache cleared
- [ ] Health endpoint returns OK: https://fourbyte-server.vercel.app/health
- [ ] Client connects without WebSocket errors
- [ ] Can create/join rooms successfully
- [ ] Messages send and receive in real-time

## Expected Console Output

When working correctly, you should see in browser console:

```
[Socket] Connecting to server...
[Socket] Transport: polling  // ← Using polling first
[Socket] Connected with ID: abc123xyz
[Socket] Upgraded to WebSocket  // ← May upgrade later (optional)
```

You should **NOT** see:
```
❌ WebSocket connection to 'wss://...' failed
❌ websocket error
```

## Summary

The key fix is **changing transport order from WebSocket-first to polling-first**. This works around Vercel's serverless limitations while maintaining real-time functionality. Performance impact is minimal for chat applications.
