import React, { useState, useEffect } from 'react';
import { SocketProvider } from './context/SocketContext';
import PublicScreen from './pages/PublicScreen';
import MobileWeb from './pages/MobileWeb';
import DJDashboard from './pages/DJDashboard';

function App() {
    const [route, setRoute] = useState(window.location.pathname);

    useEffect(() => {
        const handlePopState = () => setRoute(window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const renderRoute = () => {
        if (route === '/screen') return <PublicScreen />;
        if (route === '/dj') return <DJDashboard />;
        return <MobileWeb />; // Default to user flow
    };

    return (
        <SocketProvider>
            <div className="min-h-screen bg-brand-black text-white">
                {renderRoute()}
            </div>
        </SocketProvider>
    );
}

export default App;
