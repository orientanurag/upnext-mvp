import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Music, MessageSquare, DollarSign, Send, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function MobileWebEnhanced() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedSong, setSelectedSong] = useState(null);
    const [message, setMessage] = useState('');
    const [bidAmount, setBidAmount] = useState('');
    const [userName, setUserName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [recentBids, setRecentBids] = useState([]);

    // Fetch recent bids on load
    useEffect(() => {
        fetchRecentBids();
    }, []);

    const fetchRecentBids = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/bids?limit=5`);
            setRecentBids(response.data);
        } catch (error) {
            console.error('Failed to fetch bids:', error);
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
            toast.error('Failed to search music');
            console.error(error);
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
                userName: userName.trim() || 'Anonymous'
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
                {/* Header */}
                <div className="text-center mb-8 pt-6">
                    <h1 className="text-4xl font-heading font-black text-brand-lime mb-2">UPNEXT</h1>
                    <p className="text-gray-400">Request your vibe & send a message to the DJ</p>
                </div>

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
                                <div key={bid.id} className="bg-brand-gray p-4 rounded-lg border-l-4 border-brand-lime">
                                    <div className="font-bold">{bid.songTitle}</div>
                                    <div className="text-sm text-gray-400">{bid.songArtist}</div>
                                    <div className="text-sm text-brand-lime font-bold mt-1">₹{bid.bidAmount}</div>
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
