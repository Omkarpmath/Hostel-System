import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";

const studentInclude = {
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
      roomAllocations: {
        where: { status: "ACTIVE" as const },
        take: 1,
        include: {
          room: {
            include: {
              floor: {
                include: {
                  block: {
                    include: {
                      hostel: {
                        select: { id: true, name: true, type: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

function roomInclude() {
  return { room: { include: { floor: { include: { block: { include: { hostel: { select: { id: true, name: true, type: true } } } } } } } } };
}

const visitorStudentInclude = {
  student: {
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
      roomAllocations: {
        where: { status: "ACTIVE" as const },
        take: 1,
        include: {
          room: {
            include: {
              floor: {
                include: {
                  block: {
                    include: {
                      hostel: {
                        select: { id: true, name: true, type: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  approver: {
    select: { id: true, firstName: true, lastName: true, role: true },
  },
};

export class OperationsService {
  private wardenStudents(wardenId: string, specificHostelId?: string): Prisma.StudentProfileWhereInput {
    const hostelCondition = specificHostelId
      ? { id: specificHostelId, OR: [{ wardenId }, { warden: { id: wardenId } }] }
      : { OR: [{ wardenId }, { warden: { id: wardenId } }] };
    return {
      roomAllocations: {
        some: {
          status: "ACTIVE",
          room: {
            floor: {
              block: {
                hostel: hostelCondition,
              },
            },
          },
        },
      },
    };
  }
  private async studentId(userId: string) {
    const student = await prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw ApiError.notFound("Student profile has not been created yet");
    return student.id;
  }

  async getMyOverview(userId: string) {
    const studentId = await this.studentId(userId);
    const [profile, fees, leaves, complaints, visitors] = await Promise.all([
      prisma.studentProfile.findUniqueOrThrow({ where: { id: studentId }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } }, roomAllocations: { where: { status: "ACTIVE" }, include: roomInclude() } } }),
      prisma.fee.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } }),
      prisma.leaveRequest.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } }),
      prisma.complaint.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } }),
      prisma.visitor.findMany({ where: { studentId }, include: visitorStudentInclude, orderBy: { createdAt: "desc" } }),
    ]);
    return { profile, fees, leaves, complaints, visitors };
  }

  async listAllocations() {
    return prisma.roomAllocation.findMany({ where: { status: "ACTIVE" }, include: { ...studentInclude, ...roomInclude() }, orderBy: { createdAt: "desc" } });
  }

  async allocate(studentId: string, roomId: string, requestedBed?: number) {
    return prisma.$transaction(async (tx) => {
      const [student, room, current] = await Promise.all([
        tx.studentProfile.findUnique({ where: { id: studentId } }),
        tx.room.findUnique({ where: { id: roomId } }),
        tx.roomAllocation.findFirst({ where: { studentId, status: "ACTIVE" } }),
      ]);
      if (!student) throw ApiError.notFound("Student not found");
      if (!room || !room.isActive) throw ApiError.notFound("Room not found");
      if (current) throw ApiError.conflict("This student already has an active room allocation");
      if (["MAINTENANCE", "RESERVED"].includes(room.status)) throw ApiError.badRequest("This room is not available for allocation");
      if (room.occupiedBeds >= room.capacity) throw ApiError.conflict("This room is already full");
      const pendingReservations = await tx.reservation.count({ where: { roomId, status: "PENDING", expiresAt: { gt: new Date() } } });
      if (room.occupiedBeds + pendingReservations >= room.capacity) throw ApiError.conflict("The remaining bed is temporarily reserved by a student completing payment");
      const active = await tx.roomAllocation.findMany({ where: { roomId, status: "ACTIVE" }, select: { bedNumber: true } });
      const bedNumber = requestedBed || Array.from({ length: room.capacity }, (_, i) => i + 1).find((n) => !active.some((a) => a.bedNumber === n));
      if (!bedNumber || active.some((a) => a.bedNumber === bedNumber) || bedNumber > room.capacity) throw ApiError.conflict("Selected bed is not available");
      const nextOccupied = room.occupiedBeds + 1;
      const allocation = await tx.roomAllocation.create({ data: { studentId, roomId, bedNumber, allocatedFrom: new Date() }, include: { ...studentInclude, ...roomInclude() } });
      await tx.room.update({ where: { id: roomId }, data: { occupiedBeds: nextOccupied, status: nextOccupied >= room.capacity ? "FULL" : "PARTIALLY_OCCUPIED", version: { increment: 1 } } });

      // Generate PENDING Hostel Fee if not present
      const existingHostelFee = await tx.fee.findFirst({ where: { studentId, allocationId: allocation.id, type: "HOSTEL_FEE" } });
      if (!existingHostelFee) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        await tx.fee.create({
          data: {
            studentId,
            allocationId: allocation.id,
            amount: room.feePerSemester,
            type: "HOSTEL_FEE",
            status: "PENDING",
            dueDate,
          },
        });
      }

      // Generate PENDING Mess Fee if not present
      const existingMessFee = await tx.fee.findFirst({ where: { studentId, type: "MESS_FEE" } });
      if (!existingMessFee) {
        const messConfig = await tx.systemConfig.findUnique({ where: { key: "annual_mess_fee" } });
        const messAmount = messConfig ? parseFloat(messConfig.value) : 78000;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        await tx.fee.create({
          data: {
            studentId,
            allocationId: allocation.id,
            amount: messAmount,
            type: "MESS_FEE",
            status: "PENDING",
            dueDate,
          },
        });
      }

      return allocation;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async listLeaves(userId: string, role: string, filters?: { hostelId?: string }) {
    let where: Prisma.LeaveRequestWhereInput = {};
    const selectedHostelId = filters?.hostelId && filters.hostelId !== "ALL" ? filters.hostelId : undefined;

    if (role === "STUDENT") {
      where = { studentId: await this.studentId(userId) };
    } else if (role === "WARDEN") {
      where = { student: this.wardenStudents(userId, selectedHostelId) };
    } else {
      // ADMIN / ACCOUNTANT
      if (selectedHostelId) {
        where = {
          student: {
            roomAllocations: {
              some: {
                status: "ACTIVE",
                room: {
                  floor: {
                    block: {
                      hostelId: selectedHostelId,
                    },
                  },
                },
              },
            },
          },
        };
      }
    }
    return prisma.leaveRequest.findMany({ where, include: studentInclude, orderBy: { createdAt: "desc" } });
  }
  async createLeave(userId: string, data: any) { return prisma.leaveRequest.create({ data: { studentId: await this.studentId(userId), ...data }, include: studentInclude }); }
  async decideLeave(id: string, approverId: string, data: any) {
    const leave = await prisma.leaveRequest.findFirst({ where: { id, student: this.wardenStudents(approverId) }, select: { status: true } });
    if (!leave) throw ApiError.notFound("Leave request not found in your hostel scope");
    if (leave.status !== "PENDING") throw ApiError.conflict("Only pending leave requests can be decided");
    return prisma.leaveRequest.update({ where: { id }, data: { status: data.status, rejectionReason: data.status === "REJECTED" ? data.rejectionReason : null, approvedBy: approverId, approvedAt: new Date() }, include: studentInclude });
  }

  async listComplaints(userId: string, role: string, filters?: { hostelId?: string }) {
    let where: Prisma.ComplaintWhereInput = {};
    const selectedHostelId = filters?.hostelId && filters.hostelId !== "ALL" ? filters.hostelId : undefined;

    if (role === "STUDENT") {
      where = { studentId: await this.studentId(userId) };
    } else if (role === "WARDEN") {
      where = { student: this.wardenStudents(userId, selectedHostelId) };
    } else {
      // ADMIN / ACCOUNTANT
      if (selectedHostelId) {
        where = {
          student: {
            roomAllocations: {
              some: {
                status: "ACTIVE",
                room: {
                  floor: {
                    block: {
                      hostelId: selectedHostelId,
                    },
                  },
                },
              },
            },
          },
        };
      }
    }
    return prisma.complaint.findMany({ where, include: { ...studentInclude, images: true }, orderBy: { createdAt: "desc" } });
  }
  async createComplaint(userId: string, data: any, files?: Express.Multer.File[]) {
    const studentId = await this.studentId(userId);
    const { title, description, category, priority } = data;

    return prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.create({
        data: { studentId, title, description, category, priority },
        include: { ...studentInclude, images: true },
      });

      if (files && files.length > 0) {
        await tx.complaintImage.createMany({
          data: files.map((f) => ({
            complaintId: complaint.id,
            imageUrl: `data:${f.mimetype};base64,${f.buffer.toString("base64")}`,
          })),
        });
        // Re-fetch to include images
        return tx.complaint.findUnique({
          where: { id: complaint.id },
          include: { ...studentInclude, images: true },
        });
      }

      return complaint;
    });
  }
  async updateComplaint(id: string, wardenId: string, data: any) {
    const complaint = await prisma.complaint.findFirst({ where: { id, student: this.wardenStudents(wardenId) }, select: { id: true } });
    if (!complaint) throw ApiError.notFound("Complaint not found in your hostel scope");
    return prisma.complaint.update({ where: { id }, data: { ...data, resolvedAt: ["RESOLVED", "CLOSED"].includes(data.status) ? new Date() : undefined }, include: { ...studentInclude, images: true } });
  }

  async listVisitors(userId: string, role: string, filters?: { hostelId?: string; date?: string }) {
    const where: Prisma.VisitorWhereInput = {};

    // 1. Role-based scoping
    if (role === "SECURITY") {
      const security = await prisma.user.findUnique({
        where: { id: userId },
        select: { assignedHostelId: true },
      });
      if (!security?.assignedHostelId) return [];
      where.student = {
        roomAllocations: {
          some: {
            status: "ACTIVE",
            room: { floor: { block: { hostelId: security.assignedHostelId } } },
          },
        },
      };
    } else if (role === "WARDEN") {
      const warden = await prisma.user.findUnique({
        where: { id: userId },
        include: { wardenHostels: { where: { deletedAt: null }, select: { id: true } } },
      });
      const assignedIds = warden?.wardenHostels.map((h) => h.id) || [];
      if (assignedIds.length === 0) return [];

      let targetHostelFilter: Prisma.StringFilter | string = { in: assignedIds };
      if (filters?.hostelId && filters.hostelId !== "ALL") {
        if (!assignedIds.includes(filters.hostelId)) {
          throw ApiError.forbidden("You do not have access to visitors for this hostel");
        }
        targetHostelFilter = filters.hostelId;
      }

      where.student = {
        roomAllocations: {
          some: {
            status: "ACTIVE",
            room: { floor: { block: { hostelId: targetHostelFilter } } },
          },
        },
      };
    } else if (role === "ADMIN") {
      if (filters?.hostelId && filters.hostelId !== "ALL") {
        where.student = {
          roomAllocations: {
            some: {
              status: "ACTIVE",
              room: { floor: { block: { hostelId: filters.hostelId } } },
            },
          },
        };
      }
    } else if (role === "STUDENT") {
      where.studentId = await this.studentId(userId);
    }

    // 2. Date filtering
    if (filters?.date) {
      const dayStart = new Date(`${filters.date}T00:00:00.000Z`);
      const dayEnd = new Date(`${filters.date}T23:59:59.999Z`);
      where.createdAt = {
        gte: dayStart,
        lte: dayEnd,
      };
    }

    return prisma.visitor.findMany({
      where,
      include: visitorStudentInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async createVisitor(userId: string, role: string, data: any) {
    let targetStudentId = data.studentId;

    if (role === "STUDENT") {
      targetStudentId = await this.studentId(userId);
    } else {
      if (!targetStudentId) {
        throw ApiError.badRequest("Please select a visiting student");
      }

      // If security, verify student belongs to security's assigned hostel
      if (role === "SECURITY") {
        const security = await prisma.user.findUnique({
          where: { id: userId },
          select: { assignedHostelId: true },
        });
        if (!security?.assignedHostelId) {
          throw ApiError.forbidden("You are not assigned to any hostel.");
        }

        const student = await prisma.studentProfile.findUnique({
          where: { id: targetStudentId },
          include: {
            roomAllocations: {
              where: { status: "ACTIVE" },
              include: { room: { include: { floor: { include: { block: true } } } } },
            },
          },
        });
        if (!student) throw ApiError.notFound("Student not found");

        const studentHostelId = student.roomAllocations[0]?.room?.floor?.block?.hostelId;
        if (studentHostelId !== security.assignedHostelId) {
          throw ApiError.forbidden("This student does not belong to your assigned hostel.");
        }
      }
    }

    return prisma.visitor.create({
      data: {
        studentId: targetStudentId,
        visitorName: data.visitorName?.trim() || "Visitor",
        visitorPhone: data.visitorPhone?.trim() || "—",
        relationship: data.relationship?.trim() || "Other",
        purpose: data.purpose?.trim() || "Campus Visit",
        approvedBy: userId,
        checkInTime: new Date(),
        status: "CHECKED_IN",
      },
      include: visitorStudentInclude,
    });
  }

  async listHostelStudents(userId: string, role: string, queryHostelId?: string) {
    let targetHostelId = queryHostelId;

    if (role === "SECURITY") {
      const security = await prisma.user.findUnique({
        where: { id: userId },
        select: { assignedHostelId: true },
      });
      if (!security?.assignedHostelId) return [];
      targetHostelId = security.assignedHostelId;
    } else if (role === "WARDEN") {
      const warden = await prisma.user.findUnique({
        where: { id: userId },
        include: { wardenHostels: { where: { deletedAt: null }, select: { id: true } } },
      });
      const assignedIds = warden?.wardenHostels.map((h) => h.id) || [];
      if (assignedIds.length === 0) return [];
      if (targetHostelId && !assignedIds.includes(targetHostelId)) {
        throw ApiError.forbidden("You do not have access to this hostel");
      }
      if (!targetHostelId) {
        targetHostelId = assignedIds[0];
      }
    }

    const where: Prisma.StudentProfileWhereInput = {};
    if (targetHostelId && targetHostelId !== "ALL") {
      where.roomAllocations = {
        some: {
          status: "ACTIVE",
          room: { floor: { block: { hostelId: targetHostelId } } },
        },
      };
    } else {
      where.roomAllocations = {
        some: { status: "ACTIVE" },
      };
    }

    return prisma.studentProfile.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        roomAllocations: {
          where: { status: "ACTIVE" },
          take: 1,
          include: {
            room: {
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
              },
            },
          },
        },
      },
      orderBy: { user: { firstName: "asc" } },
    });
  }

  async listFees(userId: string, role: string, filters?: { hostelId?: string }) {
    // Reconcile: Ensure all students with active room allocations have a MESS_FEE invoice if none exists yet
    const config = await prisma.systemConfig.findUnique({ where: { key: "annual_mess_fee" } });
    const messAmount = config ? parseFloat(config.value) : 78000;

    const allocationsWithoutMess = await prisma.roomAllocation.findMany({
      where: {
        status: "ACTIVE",
        student: {
          fees: {
            none: { type: "MESS_FEE" },
          },
        },
      },
      select: {
        id: true,
        studentId: true,
      },
    });

    if (allocationsWithoutMess.length > 0) {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      await prisma.fee.createMany({
        data: allocationsWithoutMess.map((a) => ({
          studentId: a.studentId,
          allocationId: a.id,
          amount: messAmount,
          type: "MESS_FEE",
          status: "PENDING",
          dueDate: defaultDueDate,
        })),
        skipDuplicates: true,
      });
    }

    let where: Prisma.FeeWhereInput = {};
    const selectedHostelId = filters?.hostelId && filters.hostelId !== "ALL" ? filters.hostelId : undefined;

    if (role === "STUDENT") {
      where = { studentId: await this.studentId(userId) };
    } else if (role === "WARDEN") {
      const hostelCondition = selectedHostelId
        ? { id: selectedHostelId, OR: [{ wardenId: userId }, { warden: { id: userId } }] }
        : { OR: [{ wardenId: userId }, { warden: { id: userId } }] };

      where = {
        OR: [
          {
            allocation: {
              room: {
                floor: {
                  block: {
                    hostel: hostelCondition,
                  },
                },
              },
            },
          },
          {
            student: {
              roomAllocations: {
                some: {
                  status: "ACTIVE",
                  room: {
                    floor: {
                      block: {
                        hostel: hostelCondition,
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      };
    } else {
      // ADMIN / ACCOUNTANT
      if (selectedHostelId) {
        where = {
          OR: [
            {
              allocation: {
                room: {
                  floor: {
                    block: {
                      hostelId: selectedHostelId,
                    },
                  },
                },
              },
            },
            {
              student: {
                roomAllocations: {
                  some: {
                    status: "ACTIVE",
                    room: {
                      floor: {
                        block: {
                          hostelId: selectedHostelId,
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        };
      }
    }

    return prisma.fee.findMany({
      where,
      include: { ...studentInclude, allocation: { include: roomInclude() } },
      orderBy: { createdAt: "desc" },
    });
  }
}
export const operationsService = new OperationsService();
