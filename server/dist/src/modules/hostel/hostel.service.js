import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
export class HostelService {
    // ============ HOSTEL ============
    async createHostel(data) {
        return prisma.hostel.create({
            data: {
                name: data.name,
                type: data.type,
                address: data.address,
                description: data.description,
                wardenId: data.wardenId,
                allowedYears: data.allowedYears,
            },
            include: {
                warden: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }
    async getHostels(filters) {
        const where = {
            deletedAt: null,
        };
        if (filters?.type)
            where.type = filters.type;
        if (filters?.isActive !== undefined)
            where.isActive = filters.isActive;
        return prisma.hostel.findMany({
            where,
            include: {
                warden: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                blocks: {
                    include: {
                        floors: {
                            include: {
                                rooms: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getHostelById(id) {
        const hostel = await prisma.hostel.findUnique({
            where: { id, deletedAt: null },
            include: {
                warden: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                blocks: {
                    include: {
                        floors: {
                            orderBy: { floorNumber: "asc" },
                            include: {
                                rooms: {
                                    orderBy: { roomNumber: "asc" },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!hostel)
            throw ApiError.notFound("Hostel not found");
        return hostel;
    }
    async updateHostel(id, data) {
        return prisma.hostel.update({
            where: { id },
            data,
            include: {
                warden: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }
    async deleteHostel(id) {
        return prisma.hostel.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }
    // ============ BLOCK ============
    async createBlock(hostelId, data) {
        const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });
        if (!hostel)
            throw ApiError.notFound("Hostel not found");
        return prisma.block.create({
            data: {
                hostelId,
                name: data.name,
                description: data.description,
            },
        });
    }
    async getBlocks(hostelId) {
        return prisma.block.findMany({
            where: { hostelId },
            include: {
                floors: {
                    include: { rooms: true },
                },
            },
            orderBy: { name: "asc" },
        });
    }
    // ============ FLOOR ============
    async createFloor(blockId, data) {
        const block = await prisma.block.findUnique({ where: { id: blockId } });
        if (!block)
            throw ApiError.notFound("Block not found");
        return prisma.floor.create({
            data: {
                blockId,
                floorNumber: data.floorNumber,
                name: data.name,
            },
            include: { rooms: true },
        });
    }
    async getFloors(blockId) {
        return prisma.floor.findMany({
            where: { blockId },
            include: { rooms: true },
            orderBy: { floorNumber: "asc" },
        });
    }
    // ============ ROOM ============
    async createRoom(floorId, data) {
        const floor = await prisma.floor.findUnique({ where: { id: floorId } });
        if (!floor)
            throw ApiError.notFound("Floor not found");
        return prisma.room.create({
            data: {
                floorId,
                roomNumber: data.roomNumber,
                capacity: data.capacity,
                type: data.type,
                feePerSemester: data.feePerSemester,
                amenities: data.amenities ? JSON.stringify(data.amenities) : null,
            },
        });
    }
    async getRooms(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;
        const where = { isActive: true };
        if (filters?.status)
            where.status = filters.status;
        if (filters?.type)
            where.type = filters.type;
        if (filters?.floorId)
            where.floorId = filters.floorId;
        if (filters?.hostelId) {
            where.floor = {
                block: {
                    hostelId: filters.hostelId,
                },
            };
        }
        if (filters?.search) {
            where.roomNumber = { contains: filters.search, mode: "insensitive" };
        }
        const [rooms, total] = await Promise.all([
            prisma.room.findMany({
                where,
                include: {
                    floor: {
                        include: {
                            block: {
                                include: {
                                    hostel: { select: { id: true, name: true, type: true } },
                                },
                            },
                        },
                    },
                    allocations: {
                        where: { status: "ACTIVE" },
                        include: {
                            student: {
                                include: {
                                    user: {
                                        select: { firstName: true, lastName: true, email: true },
                                    },
                                },
                            },
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { roomNumber: "asc" },
            }),
            prisma.room.count({ where }),
        ]);
        return {
            rooms,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getAvailableRooms(hostelId, eligibility) {
        const where = {
            isActive: true,
            status: { in: ["AVAILABLE", "PARTIALLY_OCCUPIED"] },
        };
        // Build a single combined block filter so hostelId and eligibility
        // are AND-ed together, not one overwriting the other.
        const blockFilter = {};
        const hostelFilter = {};
        if (hostelId) {
            blockFilter.hostelId = hostelId;
        }
        if (eligibility) {
            if (eligibility.gender === "OTHER")
                return [];
            const type = eligibility.gender === "MALE" ? "BOYS" : "GIRLS";
            hostelFilter.type = type;
            hostelFilter.allowedYears = { has: eligibility.year };
        }
        if (Object.keys(hostelFilter).length > 0) {
            blockFilter.hostel = hostelFilter;
        }
        if (Object.keys(blockFilter).length > 0) {
            where.floor = { block: blockFilter };
        }
        const rooms = await prisma.room.findMany({
            where,
            include: {
                reservations: { where: { status: "PENDING", expiresAt: { gt: new Date() } }, select: { id: true } },
                floor: {
                    include: {
                        block: {
                            include: {
                                hostel: { select: { id: true, name: true, type: true, allowedYears: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { roomNumber: "asc" },
        });
        return rooms
            .filter((room) => room.occupiedBeds + room.reservations.length < room.capacity)
            .map(({ reservations, ...room }) => ({ ...room, occupiedBeds: room.occupiedBeds + reservations.length }));
    }
    async getRoomById(id) {
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                floor: {
                    include: {
                        block: {
                            include: {
                                hostel: true,
                            },
                        },
                    },
                },
                allocations: {
                    where: { status: "ACTIVE" },
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!room)
            throw ApiError.notFound("Room not found");
        return room;
    }
    async updateRoom(id, data) {
        const room = await prisma.room.findUnique({ where: { id }, select: { occupiedBeds: true } });
        if (!room)
            throw ApiError.notFound("Room not found");
        if (data.capacity !== undefined && data.capacity < room.occupiedBeds) {
            throw ApiError.badRequest("Room capacity cannot be lower than the number of occupied beds");
        }
        const updateData = { ...data };
        if (data.amenities) {
            updateData.amenities = JSON.stringify(data.amenities);
        }
        return prisma.room.update({
            where: { id },
            data: updateData,
        });
    }
    // ============ DASHBOARD STATS ============
    async getDashboardStats() {
        const [totalStudents, totalHostels, rooms, pendingLeaves, openComplaints, pendingFees, recentAllocations,] = await Promise.all([
            prisma.studentProfile.count(),
            prisma.hostel.count({ where: { deletedAt: null, isActive: true } }),
            prisma.room.findMany({ where: { isActive: true }, select: { capacity: true, occupiedBeds: true, status: true } }),
            prisma.leaveRequest.count({ where: { status: "PENDING" } }),
            prisma.complaint.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
            prisma.fee.count({ where: { status: "PENDING" } }),
            prisma.roomAllocation.findMany({
                where: { status: "ACTIVE" },
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    student: {
                        include: {
                            user: {
                                select: { firstName: true, lastName: true },
                            },
                        },
                    },
                    room: {
                        include: {
                            floor: {
                                include: {
                                    block: {
                                        include: {
                                            hostel: { select: { name: true } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
        ]);
        const totalRooms = rooms.length;
        const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);
        const occupiedBeds = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
        // Room status counts for pie chart
        const availableRooms = rooms.filter((r) => r.occupiedBeds === 0).length;
        const partiallyOccupiedRooms = rooms.filter((r) => r.occupiedBeds > 0 && r.occupiedBeds < r.capacity).length;
        const fullyOccupiedRooms = rooms.filter((r) => r.occupiedBeds >= r.capacity).length;
        return {
            totalStudents,
            totalHostels,
            totalRooms,
            totalBeds,
            occupiedBeds,
            availableRooms,
            partiallyOccupiedRooms,
            fullyOccupiedRooms,
            pendingLeaves,
            openComplaints,
            pendingFees,
            recentAllocations,
            occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        };
    }
}
export const hostelService = new HostelService();
//# sourceMappingURL=hostel.service.js.map