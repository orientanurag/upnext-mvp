# Render Deployment Guide

## Quick Deploy to Render

Follow these steps to deploy UpNext MVP to Render:

### Step 1: Push Code to GitHub

Your code is ready! Now push it to your GitHub repository:

```bash
cd c:\Users\anurag.singh\.gemini\antigravity\playground\infinite-asteroid

# If the repo is already connected to GitHub (it should be)
git add .
git commit -m "Enhanced UpNext MVP with production-ready features"
git push origin master
```

### Step 2: Create Render Web Service

1. Go to [https://render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select the `upnext-mvp` repository

### Step 3: Configure Build Settings

Fill in the following settings:

**Basic Settings:**
- **Name**: `upnext-mvp` (or any name you prefer)
- **Region**: Choose closest to your users
- **Branch**: `master` (or `main` if that's your default)
- **Root Directory**: Leave empty (uses repository root)

**Build & Deploy:**
- **Runtime**: `Node`
- **Build Command**:
  ```
  npm run build
  ```
- **Start Command**:
  ```
  npm start
  ```

### Step 4: Set Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `PORT` | `10000` | Render default (auto-set, but good to confirm) |
| `CORS_ORIGIN` | `*` | Allow all origins (change to your domain in production) |
| `MIN_BID_AMOUNT` | `50` | Minimum bid in rupees |
| `SLOT_DURATION_MINUTES` | `5` | Duration of each slot |
| `NODE_VERSION` | `18` | Node.js version (optional, Render detects automatically) |

### Step 5: Deploy!

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Run `npm run build` (installs deps + builds client)
   - Run `npm start` (starts the server)
   - Assign you a URL like `https://upnext-mvp.onrender.com`

3. Wait for deployment (usually 2-5 minutes)

### Step 6: Access Your App

Once deployed, your app will be available at:
- **Your Render URL**: `https://your-app-name.onrender.com`

Test all three screens:
- User Booking: `https://your-app-name.onrender.com/`
- Public Display: `https://your-app-name.onrender.com/screen`
- DJ Dashboard: `https://your-app-name.onrender.com/dj`

## Troubleshooting

### Build Fails

**Error: "npm install failed"**
- Check that `package.json` exists in root
- Verify `engines.node` is set to `>=16.0.0`

**Error: "client build failed"**
- Check client dependencies in `client/package.json`
- Verify Vite config is correct

### App Doesn't Load

**Blank screen or 404:**
- Check that server is serving static files: `app.use(express.static(clientDistPath))`
- Verify fallback route `app.get('*', ...)` is present

**Socket connection fails:**
- Check CORS settings in server
- Verify WebSocket is enabled on Render (it is by default)

### Environment Variables Not Working

- Make sure variables are set in Render dashboard (not just `.env` file)
- Restart the service after adding env vars
- Check server logs in Render dashboard

## Monitoring

### View Logs

In Render Dashboard:
1. Click on your service
2. Go to **"Logs"** tab
3. You'll see real-time server logs with emoji indicators:
   - 🚀 Server started
   - ✅ User connected
   - 📩 New bid received
   - etc.

### Check Health

Visit `https://your-app-name.onrender.com/health` to see:
- Server status
- Uptime
- Current slot info
- Total bids

## Custom Domain (Optional)

To use your own domain:

1. In Render dashboard, go to your service
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain (e.g., `upnext.yourdomain.com`)
4. Update DNS records as instructed by Render
5. Update `CORS_ORIGIN` env variable to your domain

## Free Tier Notes

Render's free tier:
- ✅ Great for demos and testing
- ⚠️ Spins down after 15 min of inactivity
- ⚠️ Takes ~30s to wake up on first request
- 💡 Upgrade to paid tier ($7/mo) for always-on service

## Updating Your App

To deploy updates:

```bash
git add .
git commit -m "Update description"
git push origin master
```

Render will automatically detect the push and redeploy!

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] Render web service created
- [ ] Build succeeds (check logs)
- [ ] Environment variables set
- [ ] App loads at Render URL
- [ ] All three screens accessible
- [ ] Socket.io connections work
- [ ] Bidding flow works end-to-end

---

**Need help?** Check Render's logs for detailed error messages, or refer to the main [README.md](file:///c:/Users/anurag.singh/.gemini/antigravity/playground/infinite-asteroid/README.md).
