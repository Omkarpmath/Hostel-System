import { prisma } from "../../config/db.js";
import { roomCache, dashboardCache } from "../../config/cache.js";
import { ApiError } from "../../utils/ApiError.js";
import { operationsService } from "../operations/operations.service.js";
import { announcementService } from "../announcement/announcement.service.js";
import { logAuditEvent } from "../../utils/audit.js";
import { parseCsv } from "../../utils/csv.js";
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
        const room = await prisma.room.create({
            data: {
                floorId,
                roomNumber: data.roomNumber,
                capacity: data.capacity,
                type: data.type,
                feePerSemester: data.feePerSemester,
                amenities: data.amenities ? JSON.stringify(data.amenities) : null,
            },
        });
        roomCache.invalidate();
        return room;
    }
    async getRooms(filters, userRole) {
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
        if (filters?.hostelType) {
            where.floor = {
                ...where.floor,
                block: {
                    ...(where.floor?.block || {}),
                    hostel: {
                        ...(where.floor?.block?.hostel || {}),
                        type: filters.hostelType,
                    },
                },
            };
        }
        if (filters?.year) {
            where.allocations = {
                some: {
                    status: "ACTIVE",
                    student: {
                        year: Number(filters.year),
                    },
                },
            };
        }
        if (filters?.search) {
            const s = filters.search.trim();
            where.OR = [
                { roomNumber: { contains: s, mode: "insensitive" } },
                {
                    allocations: {
                        some: {
                            status: "ACTIVE",
                            student: {
                                OR: [
                                    { usn: { contains: s, mode: "insensitive" } },
                                    {
                                        user: {
                                            OR: [
                                                { firstName: { contains: s, mode: "insensitive" } },
                                                { lastName: { contains: s, mode: "insensitive" } },
                                                { email: { contains: s, mode: "insensitive" } },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            ];
        }
        const [rawRooms, total] = await Promise.all([
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
                    blockedBy: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    allocations: {
                        where: { status: "ACTIVE" },
                        include: {
                            student: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                            phone: true,
                                            avatarUrl: true,
                                        },
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
        const isStaff = userRole === "ADMIN" || userRole === "WARDEN";
        // Privacy & UX guard: If viewed by student, sanitize blocked rooms to look exactly like standard occupied rooms
        const rooms = rawRooms.map((room) => {
            if (isStaff) {
                return room;
            }
            if (room.status === "BLOCKED") {
                return {
                    ...room,
                    status: "OCCUPIED",
                    occupiedBeds: room.capacity,
                    blockedAt: null,
                    blockedById: null,
                    blockedReason: null,
                    blockedBy: null,
                    allocations: [],
                };
            }
            return {
                ...room,
                blockedAt: null,
                blockedById: null,
                blockedReason: null,
                blockedBy: null,
                allocations: [],
            };
        });
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
        const cacheKey = `avail_rooms:${hostelId || "all"}:${eligibility ? `${eligibility.gender}_${eligibility.year}` : "all"}`;
        const cached = roomCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const where = {
            isActive: true,
            status: { notIn: ["BLOCKED", "MAINTENANCE"] },
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
        const result = rooms
            .filter((room) => room.occupiedBeds + room.reservations.length < room.capacity)
            .map(({ reservations, ...room }) => ({ ...room, occupiedBeds: room.occupiedBeds + reservations.length }));
        roomCache.set(cacheKey, result, 5_000); // Cache for 5 seconds
        return result;
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
        const updatedRoom = await prisma.room.update({
            where: { id },
            data: updateData,
        });
        roomCache.invalidate();
        return updatedRoom;
    }
    async blockRoom(id, adminUserId, reason) {
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                allocations: { where: { status: "ACTIVE" } },
                reservations: { where: { status: "PENDING", expiresAt: { gt: new Date() } } },
            },
        });
        if (!room)
            throw ApiError.notFound("Room not found");
        if (room.status === "BLOCKED") {
            throw ApiError.badRequest("Room is already blocked");
        }
        if (room.allocations.length > 0 || room.occupiedBeds > 0) {
            throw ApiError.badRequest("Cannot block room with active student allocations. Please reallocate or vacate students first.");
        }
        if (room.reservations.length > 0) {
            throw ApiError.badRequest("Cannot block room with pending student reservations.");
        }
        const updated = await prisma.room.update({
            where: { id },
            data: {
                status: "BLOCKED",
                blockedAt: new Date(),
                blockedById: adminUserId,
                blockedReason: reason?.trim() || null,
            },
            include: {
                blockedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
        roomCache.invalidate();
        await logAuditEvent({
            actorId: adminUserId,
            actorRole: "ADMIN",
            action: "ROOM_BLOCKED",
            entityType: "Room",
            entityId: id,
            details: { roomNumber: updated.roomNumber, reason: reason?.trim() || null },
        });
        return updated;
    }
    async unblockRoom(id, actorId) {
        const room = await prisma.room.findUnique({
            where: { id },
        });
        if (!room)
            throw ApiError.notFound("Room not found");
        if (room.status !== "BLOCKED") {
            throw ApiError.badRequest("Room is not blocked");
        }
        const newStatus = room.occupiedBeds >= room.capacity
            ? "FULL"
            : room.occupiedBeds > 0
                ? "PARTIALLY_OCCUPIED"
                : "AVAILABLE";
        const updated = await prisma.room.update({
            where: { id },
            data: {
                status: newStatus,
                blockedAt: null,
                blockedById: null,
                blockedReason: null,
            },
            include: {
                blockedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
        roomCache.invalidate();
        if (actorId) {
            await logAuditEvent({
                actorId,
                actorRole: "ADMIN",
                action: "ROOM_UNBLOCKED",
                entityType: "Room",
                entityId: id,
                details: { roomNumber: updated.roomNumber },
            });
        }
        return updated;
    }
    // ============ BULK INFRASTRUCTURE IMPORT ============
    async bulkImportRooms(csvText, actorId, actorRole = "ADMIN") {
        const rows = parseCsv(csvText);
        if (rows.length === 0) {
            throw ApiError.badRequest("CSV file is empty or missing headers");
        }
        let createdRooms = 0;
        let updatedRooms = 0;
        const errors = [];
        const hostelMap = new Map();
        const blockMap = new Map();
        const floorMap = new Map();
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;
            const hostelName = (row.hostelname || row.hostel || "").trim();
            const rawHostelType = (row.hosteltype || "BOYS").toUpperCase().trim();
            const hostelType = rawHostelType === "GIRLS" ? "GIRLS" : "BOYS";
            const blockName = (row.blockname || row.block || "Block A").trim();
            const floorNumber = parseInt(row.floornumber || row.floor || "1", 10) || 1;
            const roomNumber = (row.roomnumber || row.room || "").trim();
            const capacity = parseInt(row.capacity || "2", 10) || 2;
            const rawRoomType = (row.roomtype || "").toUpperCase().trim();
            const roomType = rawRoomType === "SINGLE"
                ? "SINGLE"
                : rawRoomType === "TRIPLE"
                    ? "TRIPLE"
                    : rawRoomType === "DORMITORY"
                        ? "DORMITORY"
                        : capacity === 1
                            ? "SINGLE"
                            : capacity === 3
                                ? "TRIPLE"
                                : capacity > 3
                                    ? "DORMITORY"
                                    : "DOUBLE";
            const feePerSemester = parseFloat(row.feepersemester || row.fee || "0") || 0;
            const amenities = row.amenities ? JSON.stringify(row.amenities.split(";").map((a) => a.trim()).filter(Boolean)) : null;
            if (!hostelName || !roomNumber) {
                errors.push(`Row ${rowNum}: Missing required HostelName or RoomNumber`);
                continue;
            }
            try {
                // 1. Hostel
                let hostelId = hostelMap.get(hostelName.toLowerCase());
                if (!hostelId) {
                    let hostel = await prisma.hostel.findUnique({
                        where: { name: hostelName },
                    });
                    if (!hostel) {
                        hostel = await prisma.hostel.create({
                            data: {
                                name: hostelName,
                                type: hostelType,
                                allowedYears: [1, 2, 3, 4],
                            },
                        });
                    }
                    hostelId = hostel.id;
                    hostelMap.set(hostelName.toLowerCase(), hostelId);
                }
                // 2. Block
                const blockKey = `${hostelId}:${blockName.toLowerCase()}`;
                let blockId = blockMap.get(blockKey);
                if (!blockId) {
                    let block = await prisma.block.findUnique({
                        where: {
                            hostelId_name: {
                                hostelId,
                                name: blockName,
                            },
                        },
                    });
                    if (!block) {
                        block = await prisma.block.create({
                            data: {
                                hostelId,
                                name: blockName,
                            },
                        });
                    }
                    blockId = block.id;
                    blockMap.set(blockKey, blockId);
                }
                // 3. Floor
                const floorKey = `${blockId}:${floorNumber}`;
                let floorId = floorMap.get(floorKey);
                if (!floorId) {
                    let floor = await prisma.floor.findUnique({
                        where: {
                            blockId_floorNumber: {
                                blockId,
                                floorNumber,
                            },
                        },
                    });
                    if (!floor) {
                        floor = await prisma.floor.create({
                            data: {
                                blockId,
                                floorNumber,
                                name: `Floor ${floorNumber}`,
                            },
                        });
                    }
                    floorId = floor.id;
                    floorMap.set(floorKey, floorId);
                }
                // 4. Room Upsert
                const existingRoom = await prisma.room.findUnique({
                    where: {
                        floorId_roomNumber: {
                            floorId,
                            roomNumber,
                        },
                    },
                });
                if (existingRoom) {
                    await prisma.room.update({
                        where: { id: existingRoom.id },
                        data: {
                            capacity,
                            type: roomType,
                            feePerSemester,
                            amenities: amenities || existingRoom.amenities,
                        },
                    });
                    updatedRooms++;
                }
                else {
                    await prisma.room.create({
                        data: {
                            floorId,
                            roomNumber,
                            capacity,
                            occupiedBeds: 0,
                            type: roomType,
                            status: "AVAILABLE",
                            feePerSemester,
                            amenities,
                        },
                    });
                    createdRooms++;
                }
            }
            catch (err) {
                errors.push(`Row ${rowNum} (Room ${roomNumber}): ${err.message}`);
            }
        }
        roomCache.invalidate();
        dashboardCache.invalidate();
        await logAuditEvent({
            actorId,
            actorRole,
            action: "BULK_ROOM_IMPORT",
            entityType: "Hostel",
            details: {
                totalRows: rows.length,
                createdRooms,
                updatedRooms,
                errorCount: errors.length,
            },
        });
        return {
            processed: rows.length,
            createdRooms,
            updatedRooms,
            errors,
        };
    }
    // ============ DASHBOARD STATS ============
    async getDashboardStats(user) {
        const role = user?.role || "ADMIN";
        // 1. STUDENT DASHBOARD CONSOLIDATED STATS
        if (role === "STUDENT" && user?.userId) {
            const cacheKey = `dashboard:student:${user.userId}`;
            const cached = dashboardCache.get(cacheKey);
            if (cached)
                return cached;
            // Fetch overview + announcements in parallel
            const [overview, myAnnouncements] = await Promise.all([
                operationsService.getMyOverview(user.userId).catch(() => null),
                announcementService.getMyAnnouncements(user.userId).catch(() => []),
            ]);
            const profile = overview?.profile || null;
            const allocation = profile?.roomAllocations?.find((a) => a.status === "ACTIVE") ||
                profile?.roomAllocations?.[0] ||
                null;
            const fees = overview?.fees || [];
            const hostelFeePaid = fees.some((f) => f.type === "HOSTEL_FEE" && f.status === "PAID");
            const messFeePaid = fees.some((f) => f.type === "MESS_FEE" && f.status === "PAID");
            const leaves = overview?.leaves || [];
            const complaints = overview?.complaints || [];
            const result = {
                role: "STUDENT",
                overview,
                profile,
                allocation,
                fees,
                hostelFeePaid,
                messFeePaid,
                leaves,
                leavesCount: leaves.length,
                complaints,
                complaintsCount: complaints.length,
                announcements: myAnnouncements,
                recentAnnouncements: Array.isArray(myAnnouncements) ? myAnnouncements.slice(0, 4) : [],
                unreadAnnouncementsCount: Array.isArray(myAnnouncements) ? myAnnouncements.filter((a) => !a.isRead).length : 0,
            };
            dashboardCache.set(cacheKey, result, 15_000); // 15 seconds TTL
            return result;
        }
        // 2. ACCOUNTANT DASHBOARD CONSOLIDATED STATS
        if (role === "ACCOUNTANT") {
            const cacheKey = "dashboard:accountant";
            const cached = dashboardCache.get(cacheKey);
            if (cached)
                return cached;
            const [paidAgg, pendingAgg, hostelPaidAgg, messPaidAgg, recentTransactions] = await Promise.all([
                prisma.fee.aggregate({
                    where: { status: "PAID" },
                    _sum: { amount: true },
                    _count: true,
                }),
                prisma.fee.aggregate({
                    where: { status: "PENDING" },
                    _sum: { amount: true },
                    _count: true,
                }),
                prisma.fee.aggregate({
                    where: { type: "HOSTEL_FEE", status: "PAID" },
                    _sum: { amount: true },
                }),
                prisma.fee.aggregate({
                    where: { type: "MESS_FEE", status: "PAID" },
                    _sum: { amount: true },
                }),
                prisma.fee.findMany({
                    where: { status: "PAID" },
                    take: 6,
                    orderBy: { paidAt: "desc" },
                    include: {
                        student: {
                            include: {
                                user: { select: { firstName: true, lastName: true } },
                            },
                        },
                    },
                }),
            ]);
            const totalPaid = Number(paidAgg._sum.amount || 0);
            const totalPending = Number(pendingAgg._sum.amount || 0);
            const paidCount = paidAgg._count;
            const pendingCount = pendingAgg._count;
            const totalRecords = paidCount + pendingCount;
            const collectionRate = totalRecords > 0 ? Math.round((paidCount / totalRecords) * 100) : 0;
            const hostelFeePaid = Number(hostelPaidAgg._sum.amount || 0);
            const messFeePaid = Number(messPaidAgg._sum.amount || 0);
            const result = {
                role: "ACCOUNTANT",
                totalPaid,
                totalPending,
                paidCount,
                pendingCount,
                totalRecords,
                collectionRate,
                hostelFeePaid,
                messFeePaid,
                recentTransactions,
            };
            dashboardCache.set(cacheKey, result, 60_000); // 60 seconds TTL
            return result;
        }
        // 3. ADMIN / WARDEN / GENERAL DASHBOARD STATS
        const cacheKey = `dashboard:${role.toLowerCase()}${role === 'WARDEN' && user?.userId ? `:${user.userId}` : ''}`;
        const cached = dashboardCache.get(cacheKey);
        if (cached)
            return cached;
        const [totalStudents, totalHostels, rooms, pendingLeaves, openComplaints, pendingFees, recentAllocations, recentAnnouncements,] = await Promise.all([
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
            announcementService.listAnnouncements(user?.userId || "", role, { status: "PUBLISHED" }).catch(() => []),
        ]);
        const totalRooms = rooms.length;
        const totalBeds = rooms.reduce((sum, r) => sum + Number(r.capacity || 0), 0);
        const occupiedBeds = rooms.reduce((sum, r) => sum + Number(r.occupiedBeds || 0), 0);
        // Room status counts for pie chart
        const blockedRooms = rooms.filter((r) => r.status === "BLOCKED").length;
        const nonBlockedRooms = rooms.filter((r) => r.status !== "BLOCKED");
        const availableRooms = nonBlockedRooms.filter((r) => (r.occupiedBeds || 0) === 0).length;
        const partiallyOccupiedRooms = nonBlockedRooms.filter((r) => (r.occupiedBeds || 0) > 0 && (r.occupiedBeds || 0) < (r.capacity || 0)).length;
        const fullyOccupiedRooms = nonBlockedRooms.filter((r) => (r.occupiedBeds || 0) >= (r.capacity || 0)).length;
        const result = {
            role,
            totalStudents,
            totalHostels,
            totalRooms,
            totalBeds,
            occupiedBeds,
            availableRooms,
            partiallyOccupiedRooms,
            fullyOccupiedRooms,
            blockedRooms,
            pendingLeaves,
            openComplaints,
            pendingFees,
            recentAllocations,
            occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
            recentAnnouncements: Array.isArray(recentAnnouncements) ? recentAnnouncements.slice(0, 3) : [],
        };
        dashboardCache.set(cacheKey, result, 60_000); // 60 seconds TTL
        return result;
    }
}
export const hostelService = new HostelService();
//# sourceMappingURL=hostel.service.js.map