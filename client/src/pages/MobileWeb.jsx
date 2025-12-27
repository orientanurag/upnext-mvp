import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';

export default function MobileWeb() {
    const { gameState, submitBid } = useSocket();
    const [song, setSong] = useState('');
    const [amount, setAmount] = useState('');
    const [user, setUser] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Simplified sort for active leaderboard display on mobile too? 
    // Maybe just show status.

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!song || !amount) return;

        // Simulate Payment Flow
        const confirmed = window.confirm(`Pay ₹${amount} for "${song}"?`);
        if (confirmed) {
            submitBid({ song, amount, user });
            setSubmitted(true);
            // Reset after 3s to allow more bids
            setTimeout(() => {
                setSubmitted(false);
                setSong('');
                setAmount('');
            }, 3000);
        }
    };

    const currentWinner = gameState.currentWinner;

    return (
        <div className="p-6 max-w-md mx-auto flex flex-col h-screen">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tighter">UPNEXT</h1>
                <div className="text-xs text-brand-lime border border-brand-lime px-2 py-1 rounded">LIVE</div>
            </header>

            {currentWinner ? (
                <div className="mb-6 p-4 bg-brand-lime text-black rounded-lg">
                    <div className="text-sm font-bold opacity-70">NOW PLAYING</div>
                    <div className="text-xl font-bold">{currentWinner.song}</div>
                    <div className="text-xs mt-1">Ownd by {currentWinner.user} • ₹{currentWinner.amount}</div>
                </div>
            ) : (
                <div className="mb-6 text-center text-gray-500">Waiting for next winner...</div>
            )}

            <main className="flex-grow">
                <h2 className="text-xl font-bold mb-4">Own the Next Moment</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-1">Your Anthem (Song Name)</label>
                        <input
                            type="text"
                            value={song}
                            onChange={e => setSong(e.target.value)}
                            className="w-full bg-brand-gray border border-gray-700 p-3 rounded text-white focus:border-brand-lime outline-none transition-colors"
                            placeholder="e.g. Bohemian Rhapsody"
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-1">Your Bid (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full bg-brand-gray border border-gray-700 p-3 rounded text-white focus:border-brand-lime outline-none transition-colors"
                            placeholder="Min ₹50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-1">Your Name (Optional)</label>
                        <input
                            type="text"
                            value={user}
                            onChange={e => setUser(e.target.value)}
                            className="w-full bg-brand-gray border border-gray-700 p-3 rounded text-white focus:border-brand-lime outline-none transition-colors"
                            placeholder="Anonymous"
                        />
                    </div>

                    <button
                        disabled={submitted}
                        className="w-full bg-brand-lime text-black font-bold py-4 rounded text-lg hover:brightness-110 transition-all disabled:opacity-50"
                    >
                        {submitted ? 'BID PLACED!' : 'PAY & BID'}
                    </button>
                </form>

                <div className="mt-8">
                    <h3 className="text-sm font-bold text-gray-400 mb-2">Live Top Bids</h3>
                    <div className="space-y-2">
                        {gameState.leaderboard.map((bid, i) => (
                            <div key={bid.id} className="flex justify-between items-center bg-brand-gray p-2 rounded text-sm">
                                <span className="truncate flex-1">
                                    <span className="text-gray-500 mr-2">#{i + 1}</span>
                                    {bid.song}
                                </span>
                                <span className="font-bold text-brand-lime">₹{bid.amount}</span>
                            </div>
                        ))}
                        {gameState.leaderboard.length === 0 && <div className="text-gray-600 text-sm">No active bids yet. Be the first!</div>}
                    </div>
                </div>
            </main>
        </div>
    );
}
