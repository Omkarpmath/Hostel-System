import { prisma } from "../../config/db.js";
import { roomCache, dashboardCache } from "../../config/cache.js";
import { ApiError } from "../../utils/ApiError.js";
import { Prisma } from "@prisma/client";
import { operationsService } from "../operations/operations.service.js";
import { announcementService } from "../announcement/announcement.service.js";

export class HostelService {
  // ============ HOSTEL ============

  async createHostel(data: {
    name: string;
    type: "BOYS" | "GIRLS";
    address?: string;
    description?: string;
    wardenId?: string;
    allowedYears: number[];
  }) {
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

  async getHostels(filters?: { type?: string; isActive?: boolean }) {
    const where: Prisma.HostelWhereInput = {
      deletedAt: null,
    };
    if (filters?.type) where.type = filters.type as any;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

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

  async getHostelById(id: string) {
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

    if (!hostel) throw ApiError.notFound("Hostel not found");
    return hostel;
  }

  async updateHostel(id: string, data: Partial<{
    name: string;
    type: "BOYS" | "GIRLS";
    address: string;
    description: string;
    wardenId: string | null;
    isActive: boolean;
    allowedYears: number[];
  }>) {
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

  async deleteHostel(id: string) {
    return prisma.hostel.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ============ BLOCK ============

  async createBlock(hostelId: string, data: { name: string; description?: string }) {
    const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });
    if (!hostel) throw ApiError.notFound("Hostel not found");

    return prisma.block.create({
      data: {
        hostelId,
        name: data.name,
        description: data.description,
      },
    });
  }

  async getBlocks(hostelId: string) {
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

  async createFloor(blockId: string, data: { floorNumber: number; name: string }) {
    const block = await prisma.block.findUnique({ where: { id: blockId } });
    if (!block) throw ApiError.notFound("Block not found");

    return prisma.floor.create({
      data: {
        blockId,
        floorNumber: data.floorNumber,
        name: data.name,
      },
      include: { rooms: true },
    });
  }

  async getFloors(blockId: string) {
    return prisma.floor.findMany({
      where: { blockId },
      include: { rooms: true },
      orderBy: { floorNumber: "asc" },
    });
  }

  // ============ ROOM ============

  async createRoom(floorId: string, data: {
    roomNumber: string;
    capacity: number;
    type: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY";
    feePerSemester: number;
    amenities?: string[];
  }) {
    const floor = await prisma.floor.findUnique({ where: { id: floorId } });
    if (!floor) throw ApiError.notFound("Floor not found");

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

  async getRooms(
    filters?: {
      status?: string;
      type?: string;
      floorId?: string;
      hostelId?: string;
      page?: number;
      limit?: number;
      search?: string;
    },
    userRole?: string
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomWhereInput = { isActive: true };
    if (filters?.status) where.status = filters.status as any;
    if (filters?.type) where.type = filters.type as any;
    if (filters?.floorId) where.floorId = filters.floorId;
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

    const isStaff = userRole === "ADMIN" || userRole === "WARDEN";

    // Privacy & UX guard: If viewed by student, sanitize blocked rooms to look exactly like standard occupied rooms
    const rooms = rawRooms.map((room) => {
      if (isStaff) {
        return room;
      }
      if (room.status === "BLOCKED") {
        return {
          ...room,
          status: "OCCUPIED" as any,
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

  async getAvailableRooms(hostelId?: string, eligibility?: { year: number; gender: "MALE" | "FEMALE" | "OTHER" }) {
    const cacheKey = `avail_rooms:${hostelId || "all"}:${eligibility ? `${eligibility.gender}_${eligibility.year}` : "all"}`;
    const cached = roomCache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Prisma.RoomWhereInput = {
      isActive: true,
      status: { notIn: ["BLOCKED", "MAINTENANCE"] },
    };

    // Build a single combined block filter so hostelId and eligibility
    // are AND-ed together, not one overwriting the other.
    const blockFilter: Prisma.BlockWhereInput = {};
    const hostelFilter: Prisma.HostelWhereInput = {};

    if (hostelId) {
      blockFilter.hostelId = hostelId;
    }

    if (eligibility) {
      if (eligibility.gender === "OTHER") return [];
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

  async getRoomById(id: string) {
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

    if (!room) throw ApiError.notFound("Room not found");
    return room;
  }

  async updateRoom(id: string, data: Partial<{
    roomNumber: string;
    capacity: number;
    type: string;
    feePerSemester: number;
    amenities: string[];
    status: string;
    isActive: boolean;
  }>) {
    const room = await prisma.room.findUnique({ where: { id }, select: { occupiedBeds: true } });
    if (!room) throw ApiError.notFound("Room not found");
    if (data.capacity !== undefined && data.capacity < room.occupiedBeds) {
      throw ApiError.badRequest("Room capacity cannot be lower than the number of occupied beds");
    }
    const updateData: any = { ...data };
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

  async blockRoom(id: string, adminUserId: string, reason?: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        allocations: { where: { status: "ACTIVE" } },
        reservations: { where: { status: "PENDING", expiresAt: { gt: new Date() } } },
      },
    });
    if (!room) throw ApiError.notFound("Room not found");
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
    return updated;
  }

  async unblockRoom(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
    });
    if (!room) throw ApiError.notFound("Room not found");
    if (room.status !== "BLOCKED") {
      throw ApiError.badRequest("Room is not blocked");
    }

    const newStatus =
      room.occupiedBeds >= room.capacity
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
    return updated;
  }

  // ============ DASHBOARD STATS ============

  async getDashboardStats(user?: { userId: string; role: string }) {
    const role = user?.role || "ADMIN";

    // 1. STUDENT DASHBOARD CONSOLIDATED STATS
    if (role === "STUDENT" && user?.userId) {
      const cacheKey = `dashboard:student:${user.userId}`;
      const cached = dashboardCache.get<any>(cacheKey);
      if (cached) return cached;

      // Fetch overview + announcements in parallel
      const [overview, myAnnouncements] = await Promise.all([
        operationsService.getMyOverview(user.userId).catch(() => null),
        announcementService.getMyAnnouncements(user.userId).catch(() => []),
      ]);

      const profile = overview?.profile || null;
      const allocation =
        profile?.roomAllocations?.find((a: any) => a.status === "ACTIVE") ||
        profile?.roomAllocations?.[0] ||
        null;
      const fees = overview?.fees || [];
      const hostelFeePaid = fees.some((f: any) => f.type === "HOSTEL_FEE" && f.status === "PAID");
      const messFeePaid = fees.some((f: any) => f.type === "MESS_FEE" && f.status === "PAID");
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
        unreadAnnouncementsCount: Array.isArray(myAnnouncements) ? myAnnouncements.filter((a: any) => !a.isRead).length : 0,
      };

      dashboardCache.set(cacheKey, result, 15_000); // 15 seconds TTL
      return result;
    }

    // 2. ACCOUNTANT DASHBOARD CONSOLIDATED STATS
    if (role === "ACCOUNTANT") {
      const cacheKey = "dashboard:accountant";
      const cached = dashboardCache.get<any>(cacheKey);
      if (cached) return cached;

      const [fees, recentTransactions] = await Promise.all([
        prisma.fee.findMany({
          select: { amount: true, status: true, type: true },
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

      const totalPaid = fees
        .filter((f) => f.status === "PAID")
        .reduce((sum, f) => sum + Number(f.amount || 0), 0);
      const totalPending = fees
        .filter((f) => f.status === "PENDING")
        .reduce((sum, f) => sum + Number(f.amount || 0), 0);
      const paidCount = fees.filter((f) => f.status === "PAID").length;
      const pendingCount = fees.filter((f) => f.status === "PENDING").length;
      const totalRecords = fees.length;
      const collectionRate = totalRecords > 0 ? Math.round((paidCount / totalRecords) * 100) : 0;
      const hostelFeePaid = fees
        .filter((f) => f.type === "HOSTEL_FEE" && f.status === "PAID")
        .reduce((sum, f) => sum + Number(f.amount || 0), 0);
      const messFeePaid = fees
        .filter((f) => f.type === "MESS_FEE" && f.status === "PAID")
        .reduce((sum, f) => sum + Number(f.amount || 0), 0);

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

      dashboardCache.set(cacheKey, result, 15_000); // 15 seconds TTL
      return result;
    }

    // 3. ADMIN / WARDEN / GENERAL DASHBOARD STATS
    const cacheKey = `dashboard:${role.toLowerCase()}${role === 'WARDEN' && user?.userId ? `:${user.userId}` : ''}`;
    const cached = dashboardCache.get<any>(cacheKey);
    if (cached) return cached;

    const [
      totalStudents,
      totalHostels,
      rooms,
      pendingLeaves,
      openComplaints,
      pendingFees,
      recentAllocations,
      recentAnnouncements,
    ] = await Promise.all([
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
    const totalBeds = rooms.reduce((sum: number, r: any) => sum + Number(r.capacity || 0), 0);
    const occupiedBeds = rooms.reduce((sum: number, r: any) => sum + Number(r.occupiedBeds || 0), 0);

    // Room status counts for pie chart
    const blockedRooms = rooms.filter((r: any) => r.status === "BLOCKED").length;
    const nonBlockedRooms = rooms.filter((r: any) => r.status !== "BLOCKED");
    const availableRooms = nonBlockedRooms.filter((r: any) => (r.occupiedBeds || 0) === 0).length;
    const partiallyOccupiedRooms = nonBlockedRooms.filter((r: any) => (r.occupiedBeds || 0) > 0 && (r.occupiedBeds || 0) < (r.capacity || 0)).length;
    const fullyOccupiedRooms = nonBlockedRooms.filter((r: any) => (r.occupiedBeds || 0) >= (r.capacity || 0)).length;

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

    dashboardCache.set(cacheKey, result, 15_000); // 15 seconds TTL
    return result;
  }
}

export const hostelService = new HostelService();
