# Render Deployment Configuration

## Environment Variables for Render

When deploying to Render, add these exact environment variables in the Render dashboard:

### Required Variables

```
DATABASE_URL=mongodb+srv://orientanurag_db_user:upnextmvp@upnext-mvp.nulidt1.mongodb.net/upnext?appName=upnext-mvp

JWT_SECRET=upnext-jwt-secret-2024-production-key-change-this

MIN_BID_AMOUNT=50

CORS_ORIGIN=*

NODE_VERSION=18
```

## Deployment Steps

1. **Push to GitHub** (Already done)
   ```
   git push origin master
   ```

2. **Go to Render Dashboard**
   - https://dashboard.render.com

3. **Select Your Service** (`upnext-mvp` or create new)

4. **Add Environment Variables**
   - Go to "Environment" tab
   - Click "Add Environment Variable"
   - Add each variable above

5. **Deploy Settings**
   - Build Command: `npm run build`
   - Start Command: `npm start`

6. **After First Deployment**
   
   Run these commands in Render Shell (one-time setup):
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   npm run prisma:seed
   ```

   This will:
   - Generate Prisma client
   - Create database collections in MongoDB
   - Create admin users (admin/admin123, dj/dj123)

7. **Manual Deploy**
   - Click "Manual Deploy" → "Deploy latest commit"

## Post-Deployment Checklist

- [ ] Service deployed successfully
- [ ] Database connected (check logs for "Connected")
- [ ] Prisma client generated
- [ ] Collections created in MongoDB
- [ ] Admin users seeded
- [ ] Can access all three routes:
  - `/` - User booking
  - `/dj` - DJ dashboard  
  - `/screen` - Public display
- [ ] Can search for songs
- [ ] Can submit bids with messages
- [ ] DJ can see and manage bids

## Troubleshooting

If deployment fails:

1. **Check Render Logs**
   - Look for specific error messages
   - Common issues: Prisma client not generated, DB connection failed

2. **Prisma Client Error**
   - Run in Shell: `cd server && npx prisma generate`

3. **Database Connection Error**
   - Verify DATABASE_URL is correct
   - Check MongoDB Atlas Network Access allows all IPs (0.0.0.0/0)

4. **Module Not Found**
   - Clear build cache in Render
   - Trigger rebuild

## Testing Production

Once deployed, test these flows:

1. **User Flow** (`/`)
   - Search "Shape of You"
   - Select a song
   - Write message "This is my favorite song!"
   - Bid ₹100
   - Submit

2. **DJ Flow** (`/dj`)
   - See the pending bid
   - Read the message
   - Approve the bid
   - Click "Play"

3. **Public Display** (`/screen`)
   - See leaderboard update
   - Current winner shows with message

All updates should happen in real-time across all screens!
