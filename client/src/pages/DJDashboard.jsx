import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { X, Check, Play, RotateCcw, DollarSign, Users } from 'lucide-react';

export default function DJDashboard() {
    const { gameState, adminAction, nextSlot } = useSocket();
    const { bids, leaderboard, currentWinner } = gameState;

    const pendingBids = useMemo(() =>
        bids.filter(b => b.status === 'pending')
        , [bids]);

    const stats = useMemo(() => ({
        totalBids: bids.length,
        pendingCount: pendingBids.length,
        approvedCount: leaderboard.length,
        totalRevenue: leaderboard.reduce((sum, bid) => sum + bid.amount, 0)
    }), [bids, pendingBids, leaderboard]);

    return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-gray-900 via-brand-black to-black min-h-screen text-white text-xs md:text-base">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-700 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-black mb-2">DJ CONTROL</h1>
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-brand-lime" />
                            <span className="text-gray-400">Total Bids:</span>
                            <span className="font-bold">{stats.totalBids}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-brand-lime" />
                            <span className="text-gray-400">Revenue:</span>
                            <span className="font-bold text-brand-lime">₹{stats.totalRevenue}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={nextSlot}
                    className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 rounded-lg font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-lg flex items-center gap-2"
                >
                    <RotateCcw size={18} />
                    RESET / NEXT SLOT
                </button>
            </header>

            {/* Stats Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-brand-gray-light p-4 rounded-lg border border-gray-800">
                    <div className="text-gray-400 text-xs uppercase mb-1">Pending</div>
                    <div className="text-3xl font-bold text-yellow-400">{stats.pendingCount}</div>
                </div>
                <div className="bg-brand-gray-light p-4 rounded-lg border border-gray-800">
                    <div className="text-gray-400 text-xs uppercase mb-1">Approved</div>
                    <div className="text-3xl font-bold text-green-400">{stats.approvedCount}</div>
                </div>
                <div className="bg-brand-gray-light p-4 rounded-lg border border-gray-800">
                    <div className="text-gray-400 text-xs uppercase mb-1">Total Bids</div>
                    <div className="text-3xl font-bold">{stats.totalBids}</div>
                </div>
                <div className="bg-brand-gray-light p-4 rounded-lg border border-gray-800">
                    <div className="text-gray-400 text-xs uppercase mb-1">Revenue</div>
                    <div className="text-3xl font-bold text-brand-lime">₹{stats.totalRevenue}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Incoming Bids */}
                <div className="bg-black p-4 md:p-6 rounded-xl border border-gray-800">
                    <h2 className="text-lg md:text-xl font-bold text-gray-400 mb-4 flex items-center justify-between">
                        <span>INCOMING BIDS ({pendingBids.length})</span>
                        {pendingBids.length > 0 && (
                            <span className="bg-yellow-600 text-xs px-2 py-1 rounded-full animate-pulse">NEW</span>
                        )}
                    </h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {pendingBids.map(bid => (
                            <div key={bid.id} className="flex flex-col md:flex-row justify-between md:items-center bg-brand-gray p-4 rounded-lg border-l-4 border-yellow-500 gap-3 animate-slideUp hover:bg-brand-gray-light transition-colors">
                                <div className="flex-grow">
                                    <div className="font-bold text-base md:text-lg mb-1">{bid.song}</div>
                                    <div className="text-gray-400 text-sm">
                                        ₹{bid.amount} • {bid.user}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {formatDistanceToNow(bid.timestamp, { addSuffix: true })}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => adminAction({ bidId: bid.id, action: 'reject' })}
                                        className="px-4 py-2 bg-red-900 text-red-200 rounded-lg hover:bg-red-800 transition-colors flex items-center gap-1 font-medium"
                                    >
                                        <X size={16} />
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => adminAction({ bidId: bid.id, action: 'approve' })}
                                        className="px-4 py-2 bg-green-900 text-green-200 rounded-lg hover:bg-green-800 transition-colors flex items-center gap-1 font-medium"
                                    >
                                        <Check size={16} />
                                        Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                        {pendingBids.length === 0 && (
                            <div className="text-gray-600 italic text-center py-12 border-2 border-dashed border-gray-800 rounded-lg">
                                No pending bids
                            </div>
                        )}
                    </div>
                </div>

                {/* Approved / Leaderboard */}
                <div className="bg-black p-4 md:p-6 rounded-xl border border-gray-800">
                    <h2 className="text-lg md:text-xl font-bold text-brand-lime mb-4">
                        LEADERBOARD (APPROVED)
                    </h2>
                    {currentWinner && (
                        <div className="mb-5 p-5 bg-gradient-to-r from-brand-lime to-yellow-400 text-black rounded-lg text-center shadow-lg animate-pulse-slow">
                            <div className="font-bold opacity-70 text-xs uppercase mb-1">🎵 CURRENT WINNER</div>
                            <div className="text-xl md:text-2xl font-black truncate">{currentWinner.song}</div>
                            <div className="text-sm mt-1">{currentWinner.user} • ₹{currentWinner.amount}</div>
                        </div>
                    )}

                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
                        {leaderboard.map((bid, i) => (
                            <div key={bid.id} className="flex justify-between items-center bg-brand-gray p-4 rounded-lg border-l-4 border-brand-lime hover:bg-brand-gray-light transition-colors">
                                <div className="font-mono text-gray-500 w-8 text-lg">#{i + 1}</div>
                                <div className="flex-grow mx-3">
                                    <div className="font-bold text-base truncate">{bid.song}</div>
                                    <div className="text-gray-400 text-sm">₹{bid.amount} • {bid.user}</div>
                                </div>
                                <button
                                    onClick={() => adminAction({ bidId: bid.id, action: 'win' })}
                                    disabled={currentWinner?.id === bid.id}
                                    className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg uppercase hover:bg-brand-lime transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <Play size={14} />
                                    {currentWinner?.id === bid.id ? 'Playing' : 'Play'}
                                </button>
                            </div>
                        ))}
                        {leaderboard.length === 0 && (
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
