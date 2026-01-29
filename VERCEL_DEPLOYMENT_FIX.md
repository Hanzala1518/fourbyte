# 🚀 Vercel Deployment - Fixed Guide

## ⚠️ Important Note About Socket.IO on Vercel

**Vercel Limitation**: Vercel's serverless functions have a 10-second timeout on the Hobby (free) plan, which can cause issues with WebSocket connections. Socket.IO works best on platforms designed for long-running processes.

**Recommended Alternatives for Production**:
- **Railway.app** - Better for WebSockets, $5/month
- **Render.com** - Free tier with good WebSocket support
- **Fly.io** - Excellent for real-time apps

However, you can still deploy to Vercel for testing purposes!

---

## ✅ What Was Fixed

The error `"functions do not allow build property"` happened because:
- ❌ Old config mixed `builds` with `functions` (not allowed)
- ❌ Had conflicting properties

**Fixed by**:
- ✅ Removed `functions` property
- ✅ Simplified configuration
- ✅ Created separate `vercel.json` for server and client

---

## 📋 Option 1: Deploy Server to Vercel (Testing)

### Step 1: Navigate to Server Directory

```powershell
cd C:\Users\hanza\OneDrive\Desktop\Projects\Fourbyte\server
```

### Step 2: Deploy to Vercel

```powershell
# Install Vercel CLI if you haven't
npm install -g vercel

# Deploy
vercel --prod
```

**Follow prompts**:
- Project name: `fourbyte-server` (or your choice)
- Framework: `Other`
- Build command: (leave empty, press Enter)
- Output directory: (leave empty, press Enter)
- Development command: (leave empty, press Enter)

### Step 3: Note Your Server URL

Example: `https://fourbyte-server.vercel.app`

### Step 4: Set Environment Variables

In Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add: `CORS_ORIGIN` = `*` (temporary, will update after client deploy)

### Step 5: Redeploy

```powershell
vercel --prod
```

---

## 📋 Option 2: Deploy Server to Railway (Recommended)

Railway is better for Socket.IO applications!

### Step 1: Create Railway Account

Go to: https://railway.app/

### Step 2: Install Railway CLI

```powershell
# Using npm
npm install -g @railway/cli

# Or download from: https://docs.railway.app/develop/cli
```

### Step 3: Login and Deploy

```powershell
cd C:\Users\hanza\OneDrive\Desktop\Projects\Fourbyte\server

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### Step 4: Set Environment Variables

```powershell
# Set CORS origin
railway variables --set CORS_ORIGIN=*

# Or in Railway dashboard: Variables tab
```

### Step 5: Get Your URL

```powershell
railway domain
```

Example: `https://fourbyte-server-production.up.railway.app`

---

## 📋 Option 3: Deploy Server to Render (Free Tier)

### Step 1: Create Render Account

Go to: https://render.com/

### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `fourbyte-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Step 3: Environment Variables

Add in Render dashboard:
- `CORS_ORIGIN` = `*` (temporary)

### Step 4: Deploy

Click "Create Web Service" - deployment starts automatically!

---

## 📱 Deploy Client (Angular) to Vercel

### Step 1: Update Server URL

First, get your server URL from Railway/Render/Vercel.

Then update `client/src/app/services/socket.ts`:

```typescript
// Line 72 - Change to your deployed server URL
private readonly SERVER_URL = 'https://your-server-url.railway.app';
```

### Step 2: Commit Changes

```powershell
cd C:\Users\hanza\OneDrive\Desktop\Projects\Fourbyte

git add client/src/app/services/socket.ts
git commit -m "Update server URL for production deployment"
git push
```

### Step 3: Deploy Client to Vercel

```powershell
cd client

vercel --prod
```

**Follow prompts**:
- Project name: `fourbyte` or `fourbyte-client`
- Framework: Select `Angular`
- Build command: `npm run build` (should auto-detect)
- Output directory: `dist/client/browser` (should auto-detect)

### Step 4: Note Your Client URL

Example: `https://fourbyte.vercel.app`

### Step 5: Update Server CORS

Go back to your server platform (Railway/Render/Vercel):

**Environment Variables**:
- Update `CORS_ORIGIN` from `*` to `https://fourbyte.vercel.app`

Then redeploy the server.

---

## 🔧 Fix Vercel Server Issues

If you still want to use Vercel for the server, try this:

### Create api/index.js (Serverless Function)

```powershell
cd C:\Users\hanza\OneDrive\Desktop\Projects\Fourbyte\server
mkdir api
```

Create `server/api/index.js`:

```javascript
// Export the Express app for Vercel serverless
const { app } = require('../src/index');

module.exports = app;
```

Update `server/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ]
}
```

---

## 🧪 Testing Your Deployment

### 1. Test Server Health

```powershell
curl https://your-server-url/health
# Should return: {"status":"ok","timestamp":"..."}
```

Or visit in browser: `https://your-server-url/health`

### 2. Test Client

Visit: `https://your-client-url.vercel.app`

Should see the landing page.

### 3. Test Real-Time Chat

1. Open client URL in Browser 1
2. Create a room → Note the 4-digit code
3. Open client URL in Browser 2 (incognito/different browser)
4. Join the same room using the code
5. Send messages → Should appear in both browsers

---

## ❌ Common Deployment Errors

### Error: "Function exceeded timeout"

**Cause**: Vercel free tier has 10s timeout
**Solution**: Use Railway, Render, or Fly.io for server

### Error: "WebSocket connection failed"

**Cause**: Vercel doesn't support long-lived WebSocket connections well
**Solution**: Deploy server to Railway/Render

### Error: "CORS policy blocked"

**Cause**: CORS_ORIGIN not set correctly
**Solution**: 
```powershell
# Set to your client URL
CORS_ORIGIN=https://your-client.vercel.app
```

### Error: "Cannot GET /"

**Cause**: Routes not configured properly
**Solution**: Check `vercel.json` routes are correct

---

## 📊 Deployment Comparison

| Platform | Best For | WebSocket Support | Free Tier | Monthly Cost |
|----------|----------|-------------------|-----------|--------------|
| **Railway** | Socket.IO apps | ✅ Excellent | $5 credit | $5-20 |
| **Render** | Full-stack apps | ✅ Good | ✅ Yes (limited) | Free or $7 |
| **Fly.io** | Real-time apps | ✅ Excellent | Limited | $5-15 |
| **Vercel** | Static sites/APIs | ⚠️ Limited | ✅ Yes | Free or $20 |

**Recommendation**: Use **Railway** or **Render** for server, **Vercel** for client.

---

## ✅ Commit Your Fixes

```powershell
cd C:\Users\hanza\OneDrive\Desktop\Projects\Fourbyte

git add .
git commit -m "Fix Vercel deployment config

- Remove conflicting builds/functions properties
- Add separate vercel.json for server and client
- Simplify configuration for serverless deployment"

git push
```

---

## 📝 Deployment Checklist

After deployment:

- [ ] Server health endpoint works: `/health`
- [ ] Client loads without errors
- [ ] Can create rooms
- [ ] Can join rooms
- [ ] Messages send and receive
- [ ] Works across multiple browsers
- [ ] CORS configured correctly
- [ ] Environment variables set

---

## 🆘 Still Having Issues?

### Quick Debug

```powershell
# Check Vercel logs
vercel logs

# Check deployment status
vercel inspect
```

### Alternative: Use GitHub Integration

1. Go to Vercel Dashboard
2. Import from GitHub
3. Select `fourbyte` repository
4. Configure:
   - Server: Root directory = `server`
   - Client: Root directory = `client`

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app/
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Socket.IO + Vercel: https://socket.io/how-to/use-with-nextjs

---

**🎯 Recommended Deployment Strategy:**

1. ✅ Deploy **server** to **Railway** or **Render** (better for Socket.IO)
2. ✅ Deploy **client** to **Vercel** (perfect for static Angular builds)
3. ✅ Update CORS and URLs accordingly

This gives you the best of both platforms! 🚀
