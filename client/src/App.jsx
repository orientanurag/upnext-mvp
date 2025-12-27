import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider, useSocket } from './context/SocketContext';
import PublicScreen from './pages/PublicScreen';
import MobileWeb from './pages/MobileWeb';
import DJDashboard from './pages/DJDashboard';
import { Wifi, WifiOff } from 'lucide-react';

function ConnectionIndicator() {
    const { isConnected } = useSocket();

    if (isConnected) return null; // Only show when disconnected

    return (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <WifiOff size={20} />
            <span className="text-sm font-medium">Disconnected</span>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <SocketProvider>
                <div className="min-h-screen bg-brand-black text-white">
                    <ConnectionIndicator />
                    <Routes>
                        <Route path="/" element={<MobileWeb />} />
                        <Route path="/screen" element={<PublicScreen />} />
                        <Route path="/dj" element={<DJDashboard />} />
                    </Routes>
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            duration: 3000,
                            style: {
                                background: '#1A1A1A',
                                color: '#fff',
                                border: '1px solid #D4F23F',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#D4F23F',
                                    secondary: '#0B0B0B',
                                },
                            },
                        }}
                    />
                </div>
            </SocketProvider>
        </BrowserRouter>
    );
}

export default App;
