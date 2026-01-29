# FOURBYTE Deployment Guide

## 🚀 Quick Deployment to Vercel

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/fourbyte.git
   git push -u origin main
   ```

2. **Deploy Server**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Set Root Directory to `server`
   - Add environment variable: `CORS_ORIGIN` = `*` (or specific domain later)
   - Deploy

3. **Note Your Server URL**
   - Example: `https://fourbyte-server.vercel.app`

4. **Update Client Configuration**
   - Edit `client/src/app/services/socket.ts`
   - Change `SERVER_URL` to your server URL:
     ```typescript
     private readonly SERVER_URL = 'https://fourbyte-server.vercel.app';
     ```
   - Commit and push:
     ```bash
     git add client/src/app/services/socket.ts
     git commit -m "Update server URL for production"
     git push
     ```

5. **Deploy Client**
   - Go to Vercel Dashboard again
   - Click "New Project"
   - Import the same GitHub repository
   - Set Root Directory to `client`
   - Deploy

6. **Update CORS**
   - Go to your server project in Vercel
   - Settings → Environment Variables
   - Update `CORS_ORIGIN` to your client URL (e.g., `https://fourbyte.vercel.app`)
   - Redeploy server

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Server**
   ```bash
   cd server
   vercel --prod
   # Note the deployed URL
   ```

3. **Update Client Config**
   ```typescript
   // client/src/app/services/socket.ts
   private readonly SERVER_URL = 'https://your-server-url.vercel.app';
   ```

4. **Deploy Client**
   ```bash
   cd client
   vercel --prod
   ```

5. **Update Server CORS**
   ```bash
   cd server
   vercel env add CORS_ORIGIN
   # Enter your client URL
   vercel --prod
   ```

## 🔧 Environment Variables

### Server (Required)
- `CORS_ORIGIN` - Frontend URL (e.g., `https://fourbyte.vercel.app`)
- `PORT` - Auto-set by Vercel

### Server (Optional)
- `NODE_ENV` - Set to `production` automatically

## 📝 Post-Deployment Checklist

- [ ] Server health check works: `https://your-server.vercel.app/health`
- [ ] Client loads without errors
- [ ] Can create rooms
- [ ] Can join rooms
- [ ] Messages send/receive properly
- [ ] Multiple users can chat
- [ ] Reconnection works
- [ ] CORS configured correctly

## 🐛 Troubleshooting

### Socket.IO Connection Failed
- Check server URL in `client/src/app/services/socket.ts`
- Verify CORS_ORIGIN environment variable in Vercel
- Check browser console for CORS errors

### Server Timeout
- Vercel has 10s timeout on Hobby plan
- Socket.IO connections may need Pro plan for longer timeouts
- Consider using dedicated Socket.IO hosting (e.g., Railway, Render)

### Environment Variables Not Working
- Redeploy after adding environment variables
- Check spelling and casing (exact match)

## 🎯 Alternative Hosting Options

### Server Alternatives
- **Railway.app** - Better for WebSockets, $5/month
- **Render.com** - Free tier available, good WebSocket support
- **Fly.io** - Excellent for real-time apps
- **Heroku** - Classic choice, easy to set up

### Client Alternatives
- **Netlify** - Great for static sites
- **Cloudflare Pages** - Fast CDN delivery
- **GitHub Pages** - Free for public repos

## 🔒 Production Best Practices

1. **CORS**: Set specific origin, not `*`
2. **Rate Limiting**: Already configured in server
3. **HTTPS**: Vercel provides by default
4. **Monitoring**: Add error tracking (Sentry, LogRocket)
5. **Analytics**: Consider privacy-friendly analytics

## 📊 Monitoring

Add health check monitoring:
- **Uptime Robot** (free)
- **StatusCake** (free tier)
- **Better Uptime** (paid)

Monitor: `https://your-server.vercel.app/health`
