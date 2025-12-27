import React from 'react';
import { useSocket } from '../context/SocketContext';

export default function DJDashboard() {
    const { gameState, adminAction, nextSlot } = useSocket();
    const { bids, leaderboard, currentWinner } = gameState;

    return (
        <div className="p-4 bg-gray-900 min-h-screen text-white text-xs md:text-base">
            <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                <h1 className="text-xl font-bold">DJ CONTROL</h1>
                <button
                    onClick={nextSlot}
                    className="bg-red-600 px-4 py-2 rounded font-bold hover:bg-red-700"
                >
                    RESET / NEXT SLOT
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Incoming Bids */}
                <div className="bg-black p-4 rounded">
                    <h2 className="text-lg font-bold text-gray-400 mb-4">INCOMING BIDS ({bids.length})</h2>
                    <div className="space-y-2">
                        {bids.filter(b => b.status === 'pending').map(bid => (
                            <div key={bid.id} className="flex justify-between items-center bg-brand-gray p-3 rounded border-l-4 border-yellow-500">
                                <div className="flex-grow">
                                    <div className="font-bold text-lg">{bid.song}</div>
                                    <div className="text-gray-400">₹{bid.amount} • {bid.user}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => adminAction({ bidId: bid.id, action: 'reject' })}
                                        className="px-3 py-2 bg-red-900 text-red-200 rounded hover:bg-red-800"
                                    >
                                        ✕
                                    </button>
                                    <button
                                        onClick={() => adminAction({ bidId: bid.id, action: 'approve' })}
                                        className="px-3 py-2 bg-green-900 text-green-200 rounded hover:bg-green-800"
                                    >
                                        ✓
                                    </button>
                                </div>
                            </div>
                        ))}
                        {bids.filter(b => b.status === 'pending').length === 0 && <div className="text-gray-600 italic">No pending bids</div>}
                    </div>
                </div>

                {/* Approved / Leaderboard */}
                <div className="bg-black p-4 rounded">
                    <h2 className="text-lg font-bold text-brand-lime mb-4">LEADERBOARD (APPROVED)</h2>
                    {currentWinner && (
                        <div className="mb-4 p-4 bg-brand-lime text-black rounded text-center">
                            <div className="font-bold opacity-50 text-xs">CURRENT WINNER</div>
                            <div className="text-xl font-bold">{currentWinner.song}</div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {leaderboard.map((bid, i) => (
                            <div key={bid.id} className="flex justify-between items-center bg-brand-gray p-3 rounded border-l-4 border-brand-lime">
                                <div className="font-mono text-gray-500 w-8">#{i + 1}</div>
                                <div className="flex-grow">
                                    <div className="font-bold">{bid.song}</div>
                                    <div className="text-gray-400">₹{bid.amount}</div>
                                </div>
                                <button
                                    onClick={() => adminAction({ bidId: bid.id, action: 'win' })}
                                    className="px-3 py-1 bg-white text-black text-xs font-bold rounded uppercase hover:bg-gray-200"
                                >
                                    PLAY NOW
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
