import React from 'react';
import { useSocket } from '../context/SocketContext';

export default function PublicScreen() {
    const { gameState } = useSocket();
    const { leaderboard, currentWinner } = gameState;

    return (
        <div className="h-screen w-screen bg-black overflow-hidden flex flex-col p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <h1 className="text-6xl font-bold tracking-tighter">UPNEXT</h1>
                <div className="text-right">
                    <div className="text-2xl text-gray-400">Scan to Bid</div>
                    {/* Placeholder QR - In real app, generate QR pointing to URL */}
                    <div className="w-32 h-32 bg-white mt-2 ml-auto flex items-center justify-center text-black font-bold text-xs">
                        QR CODE
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-grow grid grid-cols-12 gap-8">

                {/* Left: Leaderboard */}
                <div className="col-span-8">
                    <h2 className="text-4xl font-bold mb-6 text-brand-lime">LEADERBOARD</h2>
                    <div className="space-y-4">
                        {leaderboard.map((bid, index) => (
                            <div key={bid.id} className="flex items-center bg-brand-gray p-6 rounded-xl animate-pulse-slow">
                                <div className="text-4xl font-mono text-gray-500 w-16">#{index + 1}</div>
                                <div className="flex-grow">
                                    <div className="text-3xl font-bold truncate">{bid.song}</div>
                                    <div className="text-xl text-gray-400">{bid.user || 'Anonymous'}</div>
                                </div>
                                <div className="text-5xl font-bold text-brand-lime">₹{bid.amount}</div>
                            </div>
                        ))}
                        {leaderboard.length === 0 && (
                            <div className="text-4xl text-gray-600 p-12 text-center border-2 border-dashed border-gray-800 rounded-xl">
                                WAITING FOR BIDS...
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Current Winner / Status */}
                <div className="col-span-4 flex flex-col">
                    <div className="bg-brand-lime text-black p-8 rounded-xl mb-8 flex-grow flex flex-col justify-center text-center">
                        <div className="text-xl font-bold opacity-60 mb-2 uppercase">Current Vibe</div>
                        {currentWinner ? (
                            <>
                                <div className="text-5xl font-black leading-tight mb-4">{currentWinner.song}</div>
                                <div className="text-2xl">Owned by {currentWinner.user}</div>
                                <div className="text-4xl font-bold mt-4">₹{currentWinner.amount}</div>
                            </>
                        ) : (
                            <div className="text-4xl font-bold opacity-50">NOTHING PLAYING</div>
                        )}
                    </div>

                    <div className="bg-gray-900 p-8 rounded-xl text-center">
                        <div className="text-gray-400 text-xl mb-2">TIME REMAINING</div>
                        {/* Static for MVP, would need countdown logic */}
                        <div className="text-6xl font-mono">03:45</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
