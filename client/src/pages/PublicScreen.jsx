import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { Music, Disc, Activity } from 'lucide-react';

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
        <div className="h-screen w-screen bg-black text-white overflow-hidden flex flex-col font-sans selection:bg-brand-lime selection:text-black">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-brand-lime rounded-full blur-[150px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full p-6 md:p-10 gap-6">

                {/* Header Section */}
                <header className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-12 bg-brand-lime shadow-[0_0_15px_rgba(204,255,0,0.6)]"></div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            UPNEXT
                        </h1>
                    </div>

                    <div className="flex items-center gap-6 bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                        <div className="text-right">
                            <div className="text-xs text-brand-lime font-bold uppercase tracking-widest mb-1">Join The Vibe</div>
                            <div className="text-sm text-gray-400 font-mono">Scan to Bid</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg">
                            <QRCodeSVG
                                value={userBookingUrl}
                                size={64}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                    </div>
                </header>

                {/* Main Split Layout */}
                <div className="flex-grow grid grid-cols-12 gap-8 min-h-0">

                    {/* LEFT: Now Playing / Visualizer (60%) */}
                    <div className="col-span-12 lg:col-span-7 flex flex-col">
                        <div className="relative flex-grow bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-[2rem] border border-white/10 p-8 flex flex-col justify-center items-center shadow-2xl overflow-hidden group">

                            {/* Decorative Grid */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                            {currentWinner ? (
                                <>
                                    {/* Rotating Vinyl / Art */}
                                    <div className="relative w-64 h-64 md:w-96 md:h-96 mb-8 mt-4">
                                        <div className="absolute inset-0 bg-brand-lime rounded-full blur-[50px] opacity-20 animate-pulse"></div>
                                        <div className="w-full h-full rounded-full border-4 border-gray-800 bg-black flex items-center justify-center animate-[spin_8s_linear_infinite] shadow-2xl relative z-10">
                                            <div className="w-1/3 h-1/3 rounded-full bg-gradient-to-tr from-brand-lime to-yellow-400"></div>
                                            <div className="absolute inset-0 rounded-full border border-white/10"></div>
                                            <div className="absolute w-4 h-4 bg-black rounded-full z-20"></div>
                                        </div>
                                    </div>

                                    {/* Text Info */}
                                    <div className="text-center z-10 max-w-2xl px-4">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-lime/20 text-brand-lime text-xs font-bold uppercase tracking-widest mb-6 animate-fadeIn">
                                            <Activity size={14} className="animate-pulse" /> Now Playing
                                        </div>
                                        <h2 className="text-4xl md:text-6xl font-black leading-tight mb-4 tracking-tight drop-shadow-xl line-clamp-2">
                                            {currentWinner.songTitle}
                                        </h2>
                                        <div className="text-xl md:text-3xl font-medium text-gray-400 flex items-center justify-center gap-3">
                                            <span className="opacity-50">by</span>
                                            <span className="text-white">{currentWinner.userName}</span>
                                            <div className="bg-white/20 px-3 py-1 rounded text-sm font-bold text-white">₹{currentWinner.bidAmount}</div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* FILLER STATE */
                                <div className="text-center z-10 opacity-70">
                                    <div className="flex gap-2 justify-center h-24 mb-6 items-end">
                                        {[...Array(12)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-4 bg-gradient-to-t from-brand-lime to-transparent rounded-t-full animate-bounce"
                                                style={{
                                                    height: '60%',
                                                    animationDuration: `${0.8 + Math.random() * 0.5}s`,
                                                    animationDelay: `${Math.random() * 0.5}s`
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <h2 className="text-6xl font-black uppercase text-gray-800 tracking-tighter mb-2">
                                        Vibe Check
                                    </h2>
                                    <div className="text-brand-lime font-mono text-xl animate-pulse">
                                        WAITING FOR DJ...
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Leaderboard (40%) */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col h-full min-h-0">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 flex flex-col h-full flex-grow">
                            <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
                                <div>
                                    <h3 className="text-2xl font-bold uppercase text-white mb-1">Queue</h3>
                                    <div className="text-xs text-brand-lime font-mono uppercase tracking-wider">
                                        {currentSlot ? `Current Slot #${currentSlot.slotNumber}` : 'Loading...'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-mono font-bold text-white/20">
                                        {leaderboard.length.toString().padStart(2, '0')}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 overflow-y-auto pr-2 flex-grow scrollbar-hide">
                                {leaderboard.map((bid, index) => (
                                    <div
                                        key={bid.id}
                                        className="group relative flex items-center bg-black/40 hover:bg-brand-lime/10 p-4 rounded-xl transition-all duration-300 border border-white/5 hover:border-brand-lime/50"
                                    >
                                        <div className="flex-shrink-0 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-mono font-bold text-gray-500 group-hover:text-brand-lime group-hover:scale-110 transition-transform">
                                            #{index + 1}
                                        </div>
                                        <div className="flex-grow mx-4 min-w-0">
                                            <div className="font-bold text-lg truncate group-hover:text-white transition-colors">
                                                {bid.songTitle}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate group-hover:text-gray-300">
                                                {bid.userName || 'Anonymous'}
                                            </div>
                                        </div>
                                        <div className="text-xl font-bold text-white group-hover:text-brand-lime drop-shadow-lg">
                                            ₹{bid.bidAmount}
                                        </div>
                                    </div>
                                ))}
                                {leaderboard.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                                        <Disc size={48} className="mb-4 animate-spin-slow" />
                                        <div className="text-sm font-mono uppercase tracking-widest">Queue Empty</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Ticker/Status */}
                <div className="hidden md:flex justify-between text-xs font-mono text-gray-600 uppercase tracking-widest pt-2">
                    <div>Powered by Upnext</div>
                    <div>Real-time Bidding System</div>
                </div>
            </div>
        </div>
    );
}
