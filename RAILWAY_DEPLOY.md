# Deploy FOURBYTE Server to Railway

## Prerequisites
- Railway account (sign up at https://railway.app)
- GitHub repository pushed

## Step-by-Step Deployment

### Method 1: Railway CLI (Recommended - Fastest)

#### 1. Install Railway CLI
```powershell
npm install -g @railway/cli
```

#### 2. Login to Railway
```powershell
railway login
```
A browser window will open. Sign in with GitHub.

#### 3. Navigate to Server Directory
```powershell
cd C:\Users\hanza\OneDrive\Desktop\Projects\Fourbyte\server
```

#### 4. Initialize Railway Project
```powershell
railway init
```
- Select "Create new project"
- Name it: `fourbyte-server`

#### 5. Deploy to Railway
```powershell
railway up
```
Wait 2-3 minutes for deployment to complete.

#### 6. Set Environment Variable
```powershell
railway variables set CORS_ORIGIN=https://fourbyte.vercel.app
```

#### 7. Get Your Server URL
```powershell
railway domain
```
This will give you a URL like: `fourbyte-server-production.up.railway.app`

#### 8. Generate Public Domain
```powershell
railway domain
```
Copy the URL that appears (e.g., `https://fourbyte-server-production-abc123.up.railway.app`)

---

### Method 2: Railway Dashboard (Alternative)

#### 1. Create New Project
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `Hanzala1518/fourbyte`
5. Select the `server` directory as root

#### 2. Configure Project
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### 3. Set Environment Variables
1. Click on your project
2. Go to "Variables" tab
3. Add:
   - Key: `CORS_ORIGIN`
   - Value: `https://fourbyte.vercel.app`
4. Click "Add"

#### 4. Get Your Domain
1. Go to "Settings" tab
2. Scroll to "Domains"
3. Click "Generate Domain"
4. Copy the URL (e.g., `https://fourbyte-server-production-abc123.up.railway.app`)

---

## After Deployment

### Update Client with Railway URL

1. Open `client/src/app/services/socket.ts`
2. Find line 72 (SERVER_URL)
3. Replace with your Railway URL:
```typescript
private readonly SERVER_URL = 'https://fourbyte-server-production-abc123.up.railway.app';
```

### Redeploy Client to Vercel

```powershell
cd C:\Users\hanza\OneDrive\Desktop\Projects\Fourbyte\client
npx vercel --prod
```

---

## Verify Deployment

### Test Server Health
```powershell
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T..."
}
```

### Test in Browser
1. Open: https://fourbyte.vercel.app
2. Open Console (F12)
3. Look for: `[Socket] Connected with ID: ...`
4. Create/join a room
5. Send messages - should work!

---

## Troubleshooting

### "railway: command not found"
Restart your terminal after installing Railway CLI.

### Deployment Fails
Check logs:
```powershell
railway logs
```

### CORS Errors
Make sure CORS_ORIGIN is set correctly:
```powershell
railway variables
```

Should show: `CORS_ORIGIN=https://fourbyte.vercel.app`

---

## Cost

- **Development**: Free
- **Production**: $5/month for usage
- **Always on**: No cold starts
- **Includes**: 
  - WebSocket support
  - Automatic HTTPS
  - Auto-deploy from Git
  - 8GB RAM
  - 8 vCPU

---

## Commands Reference

```powershell
# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# View logs
railway logs

# Set environment variable
railway variables set KEY=VALUE

# Get domain
railway domain

# Open dashboard
railway open
```

---

## Next Steps After Setup

1. ✅ Server deployed on Railway
2. ✅ Client updated with Railway URL
3. ✅ Client redeployed to Vercel
4. ✅ Test Socket.IO connection
5. ✅ Done! Your chat app is live.

---

## Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Verify environment variables: `railway variables`
3. Railway Discord: https://discord.gg/railway
