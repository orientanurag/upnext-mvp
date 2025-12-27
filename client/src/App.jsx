import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import PublicScreen from './pages/PublicScreen';
import MobileWebEnhanced from './pages/MobileWebEnhanced';
import DJDashboardEnhanced from './pages/DJDashboardEnhanced';

function App() {
    return (
        <SocketProvider>
            <BrowserRouter>
                <div className="min-h-screen bg-brand-black text-white">
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            style: {
                                background: '#1a1a1a',
                                color: '#fff',
                                border: '1px solid #333'
                            }
                        }}
                    />

                    <Routes>
                        <Route path="/" element={<MobileWebEnhanced />} />
                        <Route path="/screen" element={<PublicScreen />} />
                        <Route path="/dj" element={<DJDashboardEnhanced />} />
                    </Routes>
                </div>
            </BrowserRouter>
        </SocketProvider>
    );
}

export default App;
