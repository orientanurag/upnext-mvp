import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Music, MessageSquare, DollarSign, Send, Loader } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function MobileWebEnhanced() {
    const { gameState } = useSocket();
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedSong, setSelectedSong] = useState(null);
    const [message, setMessage] = useState('');
    const [bidAmount, setBidAmount] = useState('');
    const [userName, setUserName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [recentBids, setRecentBids] = useState([]);
    const [loading, setLoading] = useState(false);

    // Wallet State
    const [userId, setUserId] = useState('');
    const [walletBalance, setWalletBalance] = useState(0);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [addingMoney, setAddingMoney] = useState(false);

    // Initialize User
    useEffect(() => {
        let storedId = localStorage.getItem('upnext_user_id');
        if (!storedId) {
            storedId = crypto.randomUUID();
            localStorage.setItem('upnext_user_id', storedId);
        }
        setUserId(storedId);
        fetchWalletBalance(storedId);
    }, []);

    const fetchWalletBalance = async (id) => {
        try {
            const response = await axios.get(`${API_BASE}/api/wallet/balance`, {
                params: { userId: id }
            });
            setWalletBalance(response.data.balance);
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        }
    };

    const handleAddMoney = async (amount) => {
        setAddingMoney(true);
        try {
            const response = await axios.post(`${API_BASE}/api/wallet/add`, {
                userId,
                amount
            });
            setWalletBalance(response.data.balance);
            toast.success(`Added ₹${amount} to wallet!`);
            setShowWalletModal(false);
        } catch (error) {
            toast.error('Failed to add money');
        } finally {
            setAddingMoney(false);
        }
    };

    // Update recent bids when gameState changes (socket updates)
    useEffect(() => {
        if (gameState.bids && gameState.bids.length > 0) {
            setRecentBids(gameState.bids.slice(0, 5));
            // Check if our balance might have changed (e.g. refund/approval)
            // Ideally we'd have a specific event for this, but for now we can poll or retry
            fetchWalletBalance(userId);
        }
    }, [gameState.bids, userId]);

    // Fetch recent bids on load
    useEffect(() => {
        fetchRecentBids();
    }, []);

    // ... (rest of search/fetch logic) ...
    const fetchRecentBids = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/api/bids?limit=5`);
            setRecentBids(response.data || []);
        } catch (error) {
            console.error('Failed to fetch bids:', error);
            // Don't crash the app if bids can't be fetched
            setRecentBids([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const response = await axios.get(`${API_BASE}/api/music/search`, {
                params: { q: searchQuery, limit: 10 }
            });
            setSearchResults(response.data.data || []);
        } catch (error) {
            console.error('Music search error:', error);
            toast.error('Failed to search music. Please try again.');
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectSong = (song) => {
        setSelectedSong(song);
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!selectedSong) {
            toast.error('Please select a song');
            return;
        }

        if (!message.trim()) {
            toast.error('Please add a message for the DJ');
            return;
        }

        const amount = parseFloat(bidAmount);
        if (isNaN(amount) || amount < 50) {
            toast.error('Minimum bid is ₹50');
            return;
        }

        setSubmitting(true);

        try {
            await axios.post(`${API_BASE}/api/bids`, {
                songTitle: selectedSong.title,
                songArtist: selectedSong.artist,
                songAlbum: selectedSong.album,
                deezerTrackId: selectedSong.id,
                message: message.trim(),
                bidAmount: amount,
                userName: userName.trim() || 'Anonymous',
                userId // Pass userId for wallet transaction
            });

            toast.success('Bid submitted successfully!');

            // Reset form
            setSelectedSong(null);
            setMessage('');
            setBidAmount('');

            // Refresh recent bids
            fetchRecentBids();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to submit bid');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-brand-black to-black text-white p-4 pb-20">
            <div className="max-w-2xl mx-auto">
                {/* Header with Wallet */}
                <div className="flex justify-between items-center mb-8 pt-6">
                    <div>
                        <h1 className="text-4xl font-heading font-black text-brand-lime mb-1">UPNEXT</h1>
                        <p className="text-xs text-gray-400">Request your vibe</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Balance</div>
                        <div className="text-2xl font-bold text-white mb-2 flex items-center justify-end gap-1">
                            <span className="text-brand-lime">₹</span>
                            {walletBalance}
                        </div>
                        <div
                            onClick={() => setShowWalletModal(true)}
                            className="bg-brand-lime/20 border border-brand-lime text-brand-lime text-xs font-bold px-3 py-1.5 rounded-full hover:bg-brand-lime hover:text-black transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                            <DollarSign size={12} />
                            ADD MONEY
                        </div>
                    </div>
                </div>

                {/* Wallet Modal */}
                {showWalletModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-brand-gray border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="text-xl font-bold mb-6 text-center text-white">Add Money to Wallet</h3>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {[100, 200, 500, 1000].map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => handleAddMoney(amount)}
                                        disabled={addingMoney}
                                        className="relative group bg-black border border-gray-700 hover:border-brand-lime py-4 rounded-xl font-bold text-lg transition-all"
                                    >
                                        <div className="absolute inset-0 bg-brand-lime/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                                        <span className="text-gray-300 group-hover:text-white relative z-10 transition-colors">₹{amount}</span>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowWalletModal(false)}
                                className="w-full py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 font-bold transition-colors"
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                )}

                {/* Song Search */}
                <div className="bg-brand-gray p-6 rounded-xl mb-6 border border-gray-800">
                    <label className="block text-sm font-bold text-gray-300 mb-3">
                        <Music className="inline mr-2" size={16} />
                        SEARCH FOR A SONG
                    </label>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Song name, artist, album..."
                            className="flex-1 px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-lime"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={searching}
                            className="px-6 py-3 bg-brand-lime text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
                        >
                            {searching ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
                        </button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {searchResults.map((song) => (
                                <div
                                    key={song.id}
                                    onClick={() => handleSelectSong(song)}
                                    className="flex items-center gap-3 p-3 bg-black rounded-lg cursor-pointer hover:bg-gray-900 transition-colors"
                                >
                                    <img src={song.cover} alt={song.title} className="w-12 h-12 rounded" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate">{song.title}</div>
                                        <div className="text-sm text-gray-400 truncate">{song.artist}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Selected Song */}
                    {selectedSong && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-brand-lime to-yellow-400 text-black rounded-lg">
                            <div className="flex items-center gap-3">
                                <img src={selectedSong.cover} alt={selectedSong.title} className="w-16 h-16 rounded" />
                                <div className="flex-1">
                                    <div className="font-black text-lg">{selectedSong.title}</div>
                                    <div className="font-medium">{selectedSong.artist}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Message Input */}
                <div className="bg-brand-gray p-6 rounded-xl mb-6 border border-gray-800">
                    <label className="block text-sm font-bold text-gray-300 mb-3">
                        <MessageSquare className="inline mr-2" size={16} />
                        YOUR MESSAGE TO THE DJ
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={500}
                        placeholder="Write a special message for the DJ to read aloud (max 500 characters)..."
                        rows={4}
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-lime resize-none"
                    />
                    <div className="text-right text-sm text-gray-500 mt-2">
                        {message.length}/500
                    </div>
                </div>

                {/* Bid Amount */}
                <div className="bg-brand-gray p-6 rounded-xl mb-6 border border-gray-800">
                    <label className="block text-sm font-bold text-gray-300 mb-3">
                        <DollarSign className="inline mr-2" size={16} />
                        YOUR BID AMOUNT
                    </label>
                    <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Minimum ₹50"
                        min="50"
                        step="10"
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white text-2xl font-bold placeholder-gray-500 focus:outline-none focus:border-brand-lime"
                    />
                    <div className="flex gap-2 mt-3">
                        {[50, 100, 200, 500].map(amount => (
                            <button
                                key={amount}
                                onClick={() => setBidAmount(amount.toString())}
                                className="flex-1 py-2 bg-black border border-gray-700 rounded-lg hover:border-brand-lime transition-colors text-sm font-bold"
                            >
                                ₹{amount}
                            </button>
                        ))}
                    </div>
                </div>

                {/* User Name (Optional) */}
                <div className="bg-brand-gray p-6 rounded-xl mb-6 border border-gray-800">
                    <label className="block text-sm font-bold text-gray-300 mb-3">
                        YOUR NAME (Optional)
                    </label>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Anonymous"
                        maxLength={100}
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-lime"
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-brand-lime to-yellow-400 text-black font-black text-lg rounded-xl hover:from-yellow-400 hover:to-brand-lime transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader className="animate-spin" size={24} />
                            SUBMITTING...
                        </>
                    ) : (
                        <>
                            <Send size={24} />
                            SUBMIT BID
                        </>
                    )}
                </button>

                {/* Recent Bids */}
                {recentBids.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-bold mb-4 text-gray-300">Recent Bids</h3>
                        <div className="space-y-2">
                            {recentBids.map((bid) => (
                                <div key={bid.id} className={`bg-brand-gray p-4 rounded-lg border-l-4 ${bid.status === 'approved' ? 'border-green-500' :
                                    bid.status === 'rejected' ? 'border-red-500' :
                                        'border-brand-lime'
                                    }`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-bold">{bid.songTitle}</div>
                                            <div className="text-sm text-gray-400">{bid.songArtist}</div>
                                            <div className="text-sm text-brand-lime font-bold mt-1">₹{bid.bidAmount}</div>
                                        </div>
                                        {bid.status === 'approved' && (
                                            <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                                                ✓ APPROVED
                                            </span>
                                        )}
                                        {bid.status === 'rejected' && (
                                            <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                                ✗ REJECTED
                                            </span>
                                        )}
                                        {bid.status === 'pending' && (
                                            <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                                                ⏳ PENDING
                                            </span>
                                        )}
                                        {bid.status === 'played' && (
                                            <span className="px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                                                🎵 PLAYED
                                            </span>
                                        )}
                                    </div>
                                    {bid.message && (
                                        <div className="text-sm text-gray-500 mt-2 italic">"{bid.message}"</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
