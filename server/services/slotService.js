const slotService = {
    /**
     * Generate slots for an event
     * @param {Object} prisma - Prisma Client instance
     * @param {Object} event - Event object
     */
    async generateSlots(prisma, event) {
        console.log(`Creating slots for event ${event.id}`);
        const { id, startTime, durationHours, vibesPerHour } = event;

        if (!startTime) return []; // Cannot generate without start time

        const slotDurationMinutes = 60 / vibesPerHour;
        const totalSlots = durationHours * vibesPerHour;

        const slots = [];
        let currentTime = new Date(startTime);

        for (let i = 0; i < totalSlots; i++) {
            const slotTime = new Date(currentTime);
            slots.push({
                eventId: id,
                slotNumber: i + 1,
                scheduledTime: slotTime,
                status: 'available'
            });
            // Advance time
            currentTime.setMinutes(currentTime.getMinutes() + slotDurationMinutes);
        }

        // Batch create slots
        // Prisma doesn't support createMany for all DBs, but MongoDB does
        await prisma.vibeSlot.createMany({
            data: slots
        });

        console.log(`Generated ${slots.length} slots for event ${event.id}`);
        return slots;
    },

    /**
     * Get the current active slot based on time
     * @param {Object} prisma - Prisma Client instance
     * @param {String} eventId - Event ID
     */
    async getCurrentSlot(prisma, eventId) {
        const now = new Date();

        // Find the slot that started most recently
        // Ideally: scheduledTime <= now AND nextSlot.scheduledTime > now
        // Or just find the last slot where scheduledTime <= now

        const currentSlot = await prisma.vibeSlot.findFirst({
            where: {
                eventId: eventId,
                scheduledTime: {
                    lte: now
                }
            },
            orderBy: {
                scheduledTime: 'desc'
            }
        });

        // Check if the slot is still valid (not expired based on duration)
        // We need vibesPerHour/duration to know slot length.
        // Fetch event to get duration per slot
        if (currentSlot) {
            const event = await prisma.event.findUnique({ where: { id: eventId } });
            if (event) {
                const slotDurationMs = (60 / event.vibesPerHour) * 60 * 1000;
                const slotEndTime = new Date(currentSlot.scheduledTime.getTime() + slotDurationMs);

                if (now > slotEndTime) {
                    return null; // Slot expired, maybe event ended or gap?
                }

                // Attach endTime for frontend convenience
                currentSlot.endTime = slotEndTime;
            }
        }

        return currentSlot;
    },

    /**
     * Finds the best available slot for a new bid
     * @param {Object} prisma - Prisma instance
     * @param {String} eventId - active event ID
     * @param {String} currentSlotId - current calculated slot ID (preferred)
     */
    async assignBidToSlot(prisma, eventId, currentSlotId) {
        // Find current slot
        const currentSlot = await prisma.vibeSlot.findUnique({ where: { id: currentSlotId } });
        if (!currentSlot) return null;

        const MAX_BIDS_PER_SLOT = 5; // Configurable: User mentioned "4 slots example"

        // Check if current slot is full
        const currentCount = await prisma.bid.count({
            where: {
                vibeSlotId: currentSlotId,
                status: { in: ['pending', 'approved'] }
            }
        });

        if (currentCount < MAX_BIDS_PER_SLOT) {
            return currentSlotId;
        }

        // Current slot full, look for next available slot
        console.log(`Slot ${currentSlot.slotNumber} full (${currentCount} bids). Looking for next slot...`);

        const nextSlots = await prisma.vibeSlot.findMany({
            where: {
                eventId: eventId,
                slotNumber: { gt: currentSlot.slotNumber }
            },
            orderBy: { slotNumber: 'asc' },
            take: 5 // Look ahead few slots
        });

        for (const slot of nextSlots) {
            const slotCount = await prisma.bid.count({
                where: {
                    vibeSlotId: slot.id,
                    status: { in: ['pending', 'approved'] }
                }
            });

            if (slotCount < MAX_BIDS_PER_SLOT) {
                console.log(`Found available slot: #${slot.slotNumber}`);
                return slot.id;
            }
        }

        // If no slots available (all full), default to current or reject?
        // For now, return null to indicate full capacity, or fallback to current (overbook)
        // Let's overbook current to avoid completely blocking if system is saturated
        console.warn('All near-future slots full. Overbooking current slot.');
        return currentSlotId;
    },

    /**
     * Get bids for a specific slot
     * @param {Object} prisma - Prisma Client instance
     * @param {String} slotId - VibeSlot ID
     * @param {Number} limit - Optional limit
     */
    async getTopBids(prisma, slotId, limit = 50) {
        // User asked for "Top 3" for specific views, but DJ needs all.
        // We defaults to 50 (effectively all) unless specified.
        return await prisma.bid.findMany({
            where: {
                vibeSlotId: slotId,
                status: { in: ['pending', 'approved'] } // Only active bids
            },
            orderBy: [
                { bidAmount: 'desc' },
                { submittedAt: 'asc' } // First bidder wins tie
            ],
            take: limit,
            include: {
                wallet: true
            }
        });
    },

    /**
     * Process refunds for a finished slot
     * @param {Object} prisma - Prisma Client instance
     * @param {String} slotId - The ID of the slot that just ended
     */
    async processSlotExpiry(prisma, slotId) {
        console.log(`Processing expiry for slot ${slotId}`);
        const expiredBids = await prisma.bid.findMany({
            where: {
                vibeSlotId: slotId,
                status: { in: ['pending', 'approved'] }, // Not played
                paymentStatus: 'paid'
            }
        });

        for (const bid of expiredBids) {
            console.log(`Refund request for expired bid ${bid.id}`);
            if (bid.walletId) {
                await prisma.$transaction([
                    prisma.userWallet.update({
                        where: { id: bid.walletId },
                        data: { balance: { increment: bid.bidAmount } }
                    }),
                    prisma.walletTransaction.create({
                        data: {
                            walletId: bid.walletId,
                            amount: bid.bidAmount,
                            type: 'REFUND',
                            description: `Refund: Slot ended without play for "${bid.songTitle}"`,
                            referenceId: bid.id
                        }
                    }),
                    prisma.bid.update({
                        where: { id: bid.id },
                        data: { status: 'rejected', paymentStatus: 'refunded' }
                    })
                ]);
            } else {
                // Just mark rejected if no wallet (shouldn't happen with current logic)
                await prisma.bid.update({
                    where: { id: bid.id },
                    data: { status: 'rejected' }
                });
            }
        }
    }
};

module.exports = slotService;
