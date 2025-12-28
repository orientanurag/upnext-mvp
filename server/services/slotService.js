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
     * Get top 3 bids for a specific slot
     * @param {Object} prisma - Prisma Client instance
     * @param {String} slotId - VibeSlot ID
     */
    async getTopBids(prisma, slotId) {
        return await prisma.bid.findMany({
            where: {
                vibeSlotId: slotId,
                status: { in: ['pending', 'approved'] } // Only active bids
            },
            orderBy: [
                { bidAmount: 'desc' },
                { submittedAt: 'asc' } // First bidder wins tie
            ],
            take: 3,
            include: {
                wallet: true // Include wallet info if needed
            }
        });
    }
};

module.exports = slotService;
