import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { Music2, Zap, TrendingUp } from 'lucide-react';

export default function MobileWeb() {
    const { gameState, submitBid, isConnected } = useSocket();
    const [song, setSong] = useState('');
    const [amount, setAmount] = useState('');
    const [user, setUser] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const MIN_BID = 50;
    const suggestedAmounts = [50, 100, 200, 500];

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!song.trim()) {
            toast.error('Please enter a song name');
            return;
        }

        if (!amount || parseInt(amount) < MIN_BID) {
            toast.error(`Minimum bid is ₹${MIN_BID}`);
            return;
        }

        if (!isConnected) {
            toast.error('Not connected to server. Please try again.');
            return;
        }

        // Simulate Payment Flow
        const confirmed = window.confirm(
            `💳 Confirm Payment\n\nSong: "${song}"\nAmount: ₹${amount}\n\nProceed with payment?`
        );

        if (confirmed) {
            submitBid({ song, amount, user: user.trim() || 'Anonymous' });

            toast.success('Bid placed successfully! 🎉', {
                duration: 4000,
            });

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
        <div className="p-6 max-w-md mx-auto flex flex-col min-h-screen bg-gradient-to-br from-brand-black via-gray-900 to-black">
            <header className="mb-8 flex justify-between items-center animate-fadeIn">
                <h1 className="text-3xl font-heading font-black tracking-tighter">UPNEXT</h1>
                <div className={`text-xs font-bold px-3 py-1.5 rounded-full ${isConnected ? 'bg-green-600 text-white' : 'bg-red-600 text-white animate-pulse'}`}>
                    {isConnected ? '● LIVE' : '● OFFLINE'}
                </div>
            </header>

            {currentWinner ? (
                <div className="mb-6 p-5 bg-gradient-to-r from-brand-lime to-yellow-400 text-black rounded-xl shadow-lg animate-slideUp">
                    <div className="flex items-center gap-2 text-sm font-bold opacity-80 mb-2">
                        <Music2 size={16} />
                        <span>NOW PLAYING</span>
                    </div>
                    <div className="text-2xl font-black mb-1 truncate">{currentWinner.song}</div>
                    <div className="text-sm font-medium">
                        Owned by {currentWinner.user} • ₹{currentWinner.amount}
                    </div>
                </div>
            ) : (
                <div className="mb-6 text-center text-gray-500 py-4 border border-dashed border-gray-800 rounded-xl animate-fadeIn">
                    Waiting for next winner...
                </div>
            )}

            <main className="flex-grow">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-brand-lime" size={24} />
                    <h2 className="text-2xl font-bold">Own the Next Moment</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold uppercase text-gray-400 mb-2">
                            Your Anthem (Song Name) *
                        </label>
                        <input
                            type="text"
                            value={song}
                            onChange={e => setSong(e.target.value)}
                            disabled={submitted}
                            className="w-full bg-brand-gray border-2 border-gray-700 p-4 rounded-lg text-white focus:border-brand-lime focus:ring-2 focus:ring-brand-lime/20 outline-none transition-all disabled:opacity-50"
                            placeholder="e.g., Bohemian Rhapsody"
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold uppercase text-gray-400 mb-2">
                            Your Bid (₹) *
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            disabled={submitted}
                            className="w-full bg-brand-gray border-2 border-gray-700 p-4 rounded-lg text-white focus:border-brand-lime focus:ring-2 focus:ring-brand-lime/20 outline-none transition-all disabled:opacity-50"
                            placeholder={`Min ₹${MIN_BID}`}
                            min={MIN_BID}
                        />
                        <div className="flex gap-2 mt-3">
                            {suggestedAmounts.map(amt => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setAmount(amt.toString())}
                                    disabled={submitted}
                                    className="flex-1 bg-brand-gray-light hover:bg-brand-lime hover:text-black border border-gray-700 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                >
                                    ₹{amt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold uppercase text-gray-400 mb-2">
                            Your Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={user}
                            onChange={e => setUser(e.target.value)}
                            disabled={submitted}
                            className="w-full bg-brand-gray border-2 border-gray-700 p-4 rounded-lg text-white focus:border-brand-lime focus:ring-2 focus:ring-brand-lime/20 outline-none transition-all disabled:opacity-50"
                            placeholder="Anonymous"
                            maxLength={50}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitted || !isConnected}
                        className="w-full bg-gradient-to-r from-brand-lime to-yellow-400 text-black font-bold py-5 rounded-lg text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {submitted ? '✅ BID PLACED!' : '💰 PAY & BID'}
                    </button>
                </form>

                <div className="mt-10">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-brand-lime" size={20} />
                        <h3 className="text-lg font-bold text-gray-400">Live Top Bids</h3>
                    </div>
                    <div className="space-y-2">
                        {gameState.leaderboard.slice(0, 5).map((bid, i) => (
                            <div key={bid.id} className="flex justify-between items-center bg-brand-gray p-4 rounded-lg text-sm border border-gray-800 hover:border-brand-lime transition-colors animate-fadeIn">
                                <span className="truncate flex-1">
                                    <span className="text-gray-500 font-mono mr-3">#{i + 1}</span>
                                    <span className="font-semibold">{bid.song}</span>
                                </span>
                                <span className="font-bold text-brand-lime ml-3">₹{bid.amount}</span>
                            </div>
                        ))}
                        {gameState.leaderboard.length === 0 && (
                            <div className="text-gray-600 text-sm text-center py-8 border border-dashed border-gray-800 rounded-lg">
                                🎵 No active bids yet. Be the first!
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
