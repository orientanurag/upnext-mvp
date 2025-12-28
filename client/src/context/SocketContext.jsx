import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [gameState, setGameState] = useState({
        bids: [],
        leaderboard: [],
        currentSlot: {
            id: Date.now(),
            endTime: Date.now() + 5 * 60 * 1000,
            status: 'ACTIVE'
        },
        currentWinner: null
    });

    useEffect(() => {
        // Determine socket URL based on environment
        const isDevelopment = import.meta.env.DEV;
        const socketUrl = isDevelopment
            ? 'http://localhost:3000'
            : window.location.origin;

        console.log('Connecting to socket server:', socketUrl);

        const newSocket = io(socketUrl, {
            path: '/socket.io',
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        newSocket.on('connect', () => {
            console.log('✅ Connected to socket server');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Disconnected from socket server');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        newSocket.on('stateUpdate', (newState) => {
            console.log('📊 State update received:', newState);
            setGameState(newState);
        });

        // Listen for initial data
        newSocket.on('initialData', (data) => {
            console.log('📥 Initial data received:', data);
            const initialBids = data.bids || [];
            setGameState(prevState => ({
                ...prevState,
                bids: initialBids,
                leaderboard: initialBids.filter(b => b.status === 'approved')
            }));
        });

        // Listen for new bid submissions
        newSocket.on('bidSubmitted', (newBid) => {
            console.log('🆕 New bid submitted:', newBid);
            setGameState(prevState => ({
                ...prevState,
                bids: [newBid, ...prevState.bids]
            }));
        });

        // Listen for bid status updates (approve/reject/play)
        newSocket.on('bidUpdated', (updatedBid) => {
            console.log('✅ Bid updated:', updatedBid);
            setGameState(prevState => {
                // Check if bid exists
                const exists = prevState.bids && prevState.bids.some(b => b.id === updatedBid.id);
                let updatedBids = prevState.bids || [];

                if (exists) {
                    updatedBids = updatedBids.map(bid =>
                        bid.id === updatedBid.id ? updatedBid : bid
                    );
                } else {
                    updatedBids = [updatedBid, ...updatedBids];
                }

                return {
                    ...prevState,
                    bids: updatedBids,
                    leaderboard: updatedBids.filter(b => b.status === 'approved')
                };
            });
        });

        setSocket(newSocket);

        return () => {
            console.log('Closing socket connection');
            newSocket.close();
        };
    }, []);

    const submitBid = (bidData) => {
        if (socket && isConnected) {
            socket.emit('submitBid', bidData);
        } else {
            console.error('Cannot submit bid: Socket not connected');
        }
    };

    const adminAction = (actionData) => {
        if (socket && isConnected) {
            socket.emit('adminAction', actionData);
        } else {
            console.error('Cannot perform admin action: Socket not connected');
        }
    };

    const nextSlot = () => {
        if (socket && isConnected) {
            socket.emit('adminNextSlot');
        } else {
            console.error('Cannot trigger next slot: Socket not connected');
        }
    };

    return (
        <SocketContext.Provider value={{ socket, gameState, isConnected, submitBid, adminAction, nextSlot }}>
            {children}
        </SocketContext.Provider>
    );
};
