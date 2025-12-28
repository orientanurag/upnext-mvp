const axios = require('axios');

const ITUNES_API_BASE = 'https://itunes.apple.com';

// In-memory cache to reduce API calls
const cache = {
    searches: new Map(),
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache for iTunes

class MusicService {
    /**
     * Search for songs by query
     */
    async searchSongs(query, limit = 25) {
        const cacheKey = `search_${query}_${limit}`;

        if (cache.searches.has(cacheKey)) {
            const cached = cache.searches.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return cached.data;
            }
        }

        try {
            const response = await axios.get(`${ITUNES_API_BASE}/search`, {
                params: {
                    term: query,
                    media: 'music',
                    entity: 'song',
                    limit
                }
            });

            const results = {
                data: response.data.results.map(track => ({
                    id: track.trackId.toString(),
                    title: track.trackName,
                    artist: track.artistName,
                    album: track.collectionName,
                    duration: Math.round(track.trackTimeMillis / 1000), // Convert ms to seconds
                    preview: track.previewUrl,
                    cover: track.artworkUrl100?.replace('100x100', '600x600') // Get higher res image
                })),
                total: response.data.resultCount
            };

            cache.searches.set(cacheKey, {
                data: results,
                timestamp: Date.now()
            });

            return results;
        } catch (error) {
            console.error('iTunes search error:', error.message);
            // Fallback to empty results instead of crashing
            return { data: [], total: 0 };
        }
    }

    /**
     * Get available genres - iTunes doesn't have a simple genre list endpoint
     * returning static popular genres
     */
    async getGenres() {
        return [
            { id: '21', name: 'Rock', picture: 'https://cdn-icons-png.flaticon.com/512/3655/3655061.png' },
            { id: '14', name: 'Pop', picture: 'https://cdn-icons-png.flaticon.com/512/3655/3655081.png' },
            { id: '18', name: 'Hip-Hop/Rap', picture: 'https://cdn-icons-png.flaticon.com/512/3655/3655097.png' },
            { id: '11', name: 'Jazz', picture: 'https://cdn-icons-png.flaticon.com/512/3655/3655187.png' },
            { id: '17', name: 'Dance', picture: 'https://cdn-icons-png.flaticon.com/512/3655/3655160.png' },
            { id: '20', name: 'Alternative', picture: 'https://cdn-icons-png.flaticon.com/512/3655/3655166.png' },
            { id: '6', name: 'Country', picture: 'https://cdn-icons-png.flaticon.com/512/3655/3655193.png' },
            { id: '12', name: 'Latin', picture: 'https://cdn-icons-png.flaticon.com/512/3655/3655225.png' }
        ];
    }

    /**
     * Search albums (simulated via search)
     */
    async getAlbumsByGenre(genreId, limit = 20) {
        // Since we can't easily browse by genre in iTunes Search API without complex scraping,
        // we'll return empty or generic function. For MVP, we primarily need search.
        return [];
    }

    /**
     * Get tracks from an album
     */
    async getTracksByAlbum(albumId) {
        try {
            const response = await axios.get(`${ITUNES_API_BASE}/lookup`, {
                params: {
                    id: albumId,
                    entity: 'song'
                }
            });

            // First result is collection, rest are tracks
            const results = response.data.results;
            if (results.length < 2) return [];

            const collection = results[0];
            const tracks = results.slice(1).map(track => ({
                id: track.trackId.toString(),
                title: track.trackName,
                artist: track.artistName,
                album: collection.collectionName,
                duration: Math.round(track.trackTimeMillis / 1000),
                preview: track.previewUrl,
                cover: collection.artworkUrl100?.replace('100x100', '600x600'),
                trackPosition: track.trackNumber
            }));

            return tracks;
        } catch (error) {
            console.error('iTunes album lookup error:', error.message);
            return [];
        }
    }
}

module.exports = new MusicService();
