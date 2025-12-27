const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class VibeService {
    /**
     * Create all vibe slots for an event
     */
    async createEventVibes(eventId) {
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            throw new Error('Event not found');
        }

        const { duration Hours, vibesPerHour, vibeDurationMinutes, startTime } = event;

        if (!startTime) {
            throw new Error('Event must have a start time');
        }

        const totalVibes = durationHours * vibesPerHour;
        const slotIntervalMs = (60 / vibesPerHour) * 60 * 1000; // milliseconds between each vibe

        const vibeSlots = [];
        let currentTime = new Date(startTime);

        for (let i = 0; i < totalVibes; i++) {
            vibeSlots.push({
                eventId,
                slotNumber: i + 1,
                scheduledTime: new Date(currentTime),
                status: i === 0 ? 'bidding' : 'available', // First slot is immediately open for bidding
                createdAt: new Date()
            });

            currentTime = new Date(currentTime.getTime() + slotIntervalMs);
        }

        // Bulk create all vibe slots
        await prisma.vibeSlot.createMany({
            data: vibeSlots
        });

        console.log(`✅ Created ${totalVibes} vibe slots for event: ${event.name}`);
        return vibeSlots;
    }

    /**
     * Get current available slots (open for bidding)
     */
    async getCurrentAvailableSlots(eventId) {
        return await prisma.vibeSlot.findMany({
            where: {
                eventId,
                status: {
                    in: ['available', 'bidding']
                }
            },
            orderBy: {
                slotNumber: 'asc'
            },
            take: 10, // Show next 10 slots
            include: {
                bids: {
                    where: {
                        status: 'approved'
                    },
                    orderBy: {
                        bidAmount: 'desc'
                    },
                    take: 1 // Get highest bid
                }
            }
        });
    }

    /**
     * Get currently active vibe slot
     */
    async getCurrentActiveSlot(eventId) {
        const now = new Date();

        // Find the slot that should be playing now
        return await prisma.vibeSlot.findFirst({
            where: {
                eventId,
                scheduledTime: {
                    lte: now
                },
                status: {
                    in: ['bidding', 'locked']
                }
            },
            orderBy: {
                scheduledTime: 'desc'
            },
            include: {
                bids: {
                    where: {
                        status: 'approved'
                    },
                    orderBy: {
                        bidAmount: 'desc'
                    },
                    take: 1
                }
            }
        });
    }

    /**
     * Progress to next vibe slot
     */
    async progressToNextSlot(currentSlotId) {
        const currentSlot = await prisma.vibeSlot.findUnique({
            where: { id: currentSlotId },
            include: { event: true }
        });

        if (!currentSlot) {
            throw new Error('Slot not found');
        }

        // Mark current slot as completed
        await prisma.vibeSlot.update({
            where: { id: currentSlotId },
            data: { status: 'completed' }
        });

        // Find next slot and open it for bidding
        const nextSlot = await prisma.vibeSlot.findFirst({
            where: {
                eventId: currentSlot.eventId,
                slotNumber: {
                    gt: currentSlot.slotNumber
                },
                status: 'available'
            },
            orderBy: {
                slotNumber: 'asc'
            }
        });

        if (nextSlot) {
            await prisma.vibeSlot.update({
                where: { id: nextSlot.id },
                data: { status: 'bidding' }
            });

            return nextSlot;
        }

        return null; // No more slots
    }

    /**
     * Lock a slot (no more bids allowed)
     */
    async lockSlot(slotId) {
        return await prisma.vibeSlot.update({
            where: { id: slotId },
            data: { status: 'locked' }
        });
    }

    /**
     * Set winner for a slot
     */
    async setSlotWinner(slotId, bidId) {
        // Update the slot
        await prisma.vibeSlot.update({
            where: { id: slotId },
            data: {
                currentWinnerBidId: bidId,
                status: 'locked'
            }
        });

        // Update the bid status to 'played'
        await prisma.bid.update({
            where: { id: bidId },
            data: {
                status: 'played',
                playedAt: new Date()
            }
        });

        return true;
    }

    /**
     * Calculate slot schedule
     */
    calculateSlotSchedule(durationHours, vibesPerHour, startTime) {
        const totalVibes = durationHours * vibesPerHour;
        const slotIntervalMs = (60 / vibesPerHour) * 60 * 1000;

        const schedule = [];
        let currentTime = new Date(startTime);

        for (let i = 0; i < totalVibes; i++) {
            schedule.push({
                slotNumber: i + 1,
                scheduledTime: new Date(currentTime),
                estimatedEndTime: new Date(currentTime.getTime() + slotIntervalMs)
            });

            currentTime = new Date(currentTime.getTime() + slotIntervalMs);
        }

        return schedule;
    }

    /**
     * Get slot statistics
     */
    async getSlotStatistics(eventId) {
        const slots = await prisma.vibeSlot.findMany({
            where: { eventId },
            include: {
                bids: {
                    where: {
                        status: {
                            in: ['approved', 'played']
                        }
                    }
                }
            }
        });

        const stats = {
            totalSlots: slots.length,
            completedSlots: slots.filter(s => s.status === 'completed').length,
            activeSlot: slots.find(s => s.status === 'locked'),
            upcomingSlots: slots.filter(s => s.status === 'available').length,
            totalBids: slots.reduce((sum, slot) => sum + slot.bids.length, 0),
            totalRevenue: slots.reduce((sum, slot) =>
                sum + slot.bids.reduce((bidSum, bid) => bidSum + Number(bid.bidAmount), 0), 0
            )
        };

        return stats;
    }
}

module.exports = new VibeService();
