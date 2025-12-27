# UpNext MVP - Music Request & Bidding Platform

A real-time music request platform where users bid for song slots, DJs manage the queue, and a public display shows the leaderboard.

## 🎵 Features

### Three Screens

1. **Public Display (`/screen`)**: Large display showing:
   - Live leaderboard of approved bids
   - Currently playing song
   - QR code for user participation
   - Real-time countdown timer

2. **User Booking (`/`)**: Mobile-friendly interface for users to:
   - Submit song requests with bid amounts
   - View live leaderboard
   - See currently playing song
   - Receive instant feedback via toast notifications

3. **DJ Dashboard (`/dj`)**: Control panel for DJs to:
   - Approve/reject incoming bids
   - Select next song to play
   - View statistics (total bids, revenue)
   - Manage slot rotation

### Technical Features

- **Real-time Updates**: Socket.io for instant synchronization across all screens
- **Auto Slot Rotation**: Automatic timer-based slot changes
- **Form Validation**: Comprehensive input validation and error handling
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Premium design with animations and gradients

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/orientanurag/upnext-mvp.git
   cd upnext-mvp
   ```

2. **Install all dependencies**
   ```bash
   npm install
   npm run install:all
   ```

3. **Configure environment (optional)**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

### Running Locally

**Option 1: Run both client and server together (Recommended)**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 - Server:
```bash
cd server
npm run dev
```

Terminal 2 - Client:
```bash
cd client
npm run dev
```

### Access the Application

- **User Booking**: http://localhost:5173/
- **Public Display**: http://localhost:5173/screen
- **DJ Dashboard**: http://localhost:5173/dj
- **Server API**: http://localhost:3000/health

## 📁 Project Structure

```
upnext-mvp/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # Reusable components (CountdownTimer)
│   │   ├── context/       # SocketContext for real-time state
│   │   ├── pages/         # Main screens
│   │   │   ├── PublicScreen.jsx
│   │   │   ├── MobileWeb.jsx
│   │   │   └── DJDashboard.jsx
│   │   ├── App.jsx        # Routes and main app
│   │   └── index.css      # Global styles
│   ├── package.json
│   └── vite.config.js
├── server/                # Backend (Express + Socket.io)
│   ├── index.js          # Main server file
│   ├── .env.example      # Environment variables template
│   └── package.json
├── package.json          # Root package with convenience scripts
└── README.md
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3000                    # Server port
CORS_ORIGIN=*               # CORS origin (use specific domain in production)
MIN_BID_AMOUNT=50           # Minimum bid amount in rupees
SLOT_DURATION_MINUTES=5     # Duration of each bidding slot
```

## 🎨 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time communications
- **React Router** - Client-side routing
- **React Hot Toast** - Toast notifications
- **QRCode.react** - QR code generation
- **date-fns** - Date formatting
- **Lucide React** - Icons

### Backend
- **Express** - Web server
- **Socket.io** - WebSocket server
- **dotenv** - Environment configuration
- **CORS** - Cross-origin resource sharing

## 🔨 Development

### Adding New Features

1. **Frontend**: Edit files in `client/src/`
2. **Backend**: Edit `server/index.js`
3. **Styles**: Modify `client/src/index.css` or `client/tailwind.config.js`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in `client/dist/`.

## 🚢 Deployment

### Deploy to Render

1. **Create a new Web Service** on [Render](https://render.com)

2. **Connect your GitHub repository**

3. **Configure Build Settings**:
   - **Build Command**: `npm install && npm run install:all && npm run build`
   - **Start Command**: `cd server && npm start`

4. **Environment Variables**: Add your `.env` variables in Render dashboard

5. **Serve Static Files**: Configure Express to serve the built client files

### Deploy Client Separately (Vercel/Netlify)

1. **Build the client**: `cd client && npm run build`
2. **Deploy the `client/dist` folder** to Vercel or Netlify
3. **Update Socket URL** in `SocketContext.jsx` to point to your backend server

## 📖 Usage Guide

### For Users

1. Scan the QR code or visit the website
2. Enter your desired song name
3. Set your bid amount (minimum ₹50)
4. Optionally add your name
5. Confirm payment and submit
6. Watch the leaderboard to see your bid status

### For DJs

1. Navigate to `/dj`
2. Monitor incoming bids in real-time
3. Approve or reject bids
4. Click "PLAY" on approved bids to set as current winner
5. Use "RESET / NEXT SLOT" to start a fresh round

### For Display

1. Navigate to `/screen` on a large screen/projector
2. Shows live leaderboard and currently playing song
3. QR code allows audience to participate

## 🐛 Troubleshooting

### Socket Connection Issues

- **Check** that both client and server are running
- **Verify** the socket URL in `SocketContext.jsx` matches your server
- **Check browser console** for connection errors

### Build Errors

- **Delete `node_modules`** and reinstall: `npm run install:all`
- **Clear build cache**: `rm -rf client/dist client/node_modules/.vite`

### Styling Issues

- **Run**: `cd client && npx tailwindcss -i ./src/index.css -o ./dist/output.css`
- **Check** that Tailwind directives are in `index.css`

## 📜 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for the music community**
