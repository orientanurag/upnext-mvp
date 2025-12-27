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
        </BrowserRouter >
    );
}

export default App;
