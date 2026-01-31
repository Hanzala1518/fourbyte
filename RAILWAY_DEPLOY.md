# 🚂 Deploy FOURBYTE to Railway (Complete Guide)

This guide covers deploying **both** the backend (Socket.IO server) and frontend (Angular app) to Railway.

---

## 📋 Prerequisites

- A [Railway](https://railway.app) account (free tier available)
- Your code pushed to GitHub

---

## 🖥️ Part 1: Deploy the Backend (Socket.IO Server)

### Step 1: Create a New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `fourbyte` repository
5. Railway will auto-detect the project

### Step 2: Configure Root Directory

**IMPORTANT:** Since this is a monorepo, you need to tell Railway to use the `server` folder.

1. Click on your deployed service
2. Go to **Settings** tab
3. Find **"Root Directory"** under "Source"
4. Set it to: `server`
5. Click **"Trigger Redeploy"** or wait for auto-deploy

### Step 3: Set Environment Variables

1. Go to **Variables** tab
2. Add the following:

| Variable | Value |
|----------|-------|
| `PORT` | `8080` |
| `CORS_ORIGIN` | `https://your-frontend.up.railway.app` (update after frontend deploy) |
| `NODE_ENV` | `production` |

### Step 4: Generate Domain

1. Go to **Settings** tab
2. Under **"Networking"**, click **"Generate Domain"**
3. Copy the URL (e.g., `fourbyte-server-production-abc123.up.railway.app`)

### Step 5: Verify Deployment

Visit: `https://your-domain.up.railway.app/health`

You should see:
```json
{"status":"ok","timestamp":"2026-01-31T..."}
```

---

## 🌐 Part 2: Deploy the Frontend (Angular App)

### Step 1: Create Another Service

1. In the same Railway project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose the same `fourbyte` repository again

### Step 2: Configure Root Directory

1. Click on the new service
2. Go to **Settings** tab
3. Set **"Root Directory"** to: `client`

### Step 3: Configure Build Settings

In the **Settings** tab under **Deploy**:

1. **Build Command**: Leave as auto-detected (npm run build)
2. **Start Command**: `npx serve dist/client/browser -s -l 8080`

### Step 4: Set Environment Variables

Go to **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |

### Step 5: Update Client Server URL

Before deploying, update the server URL in your code:

**File:** `client/src/app/services/socket.ts`

Find the `getServerUrl()` function and update:
```typescript
return 'https://YOUR-BACKEND-URL.up.railway.app';
```

Replace with your actual backend Railway URL from Part 1.

### Step 6: Add serve Package

The frontend needs `serve` to host static files:

```bash
cd client
npm install serve --save
```

Commit and push this change.

### Step 7: Generate Domain

1. Go to **Settings** > **Networking**
2. Click **"Generate Domain"**
3. Copy the frontend URL

### Step 8: Update Backend CORS

Go back to your **backend service** and update the variable:

| Variable | Value |
|----------|-------|
| `CORS_ORIGIN` | `https://your-frontend.up.railway.app` |

---

## 🔧 Alternative: Deploy Server Only (Use Vercel for Frontend)

If you prefer Vercel for the frontend:

### Backend on Railway:
1. Deploy from GitHub
2. Set Root Directory to `server`
3. Set `CORS_ORIGIN=https://fourbyte.vercel.app`

### Frontend on Vercel:
1. Import project to Vercel
2. Set Root Directory to `client`
3. Update `SERVER_URL` in socket.ts to Railway URL
4. Deploy

---

## 📁 Project Structure

```
fourbyte/
├── nixpacks.toml          # Railway build config (root)
├── package.json           # Root with "start" script
├── server/
│   ├── package.json       # Server dependencies
│   ├── railway.json       # Server-specific config
│   └── src/
│       └── index.js       # Entry point
└── client/
    ├── package.json       # Client dependencies
    └── src/
```

---

## 🐛 Troubleshooting

### Error: "Missing script: start"

**Cause:** Railway is running from wrong directory.

**Fix:** 
- Set **Root Directory** to `server` in Railway Settings
- Trigger a new deployment

### Error: CORS errors in browser

**Cause:** `CORS_ORIGIN` doesn't match frontend URL exactly.

**Fix:**
1. Go to backend service > Variables
2. Set `CORS_ORIGIN` to exact frontend URL (no trailing slash!)
3. Trigger redeploy

### Error: WebSocket connection failed

**Cause:** Client pointing to wrong server URL.

**Fix:**
1. Update `getServerUrl()` in `client/src/app/services/socket.ts`
2. Commit and push
3. Wait for frontend to redeploy

### Error: 502 Bad Gateway

**Cause:** Server crashed or wrong port.

**Fix:**
1. Check **Deploy Logs** in Railway dashboard
2. Ensure `PORT=8080` is set
3. Check for startup errors

### Build Succeeds but App Doesn't Work

**Check:**
1. Is the domain generated and public?
2. Are all environment variables set?
3. Does `/health` endpoint respond?

---

## ✅ Deployment Checklist

### Backend:
- [ ] Root Directory = `server`
- [ ] Environment variables: `PORT`, `CORS_ORIGIN`, `NODE_ENV`
- [ ] Domain generated
- [ ] `/health` returns `{"status":"ok"}`

### Frontend:
- [ ] Root Directory = `client`
- [ ] `serve` package added to dependencies
- [ ] Start command: `npx serve dist/client/browser -s -l 8080`
- [ ] Domain generated
- [ ] `SERVER_URL` points to backend

### Final:
- [ ] Backend `CORS_ORIGIN` matches frontend URL
- [ ] Both services show "Active"
- [ ] Can create and join rooms!

---

## 💰 Cost Estimate

**Railway Hobby Plan ($5/month):**
- Backend: ~$2-3/month
- Frontend: ~$1-2/month
- **Total: ~$3-5/month**

**Free Tier:**
- 500 hours/month
- $5 monthly credit
- Good for demos and low traffic

---

## 🎉 Success!

Once deployed, your FOURBYTE app will be live:

| Service | URL |
|---------|-----|
| Backend | `https://fourbyte-server-xxx.up.railway.app` |
| Frontend | `https://fourbyte-client-xxx.up.railway.app` |
| Health Check | `https://[backend]/health` |

Test by:
1. Opening the frontend URL
2. Creating a room
3. Sharing the 4-digit code
4. Chatting anonymously! 🎊
