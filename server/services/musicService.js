const axios = require('axios');

const DEEZER_API_BASE = 'https://api.deezer.com';

// In-memory cache to reduce API calls
const cache = {
    genres: null,
    searches: new Map(),
    albums: new Map(),
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
            const response = await axios.get(`${DEEZER_API_BASE}/search`, {
                params: { q: query, limit }
            });

            const results = {
                data: response.data.data.map(track => ({
                    id: track.id.toString(),
                    title: track.title,
                    artist: track.artist.name,
                    album: track.album.title,
                    duration: track.duration,
                    preview: track.preview,
                    cover: track.album.cover_medium
                })),
                total: response.data.total
            };

            cache.searches.set(cacheKey, {
                data: results,
                timestamp: Date.now()
            });

            return results;
        } catch (error) {
            console.error('Deezer search error:', error.message);
            throw new Error('Failed to search songs');
        }
    }

    /**
     * Search for artists
     */
    async searchArtists(query, limit = 10) {
        try {
            const response = await axios.get(`${DEEZER_API_BASE}/search/artist`, {
                params: { q: query, limit }
            });

            return response.data.data.map(artist => ({
                id: artist.id.toString(),
                name: artist.name,
                picture: artist.picture_medium,
                nbAlbum: artist.nb_album,
                nbFan: artist.nb_fan
            }));
        } catch (error) {
            console.error('Deezer artist search error:', error.message);
            throw new Error('Failed to search artists');
        }
    }

    /**
     * Get available genres
     */
    async getGenres() {
        if (cache.genres) {
            return cache.genres;
        }

        try {
            const response = await axios.get(`${DEEZER_API_BASE}/genre`);

            const genres = response.data.data
                .filter(g => g.id !== 0) // Remove "All" genre
                .map(genre => ({
                    id: genre.id.toString(),
                    name: genre.name,
                    picture: genre.picture_medium
                }));

            cache.genres = genres;
            return genres;
        } catch (error) {
            console.error('Deezer genres error:', error.message);
            throw new Error('Failed to fetch genres');
        }
    }

    /**
     * Get albums by genre
     */
    async getAlbumsByGenre(genreId, limit = 20) {
        try {
            const response = await axios.get(`${DEEZER_API_BASE}/genre/${genreId}/artists`, {
                params: { limit: 10 }
            });

            // Get albums from top artists in this genre
            const artistIds = response.data.data.slice(0, 3).map(a => a.id);
            const albums = [];

            for (const artistId of artistIds) {
                const albumResponse = await axios.get(`${DEEZER_API_BASE}/artist/${artistId}/albums`, {
                    params: { limit: 7 }
                });

                albums.push(...albumResponse.data.data.map(album => ({
                    id: album.id.toString(),
                    title: album.title,
                    artist: album.artist?.name || 'Unknown',
                    cover: album.cover_medium,
                    releaseDate: album.release_date,
                    nbTracks: album.nb_tracks
                })));
            }

            return albums.slice(0, limit);
        } catch (error) {
            console.error('Deezer albums by genre error:', error.message);
            throw new Error('Failed to fetch albums');
        }
    }

    /**
     * Get tracks from an album
     */
    async getTracksByAlbum(albumId) {
        const cacheKey = `album_${albumId}`;

        if (cache.albums.has(cacheKey)) {
            const cached = cache.albums.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return cached.data;
            }
        }

        try {
            const response = await axios.get(`${DEEZER_API_BASE}/album/${albumId}`);

            const tracks = response.data.tracks.data.map(track => ({
                id: track.id.toString(),
                title: track.title,
                artist: track.artist.name,
                album: response.data.title,
                duration: track.duration,
                preview: track.preview,
                cover: response.data.cover_medium,
                trackPosition: track.track_position
            }));

            cache.albums.set(cacheKey, {
                data: tracks,
                timestamp: Date.now()
            });

            return tracks;
        } catch (error) {
            console.error('Deezer album tracks error:', error.message);
            throw new Error('Failed to fetch album tracks');
        }
    }

    /**
     * Get artist's top tracks
     */
    async getArtistTopTracks(artistId, limit = 10) {
        try {
            const response = await axios.get(`${DEEZER_API_BASE}/artist/${artistId}/top`, {
                params: { limit }
            });

            return response.data.data.map(track => ({
                id: track.id.toString(),
                title: track.title,
                artist: track.artist.name,
                album: track.album.title,
                duration: track.duration,
                preview: track.preview,
                cover: track.album.cover_medium
            }));
        } catch (error) {
            console.error('Deezer artist top tracks error:', error.message);
            throw new Error('Failed to fetch artist top tracks');
        }
    }
}

module.exports = new MusicService();
