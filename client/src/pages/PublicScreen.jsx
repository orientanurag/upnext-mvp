import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import CountdownTimer from '../components/CountdownTimer';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function PublicScreen() {
    const { gameState } = useSocket();
    const { leaderboard, currentWinner } = gameState;
    const [currentSlot, setCurrentSlot] = useState(null);

    useEffect(() => {
        fetchCurrentSlot();
        const interval = setInterval(fetchCurrentSlot, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchCurrentSlot = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/slots/current`);
            setCurrentSlot(response.data);
        } catch (error) {
            console.error('Failed to fetch slot:', error);
        }
    };

    // Get the URL for users to scan
    const userBookingUrl = window.location.origin;

    return (
        <div className="h-screen w-screen bg-gradient-to-br from-black via-brand-black to-gray-900 overflow-hidden flex flex-col p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 animate-fadeIn">
                <h1 className="text-7xl font-heading font-black tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    UPNEXT
                </h1>
                <div className="text-right">
                    <div className="text-2xl text-gray-400 mb-3 font-medium">Scan to Bid</div>
                    <div className="bg-white p-4 rounded-xl shadow-2xl">
                        <QRCodeSVG
                            value={userBookingUrl}
                            size={120}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-grow grid grid-cols-12 gap-8">

                {/* Left: Leaderboard */}
                <div className="col-span-8">
                    <h2 className="text-5xl font-heading font-bold mb-6 text-brand-lime drop-shadow-lg">
                        LEADERBOARD
                    </h2>
                    <div className="space-y-4 max-h-[calc(100vh-240px)] overflow-y-auto pr-2">
                        {leaderboard.map((bid, index) => (
                            <div
                                key={bid.id}
                                className="flex items-center bg-gradient-to-r from-brand-gray to-brand-gray-light p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 animate-slideUp border border-gray-800 hover:border-brand-lime"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="text-5xl font-mono font-bold text-gray-600 w-20">
                                    #{index + 1}
                                </div>
                                <div className="flex-grow mx-4">
                                    <div className="text-3xl font-bold truncate mb-1">
                                        {bid.songTitle}
                                    </div>
                                    <div className="text-xl text-gray-400">
                                        {bid.userName || 'Anonymous'}
                                    </div>
                                </div>
                                <div className="text-5xl font-bold text-brand-lime drop-shadow-lg">
                                    ₹{bid.bidAmount}
                                </div>
                            </div>
                        ))}
                        {leaderboard.length === 0 && (
                            <div className="text-4xl text-gray-600 p-16 text-center border-2 border-dashed border-gray-800 rounded-xl animate-pulse-slow">
                                <div className="mb-4">🎵</div>
                                WAITING FOR BIDS...
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Current Winner / Status */}
                <div className="col-span-4 flex flex-col gap-6">
                    <div className="bg-gradient-to-br from-brand-lime to-yellow-400 text-black p-8 rounded-xl shadow-2xl flex-grow flex flex-col justify-center text-center animate-fadeIn">
                        <div className="text-xl font-bold opacity-70 mb-3 uppercase tracking-wide">
                            Current Vibe
                        </div>
                        {currentWinner ? (
                            <>
                                <div className="text-5xl font-black leading-tight mb-4 animate-bounce-gentle">
                                    {currentWinner.songTitle}
                                </div>
                                <div className="text-2xl font-medium">
                                    Owned by {currentWinner.userName}
                                </div>
                                <div className="text-4xl font-bold mt-4">
                                    ₹{currentWinner.bidAmount}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-80">
                                <div className="text-6xl mb-4 animate-pulse">🎹</div>
                                <div className="text-3xl font-bold tracking-widest text-brand-lime uppercase mb-2">
                                    Vibe In Progress
                                </div>
                                <div className="text-sm font-mono text-gray-400">
                                    WAITING FOR DJ...
                                </div>
                                <div className="flex gap-1 mt-6 h-8 items-end">
                                    {[...Array(8)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 bg-brand-lime animate-bounce"
                                            style={{
                                                height: `${Math.random() * 100}%`,
                                                animationDuration: `${0.6 + Math.random() * 0.4}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-xl shadow-2xl text-center border border-gray-800">
                        <div className="text-gray-400 text-xl mb-3 uppercase tracking-wide font-medium">
                            Time Remaining
                        </div>
                        <CountdownTimer
                            endTime={currentSlot?.endTime ? new Date(currentSlot.endTime).getTime() : Date.now() + 5 * 60 * 1000}
                            className="text-6xl font-bold text-brand-lime"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
