import React, { useState, useEffect } from 'react';

export default function CountdownTimer({ endTime, onExpire, className = '' }) {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = Date.now();
            const difference = endTime - now;
            return Math.max(0, difference);
        };

        // Initial calculation
        setTimeLeft(calculateTimeLeft());

        // Update every second
        const interval = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining <= 0 && onExpire) {
                onExpire();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime, onExpire]);

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    const isLowTime = minutes === 0 && seconds < 60;

    return (
        <div className={`font-mono ${isLowTime ? 'text-red-500 animate-pulse' : ''} ${className}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
    );
}
