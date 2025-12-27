import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState({
        bids: [],
        leaderboard: [],
        currentSlot: {},
        currentWinner: null
    });

    useEffect(() => {
        // Determine URL based on environment
        // In dev (without proxy issues) or prod
        const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;

        // For now, let's try to assume relative path if proxy is set up or same origin
        const newSocket = io('/', { path: '/socket.io' });

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
        });

        newSocket.on('stateUpdate', (newState) => {
            console.log('State received:', newState);
            setGameState(newState);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    const submitBid = (bidData) => {
        if (socket) socket.emit('submitBid', bidData);
    };

    const adminAction = (actionData) => {
        if (socket) socket.emit('adminAction', actionData);
    };

    const nextSlot = () => {
        if (socket) socket.emit('adminNextSlot');
    }

    return (
        <SocketContext.Provider value={{ socket, gameState, submitBid, adminAction, nextSlot }}>
            {children}
        </SocketContext.Provider>
    );
};
