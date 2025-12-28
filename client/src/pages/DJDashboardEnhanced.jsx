import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Play, MessageSquare, Music } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function DJDashboardEnhanced() {
    const { gameState } = useSocket();
    const [bids, setBids] = useState([]);
    const [stats, setStats] = useState({});
    const [currentWinner, setCurrentWinner] = useState(null);
    const [currentSlot, setCurrentSlot] = useState(null);
    const [topBids, setTopBids] = useState([]);

    useEffect(() => {
        fetchBids();
        fetchStats();
        fetchCurrentSlot();

        const interval = setInterval(fetchCurrentSlot, 10000); // Poll slot info
        return () => clearInterval(interval);
    }, []);

    // Update bids when gameState changes (socket updates)
    useEffect(() => {
        if (gameState.bids && gameState.bids.length > 0) {
            setBids(gameState.bids);
        }
    }, [gameState.bids]);

    const fetchCurrentSlot = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/slots/current`);
            setCurrentSlot(response.data);
            if (response.data) {
                fetchTopBids(response.data.id);
            }
        } catch (error) {
            console.error('Failed to fetch slot:', error);
        }
    };

    const fetchTopBids = async (slotId) => {
        try {
            // Fetch more bids for DJ view (up to 50)
            const response = await axios.get(`${API_BASE}/api/slots/${slotId}/top-bids?limit=50`);
            setTopBids(response.data);
        } catch (error) {
            console.error('Failed to fetch top bids:', error);
        }
    };

    const fetchBids = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/bids`);
            setBids(response.data);
        } catch (error) {
            console.error('Failed to fetch bids:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/stats`);
            setStats(response.data || {});
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            setStats({});
        }
    };

    const handleAction = async (bidId, status) => {
        try {
            await axios.patch(`${API_BASE}/api/bids/${bidId}`, { status });

            if (status === 'played') {
                const bid = bids.find(b => b.id === bidId);
                setCurrentWinner(bid);
            }

            fetchBids();
            fetchStats();
        } catch (error) {
            console.error('Action failed:', error);
        }
    };

    const pendingBids = bids.filter(b => b.status === 'pending');
    const approvedBids = bids.filter(b => b.status === 'approved');

    return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-gray-900 via-brand-black to-black min-h-screen text-white">
            {/* Header with Stats */}
            <header className="mb-6 pb-4 border-b border-gray-700">
                <h1 className="text-3xl font-heading font-black mb-4">DJ CONTROL</h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-brand-gray p-4 rounded-lg border border-gray-800">
                        <div className="text-gray-400 text-xs uppercase">Pending</div>
                        <div className="text-3xl font-bold text-yellow-400">{stats.pendingBids || 0}</div>
                    </div>
                    <div className="bg-brand-gray p-4 rounded-lg border border-gray-800">
                        <div className="text-gray-400 text-xs uppercase">Approved</div>
                        <div className="text-3xl font-bold text-green-400">{stats.approvedBids || 0}</div>
                    </div>
                    <div className="bg-brand-gray p-4 rounded-lg border border-gray-800">
                        <div className="text-gray-400 text-xs uppercase">Total</div>
                        <div className="text-3xl font-bold">{stats.totalBids || 0}</div>
                    </div>
                    <div className="bg-brand-gray p-4 rounded-lg border border-gray-800">
                        <div className="text-gray-400 text-xs uppercase">Revenue</div>
                        <div className="text-3xl font-bold text-brand-lime">₹{stats.totalRevenue || 0}</div>
                    </div>
                </div>
            </header>

            {/* Current Winner */}
            {currentWinner && (
                <div className="mb-6 p-6 bg-gradient-to-r from-brand-lime to-yellow-400 text-black rounded-xl">
                    <div className="text-xs font-bold uppercase mb-2">🎵 NOW PLAYING</div>
                    <div className="text-2xl font-black mb-2">{currentWinner.songTitle}</div>
                    <div className="text-lg font-bold">{currentWinner.songArtist}</div>
                    <div className="mt-4 p-4 bg-black/20 rounded-lg">
                        <div className="text-sm font-bold mb-1">MESSAGE:</div>
                        <div className="text-lg italic">"{currentWinner.message}"</div>
                    </div>
                    <div className="text-sm mt-2">By: {currentWinner.userName} • ₹{currentWinner.bidAmount}</div>
                </div>
            )}

            {/* Current Slot Info */}
            {currentSlot && (
                <div className="mb-6 bg-brand-gray border border-yellow-500/50 p-4 rounded-xl flex justify-between items-center animate-fadeIn">
                    <div>
                        <div className="text-yellow-500 font-bold uppercase text-xs tracking-wider mb-1">Current Slot</div>
                        <div className="text-2xl font-bold text-white">
                            Slot #{currentSlot.slotNumber}
                        </div>
                        <div className="text-gray-400 text-sm">
                            {new Date(currentSlot.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                            {currentSlot.endTime ? new Date(currentSlot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</div>
                        <div className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            LIVE BIDDING
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Bids (Current Slot) */}
                {/* Top Bids (Current Slot / Universal Fallback) */}
                <div className="bg-black p-6 rounded-xl border border-gray-800">
                    <h2 className="text-xl font-bold text-gray-400 mb-4 flex items-center justify-between">
                        <span>
                            {topBids.length > 0 ? 'TOP BIDS (Current Slot)' : 'ALL PENDING BIDS (Global)'}
                        </span>
                        <div className="text-xs bg-gray-800 px-2 py-1 rounded">
                            {topBids.length > 0 ? 'Slot View' : 'Universal View'}
                        </div>
                    </h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {(topBids.length > 0 ? topBids : pendingBids)
                            .sort((a, b) => {
                                // Sort by Bid Amount (High to Low)
                                if (b.bidAmount !== a.bidAmount) {
                                    return b.bidAmount - a.bidAmount;
                                }
                                // Then by Time (Old to New) - First come first serve for ties
                                return new Date(a.submittedAt) - new Date(b.submittedAt);
                            })
                            .map((bid, index) => (
                                <div key={bid.id} className="bg-brand-gray p-4 rounded-lg border-l-4 border-yellow-500 animate-slideUp relative">
                                    <div className="absolute top-0 right-0 bg-yellow-500 text-black font-bold px-2 py-1 text-xs rounded-bl-lg z-10">
                                        #{index + 1}
                                    </div>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Music size={16} className="text-brand-lime" />
                                                <span className="font-bold text-lg">{bid.songTitle}</span>
                                            </div>
                                            <div className="text-gray-400 text-sm">{bid.songArtist}</div>
                                            <div className="text-brand-lime font-bold mt-1">₹{bid.bidAmount}</div>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    {bid.message && (
                                        <div className="bg-black p-3 rounded-lg mb-3">
                                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                                <MessageSquare size={14} />
                                                <span>MESSAGE:</span>
                                            </div>
                                            <div className="text-sm italic">"{bid.message}"</div>
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-500 mb-3">
                                        {/* Handle invalid date gracefully */}
                                        {bid.submittedAt ? formatDistanceToNow(new Date(bid.submittedAt), { addSuffix: true }) : 'Just now'} • {bid.userName}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction(bid.id, 'rejected')}
                                            className="flex-1 px-4 py-2 bg-red-900 text-red-200 rounded-lg hover:bg-red-800 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <X size={16} />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction(bid.id, 'approved')}
                                            className="flex-1 px-4 py-2 bg-green-900 text-green-200 rounded-lg hover:bg-green-800 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Check size={16} />
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        {topBids.length === 0 && pendingBids.length === 0 && (
                            <div className="text-gray-600 italic text-center py-12 border-2 border-dashed border-gray-800 rounded-lg">
                                No pending bids found (Slot or Global)
                            </div>
                        )}
                    </div>
                </div>

                {/* Approved Bids */}
                <div className="bg-black p-6 rounded-xl border border-gray-800">
                    <h2 className="text-xl font-bold text-brand-lime mb-4">APPROVED ({approvedBids.length})</h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {approvedBids.map((bid, i) => (
                            <div key={bid.id} className="bg-brand-gray p-4 rounded-lg border-l-4 border-brand-lime">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-mono text-gray-500 text-sm mb-1">#{i + 1}</div>
                                        <div className="font-bold text-lg">{bid.songTitle}</div>
                                        <div className="text-gray-400 text-sm">{bid.songArtist}</div>
                                        <div className="text-brand-lime font-bold mt-1">₹{bid.bidAmount} • {bid.userName}</div>

                                        {bid.message && (
                                            <div className="mt-2 p-2 bg-black rounded text-sm italic text-gray-300">
                                                "{bid.message}"
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleAction(bid.id, 'played')}
                                        className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg uppercase hover:bg-brand-lime transition-colors flex items-center gap-1"
                                    >
                                        <Play size={14} />
                                        Play
                                    </button>
                                </div>
                            </div>
                        ))}
                        {approvedBids.length === 0 && (
                            <div className="text-gray-600 italic text-center py-12 border-2 border-dashed border-gray-800 rounded-lg">
                                No approved bids yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
