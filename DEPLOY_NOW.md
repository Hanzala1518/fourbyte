# Quick Deployment Commands

## BEFORE DEPLOYING: Set Environment Variable

**CRITICAL STEP** - Go to Vercel Dashboard:
1. Visit: https://vercel.com/dashboard
2. Click on `fourbyte-server` project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - Name: `CORS_ORIGIN`
   - Value: `https://fourbyte.vercel.app`
   - Environments: ✅ Production ✅ Preview ✅ Development
5. Click **Save**

## Deploy Commands

### 1. Deploy Server (with Socket.IO fix)
```powershell
cd server
vercel --prod
```

### 2. Deploy Client
```powershell
cd ../client
vercel --prod
```

## Test After Deployment

### Test Server Health
```powershell
curl https://fourbyte-server.vercel.app/health
```

Expected output:
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T...",
  "message": "FOURBYTE server is running",
  "transport": "Socket.IO configured for Vercel"
}
```

### Test Client
1. Open: https://fourbyte.vercel.app
2. Open Console (F12)
3. Look for: `[Socket] Connected with ID: ...`
4. Should NOT see WebSocket errors

## What Changed?

✅ Socket.IO now uses **HTTP long-polling first** instead of WebSocket
✅ Polling is more reliable on Vercel serverless
✅ Still upgrades to WebSocket when available
✅ Added connection state recovery
✅ Increased timeouts for serverless

## Troubleshooting

**Still see WebSocket errors?**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard reload (Ctrl+Shift+R)

**CORS errors?**
- Double-check CORS_ORIGIN environment variable in Vercel
- Must be exactly: `https://fourbyte.vercel.app` (no trailing slash)
- Redeploy server after changing env vars

**Connection timeout?**
- First request may be slow (cold start)
- Wait 10 seconds and retry

See `VERCEL_SOCKETIO_FIX.md` for detailed explanation.
