import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { Prisma } from "@prisma/client";

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

  async getRooms(filters?: {
    status?: string;
    type?: string;
    floorId?: string;
    hostelId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
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

  async getAvailableRooms(hostelId?: string, eligibility?: { year: number; gender: "MALE" | "FEMALE" | "OTHER" }) {
    const where: Prisma.RoomWhereInput = {
      isActive: true,
      status: { in: ["AVAILABLE", "PARTIALLY_OCCUPIED"] },
    };

    if (hostelId) {
      where.floor = {
        block: {
          hostelId,
        },
      };
    }
    if (eligibility) {
      // This project only models boys/girls hostels; OTHER is not assigned until an
      // administrator creates an explicitly supported workflow.
      if (eligibility.gender === "OTHER") return [];
      const type = eligibility.gender === "MALE" ? "BOYS" : "GIRLS";
      where.floor = {
        block: {
          hostel: { type, allowedYears: { has: eligibility.year } },
        },
      };
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
    return prisma.room.update({
      where: { id },
      data: updateData,
    });
  }

  // ============ DASHBOARD STATS ============

  async getDashboardStats() {
    const [
      totalStudents,
      totalHostels,
      totalRooms,
      occupiedRooms,
      availableRooms,
      pendingLeaves,
      openComplaints,
      pendingFees,
      recentAllocations,
    ] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.hostel.count({ where: { deletedAt: null, isActive: true } }),
      prisma.room.count({ where: { isActive: true } }),
      prisma.room.aggregate({ where: { isActive: true }, _sum: { occupiedBeds: true } }),
      prisma.room.count({
        where: { isActive: true, status: { in: ["AVAILABLE", "PARTIALLY_OCCUPIED"] } },
      }),
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

    return {
      totalStudents,
      totalHostels,
      totalRooms,
      availableRooms,
      pendingLeaves,
      openComplaints,
      pendingFees,
      recentAllocations,
      occupiedRooms: occupiedRooms._sum.occupiedBeds || 0,
      occupancyRate: totalRooms > 0 ? Math.round(((occupiedRooms._sum.occupiedBeds || 0) / totalRooms) * 100) : 0,
    };
  }
}

export const hostelService = new HostelService();
