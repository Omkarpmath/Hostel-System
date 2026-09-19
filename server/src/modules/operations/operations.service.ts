import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { roomCache, dashboardCache } from "../../config/cache.js";
import { ApiError } from "../../utils/ApiError.js";
import { notificationService } from "../notification/notification.service.js";
import { receiptService } from "../receipt/receipt.service.js";
import { saveUploadedFiles } from "../../utils/storage.js";
import { logAuditEvent } from "../../utils/audit.js";
import { generateCsv } from "../../utils/csv.js";

let lastMessReconciliationTime = 0;
const RECONCILIATION_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

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
  return {
    room: {
      select: {
        id: true,
        roomNumber: true,
        capacity: true,
        occupiedBeds: true,
        status: true,
        feePerSemester: true,
        floor: {
          select: {
            id: true,
            floorNumber: true,
            name: true,
            block: {
              select: {
                id: true,
                name: true,
                hostel: {
                  select: { id: true, name: true, type: true },
                },
              },
            },
          },
        },
      },
    },
  };
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

  private async getWardenIdsForStudent(studentId: string): Promise<string[]> {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        roomAllocations: {
          where: { status: "ACTIVE" },
          include: { room: { include: { floor: { include: { block: true } } } } },
        },
      },
    });

    const hostelId = student?.roomAllocations?.[0]?.room?.floor?.block?.hostelId;
    if (hostelId) {
      const hostel = await prisma.hostel.findUnique({
        where: { id: hostelId },
        select: { wardenId: true },
      });
      if (hostel?.wardenId) {
        return [hostel.wardenId];
      }
    }

    // If no specific hostel warden assigned, fallback to all active wardens
    const wardens = await prisma.user.findMany({
      where: { role: "WARDEN", isActive: true },
      select: { id: true },
    });
    return wardens.map((w) => w.id);
  }

  async getMyOverview(userId: string) {
    const studentId = await this.studentId(userId);
    const [profile, fees, leaves, complaints, visitors] = await Promise.all([
      prisma.studentProfile.findUniqueOrThrow({ where: { id: studentId }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } }, roomAllocations: { where: { status: "ACTIVE" }, include: roomInclude() } } }),
      prisma.fee.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } }),
      prisma.leaveRequest.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.complaint.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.visitor.findMany({ where: { studentId }, include: visitorStudentInclude, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
    return { profile, fees, leaves, complaints, visitors };
  }

  async listAllocations() {
    return prisma.roomAllocation.findMany({ where: { status: "ACTIVE" }, include: { ...studentInclude, ...roomInclude() }, orderBy: { createdAt: "desc" } });
  }

  async allocate(studentId: string, roomId: string, requestedBed?: number) {
    const result = await prisma.$transaction(async (tx) => {
      const [student, room, current] = await Promise.all([
        tx.studentProfile.findUnique({ where: { id: studentId } }),
        tx.room.findUnique({
          where: { id: roomId },
          include: {
            floor: {
              include: {
                block: {
                  include: {
                    hostel: {
                      select: { id: true, name: true, type: true, allowedYears: true, isActive: true },
                    },
                  },
                },
              },
            },
          },
        }),
        tx.roomAllocation.findFirst({ where: { studentId, status: "ACTIVE" } }),
      ]);
      if (!student) throw ApiError.notFound("Student not found");
      if (!room || !room.isActive) throw ApiError.notFound("Room not found");
      if (current) throw ApiError.conflict("This student already has an active room allocation");

      const hostel = room.floor?.block?.hostel;
      if (!hostel || hostel.isActive === false) throw ApiError.badRequest("Hostel is inactive or not found");

      // Strict gender segregation
      if (student.gender === "FEMALE" && hostel.type !== "GIRLS") {
        throw ApiError.badRequest("Female students cannot be allocated to a Boys hostel");
      }
      if (student.gender === "MALE" && hostel.type !== "BOYS") {
        throw ApiError.badRequest("Male students cannot be allocated to a Girls hostel");
      }

      // Academic year enforcement
      if (hostel.allowedYears && hostel.allowedYears.length > 0 && !hostel.allowedYears.includes(student.year)) {
        throw ApiError.badRequest(`This hostel is not open for Year ${student.year} students`);
      }
      if (["MAINTENANCE", "RESERVED", "BLOCKED"].includes(room.status)) {
        throw ApiError.badRequest(room.status === "BLOCKED" ? "This room is blocked by an administrator" : "This room is not available for allocation");
      }
      if (room.occupiedBeds >= room.capacity) throw ApiError.conflict("This room is already full");
      // Parallelize pending reservations check and active beds lookup
      const [pendingReservations, active] = await Promise.all([
        tx.reservation.count({ where: { roomId, status: "PENDING", expiresAt: { gt: new Date() } } }),
        tx.roomAllocation.findMany({ where: { roomId, status: "ACTIVE" }, select: { bedNumber: true } }),
      ]);

      if (room.occupiedBeds + pendingReservations >= room.capacity) {
        throw ApiError.conflict("The remaining bed is temporarily reserved by a student completing payment");
      }

      const bedNumber = requestedBed || Array.from({ length: room.capacity }, (_, i) => i + 1).find((n) => !active.some((a) => a.bedNumber === n));
      if (!bedNumber || active.some((a) => a.bedNumber === bedNumber) || bedNumber > room.capacity) {
        throw ApiError.conflict("Selected bed is not available");
      }

      const nextOccupied = room.occupiedBeds + 1;

      // Parallelize room allocation creation and room counter update
      const [allocation] = await Promise.all([
        tx.roomAllocation.create({
          data: { studentId, roomId, bedNumber, allocatedFrom: new Date() },
          include: { ...studentInclude, ...roomInclude() },
        }),
        tx.room.update({
          where: { id: roomId },
          data: {
            occupiedBeds: nextOccupied,
            status: nextOccupied >= room.capacity ? "FULL" : "PARTIALLY_OCCUPIED",
            version: { increment: 1 },
          },
        }),
      ]);

      // Parallelize existing fee lookups and mess config query
      const [existingHostelFee, existingMessFee, vegConfig, legacyConfig] = await Promise.all([
        tx.fee.findFirst({ where: { studentId, allocationId: allocation.id, type: "HOSTEL_FEE" } }),
        tx.fee.findFirst({ where: { studentId, type: "MESS_FEE" } }),
        tx.systemConfig.findUnique({ where: { key: "mess_fee_veg" } }),
        tx.systemConfig.findUnique({ where: { key: "annual_mess_fee" } }),
      ]);

      const feePromises: Promise<any>[] = [];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Generate PENDING Hostel Fee if not present
      if (!existingHostelFee) {
        feePromises.push(
          tx.fee.create({
            data: {
              studentId,
              allocationId: allocation.id,
              amount: room.feePerSemester,
              type: "HOSTEL_FEE",
              status: "PENDING",
              dueDate,
            },
          })
        );
      }

      // Generate PENDING Mess Fee if not present (defaults to Veg amount until student chooses at payment)
      if (!existingMessFee) {
        const messAmount = vegConfig
          ? parseFloat(vegConfig.value)
          : legacyConfig
          ? parseFloat(legacyConfig.value)
          : 73000;
        feePromises.push(
          tx.fee.create({
            data: {
              studentId,
              allocationId: allocation.id,
              amount: messAmount,
              type: "MESS_FEE",
              status: "PENDING",
              dueDate,
            },
          })
        );
      }

      if (feePromises.length > 0) {
        await Promise.all(feePromises);
      }

      return allocation;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    roomCache.invalidate();
    dashboardCache.invalidate();
    lastMessReconciliationTime = 0;

    await logAuditEvent({
      actorId: studentId,
      actorRole: "ADMIN",
      action: "BED_ALLOCATED",
      entityType: "RoomAllocation",
      entityId: result.id,
      details: {
        studentId,
        roomId,
        bedNumber: result.bedNumber,
      },
    });

    return result;
  }

  async vacate(allocationId: string, actorId: string, actorRole: any = "ADMIN") {
    const allocation = await prisma.roomAllocation.findUnique({
      where: { id: allocationId },
      include: {
        room: true,
        student: { include: { user: true } },
      },
    });

    if (!allocation) {
      throw ApiError.notFound("Allocation record not found");
    }
    if (allocation.status !== "ACTIVE") {
      throw ApiError.badRequest("This allocation is not active");
    }

    const roomId = allocation.roomId;
    const room = allocation.room;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark allocation as VACATED
      const updatedAllocation = await tx.roomAllocation.update({
        where: { id: allocationId },
        data: {
          status: "VACATED",
          allocatedTo: new Date(),
        },
      });

      // 2. Recalculate room occupancy
      const newOccupied = Math.max(0, room.occupiedBeds - 1);
      const newStatus =
        room.status === "BLOCKED"
          ? "BLOCKED"
          : room.status === "MAINTENANCE"
          ? "MAINTENANCE"
          : newOccupied >= room.capacity
          ? "FULL"
          : newOccupied > 0
          ? "PARTIALLY_OCCUPIED"
          : "AVAILABLE";

      await tx.room.update({
        where: { id: roomId },
        data: {
          occupiedBeds: newOccupied,
          status: newStatus,
          version: { increment: 1 },
        },
      });

      return updatedAllocation;
    });

    roomCache.invalidate();
    dashboardCache.invalidate();

    await logAuditEvent({
      actorId,
      actorRole,
      action: "BED_VACATED",
      entityType: "RoomAllocation",
      entityId: allocationId,
      details: {
        studentName: `${allocation.student.user.firstName} ${allocation.student.user.lastName}`,
        usn: allocation.student.usn,
        roomNumber: room.roomNumber,
        bedNumber: allocation.bedNumber,
      },
    });

    return result;
  }

  async academicRollover(actorId: string, actorRole: any = "ADMIN") {
    // 1. Find all active allocations for Year 4 students (Graduation Checkout)
    const year4Allocations = await prisma.roomAllocation.findMany({
      where: {
        status: "ACTIVE",
        student: {
          year: 4,
        },
      },
      include: {
        room: true,
      },
    });

    // 2. Perform checkout & promotion in a safe transaction
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      for (const alloc of year4Allocations) {
        await tx.roomAllocation.update({
          where: { id: alloc.id },
          data: {
            status: "VACATED",
            allocatedTo: now,
          },
        });

        const room = await tx.room.findUnique({ where: { id: alloc.roomId } });
        if (room) {
          const newOccupied = Math.max(0, room.occupiedBeds - 1);
          const newStatus =
            room.status === "BLOCKED"
              ? "BLOCKED"
              : room.status === "MAINTENANCE"
              ? "MAINTENANCE"
              : newOccupied >= room.capacity
              ? "FULL"
              : newOccupied > 0
              ? "PARTIALLY_OCCUPIED"
              : "AVAILABLE";

          await tx.room.update({
            where: { id: room.id },
            data: {
              occupiedBeds: newOccupied,
              status: newStatus,
              version: { increment: 1 },
            },
          });
        }
      }

      // Graduate Year 4 students
      await tx.studentProfile.updateMany({
        where: { year: 4 },
        data: { year: 5 },
      });

      // Promote remaining years in descending order to avoid collision:
      const p3 = await tx.studentProfile.updateMany({
        where: { year: 3 },
        data: { year: 4, semester: { increment: 2 } },
      });

      const p2 = await tx.studentProfile.updateMany({
        where: { year: 2 },
        data: { year: 3, semester: { increment: 2 } },
      });

      const p1 = await tx.studentProfile.updateMany({
        where: { year: 1 },
        data: { year: 2, semester: { increment: 2 } },
      });

      return {
        graduatedCount: year4Allocations.length,
        promotedCount: p1.count + p2.count + p3.count,
      };
    });

    roomCache.invalidate();
    dashboardCache.invalidate();

    await logAuditEvent({
      actorId,
      actorRole,
      action: "ACADEMIC_ROLLOVER",
      entityType: "AcademicYear",
      details: {
        graduatedStudentsCount: result.graduatedCount,
        promotedStudentsCount: result.promotedCount,
      },
    });

    return result;
  }

  async exportFeeDefaultersCsv(): Promise<string> {
    const pendingFees = await prisma.fee.findMany({
      where: { status: "PENDING" },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const headers = [
      { key: "studentName", label: "Student Name" },
      { key: "usn", label: "USN" },
      { key: "year", label: "Year" },
      { key: "department", label: "Department" },
      { key: "type", label: "Fee Type" },
      { key: "amount", label: "Pending Amount" },
      { key: "dueDate", label: "Due Date" },
      { key: "studentPhone", label: "Student Phone" },
      { key: "guardianPhone", label: "Guardian Phone" },
    ];

    const data = pendingFees.map((f) => ({
      studentName: `${f.student.user.firstName} ${f.student.user.lastName}`,
      usn: f.student.usn,
      year: `Year ${f.student.year}`,
      department: f.student.department,
      type: f.type,
      amount: f.amount.toString(),
      dueDate: f.dueDate ? new Date(f.dueDate).toLocaleDateString() : "N/A",
      studentPhone: f.student.user.phone || "N/A",
      guardianPhone: f.student.guardianPhone || "N/A",
    }));

    return generateCsv(headers, data);
  }

  async exportAttendanceShortageCsv(): Promise<string> {
    const totalSessions = await prisma.attendanceSession.count();
    const profiles = await prisma.studentProfile.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
        attendanceRecords: true,
      },
    });

    const headers = [
      { key: "studentName", label: "Student Name" },
      { key: "usn", label: "USN" },
      { key: "year", label: "Year" },
      { key: "department", label: "Department" },
      { key: "totalSessions", label: "Total Sessions" },
      { key: "presentSessions", label: "Present Sessions" },
      { key: "percentage", label: "Attendance %" },
      { key: "status", label: "Status" },
    ];

    const data = profiles
      .map((p) => {
        const total = totalSessions > 0 ? totalSessions : (p.attendanceRecords.length || 1);
        const present = p.attendanceRecords.length;
        const pct = total > 0 ? Math.min(100, Math.round((present / total) * 100)) : 100;
        return {
          studentName: `${p.user.firstName} ${p.user.lastName}`,
          usn: p.usn,
          year: `Year ${p.year}`,
          department: p.department,
          totalSessions: total,
          presentSessions: present,
          percentage: `${pct}%`,
          status: pct < 75 ? "SHORTAGE (<75%)" : "ADEQUATE",
          pctRaw: pct,
        };
      })
      .filter((p) => p.pctRaw < 75 || p.presentSessions === 0);

    return generateCsv(headers, data);
  }

  async exportMessHeadcountCsv(): Promise<string> {
    const dailyCounts = await prisma.messDailyCount.findMany({
      include: { mess: true },
      orderBy: { date: "desc" },
      take: 100,
    });

    const headers = [
      { key: "messName", label: "Mess Name" },
      { key: "date", label: "Date" },
      { key: "headcount", label: "Total Meals Served" },
    ];

    const data = dailyCounts.map((d) => ({
      messName: d.mess.name,
      date: new Date(d.date).toLocaleDateString(),
      headcount: d.count,
    }));

    return generateCsv(headers, data);
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
  async createLeave(userId: string, data: any) {
    const studentId = await this.studentId(userId);
    const leave = await prisma.leaveRequest.create({
      data: { studentId, ...data },
      include: studentInclude,
    });

    // Asynchronously notify assigned warden(s) (non-blocking)
    (async () => {
      try {
        const student = await prisma.studentProfile.findUnique({
          where: { id: studentId },
          include: {
            user: { select: { firstName: true, lastName: true } },
            roomAllocations: {
              where: { status: "ACTIVE" },
              include: { room: { include: { floor: { include: { block: { include: { hostel: true } } } } } } },
            },
          },
        });

        const studentName = `${student?.user?.firstName || "Student"} ${student?.user?.lastName || ""}`.trim();
        const fromStr = new Date(data.fromDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        const toStr = new Date(data.toDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        const leaveTypeStr = String(data.type || "LEAVE").replace(/_/g, " ");

        const wardenIds = await this.getWardenIdsForStudent(studentId);
        for (const wId of wardenIds) {
          await notificationService.createNotification({
            userId: wId,
            title: "New Leave Request",
            message: `${studentName} requested ${leaveTypeStr} from ${fromStr} to ${toStr}.`,
            type: "NEW_LEAVE_REQUEST",
            relatedId: leave.id,
            relatedType: "LEAVE",
          });
        }
      } catch (err) {
        console.error("[OperationsService] Error notifying on leave create:", err);
      }
    })();

    return leave;
  }

  async decideLeave(id: string, approverId: string, role: string, data: any) {
    const where: Prisma.LeaveRequestWhereInput = { id };
    if (role === "WARDEN") {
      where.student = this.wardenStudents(approverId);
    }

    const leave = await prisma.leaveRequest.findFirst({
      where,
      include: { student: { select: { userId: true } } },
    });
    if (!leave) throw ApiError.notFound("Leave request not found in your hostel scope");
    if (leave.status !== "PENDING") throw ApiError.conflict("Only pending leave requests can be decided");

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: data.status,
        rejectionReason: data.status === "REJECTED" ? data.rejectionReason : null,
        approvedBy: approverId,
        approvedAt: new Date(),
      },
      include: studentInclude,
    });

    // Asynchronously notify student (non-blocking)
    (async () => {
      try {
        const studentUserId = leave.student?.userId;
        if (studentUserId) {
          if (data.status === "APPROVED") {
            const fromStr = new Date(updated.fromDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
            const toStr = new Date(updated.toDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
            await notificationService.createNotification({
              userId: studentUserId,
              title: "Leave Request Approved",
              message: `Your leave request for ${fromStr} to ${toStr} has been approved.`,
              type: "LEAVE_APPROVED",
              relatedId: id,
              relatedType: "LEAVE",
            });
          } else if (data.status === "REJECTED") {
            const reason = data.rejectionReason ? `: ${data.rejectionReason}` : ".";
            await notificationService.createNotification({
              userId: studentUserId,
              title: "Leave Request Rejected",
              message: `Your leave request was rejected${reason}`,
              type: "LEAVE_REJECTED",
              relatedId: id,
              relatedType: "LEAVE",
            });
          }
        }
      } catch (err) {
        console.error("[OperationsService] Error notifying on leave decision:", err);
      }
    })();

    return updated;
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
    const savedImages = files && files.length > 0 ? await saveUploadedFiles(files) : [];

    const complaint = await prisma.$transaction(async (tx) => {
      const created = await tx.complaint.create({
        data: { studentId, title, description, category, priority },
        include: { ...studentInclude, images: true },
      });

      if (savedImages.length > 0) {
        await tx.complaintImage.createMany({
          data: savedImages.map((img) => ({
            complaintId: created.id,
            imageUrl: img.url,
          })),
        });
        // Re-fetch to include images
        return tx.complaint.findUnique({
          where: { id: created.id },
          include: { ...studentInclude, images: true },
        });
      }

      return created;
    });

    // Asynchronously notify assigned warden(s) (non-blocking)
    (async () => {
      try {
        const student = await prisma.studentProfile.findUnique({
          where: { id: studentId },
          include: {
            user: { select: { firstName: true, lastName: true } },
            roomAllocations: {
              where: { status: "ACTIVE" },
              include: { room: { include: { floor: { include: { block: { include: { hostel: true } } } } } } },
            },
          },
        });

        const studentName = `${student?.user?.firstName || "Student"} ${student?.user?.lastName || ""}`.trim();
        const roomNumber = student?.roomAllocations?.[0]?.room?.roomNumber;
        const roomText = roomNumber ? ` (Room ${roomNumber})` : "";
        const categoryStr = String(category || "GENERAL").toLowerCase();

        const wardenIds = await this.getWardenIdsForStudent(studentId);
        if (complaint) {
          for (const wId of wardenIds) {
            await notificationService.createNotification({
              userId: wId,
              title: "New Student Complaint",
              message: `${studentName}${roomText} lodged a ${categoryStr} complaint: "${title}".`,
              type: "NEW_COMPLAINT",
              relatedId: complaint.id,
              relatedType: "COMPLAINT",
            });
          }
        }
      } catch (err) {
        console.error("[OperationsService] Error notifying warden on complaint create:", err);
      }
    })();

    return complaint;
  }
  async updateComplaint(id: string, approverId: string, role: string, data: any) {
    const where: Prisma.ComplaintWhereInput = { id };
    if (role === "WARDEN") {
      where.student = this.wardenStudents(approverId);
    }

    const complaint = await prisma.complaint.findFirst({
      where,
      include: { student: { select: { userId: true } } },
    });
    if (!complaint) throw ApiError.notFound("Complaint not found in your hostel scope");

    const previousStatus = complaint.status;
    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        ...data,
        resolvedAt: ["RESOLVED", "CLOSED"].includes(data.status) ? new Date() : undefined,
      },
      include: { ...studentInclude, images: true },
    });

    // Asynchronously notify student if status changed (non-blocking)
    if (data.status && data.status !== previousStatus) {
      (async () => {
        try {
          const studentUserId = complaint.student?.userId;
          if (studentUserId) {
            if (["RESOLVED", "CLOSED"].includes(data.status)) {
              await notificationService.createNotification({
                userId: studentUserId,
                title: "Complaint Resolved",
                message: `Your complaint "${complaint.title}" has been marked as resolved.`,
                type: "COMPLAINT_RESOLVED",
                relatedId: id,
                relatedType: "COMPLAINT",
              });
            } else {
              const statusStr = String(data.status).replace(/_/g, " ").toLowerCase();
              await notificationService.createNotification({
                userId: studentUserId,
                title: "Complaint Status Updated",
                message: `Your complaint "${complaint.title}" is now ${statusStr}.`,
                type: "COMPLAINT_STATUS_UPDATED",
                relatedId: id,
                relatedType: "COMPLAINT",
              });
            }
          }
        } catch (err) {
          console.error("[OperationsService] Error notifying on complaint update:", err);
        }
      })();
    }

    return updated;
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

    const visitor = await prisma.visitor.create({
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

    // Asynchronously notify visiting student (non-blocking)
    (async () => {
      try {
        const student = await prisma.studentProfile.findUnique({
          where: { id: targetStudentId },
          select: { userId: true },
        });
        if (student?.userId) {
          const vName = data.visitorName?.trim() || "A visitor";
          const rel = data.relationship?.trim() ? ` (${data.relationship.trim()})` : "";
          await notificationService.createNotification({
            userId: student.userId,
            title: "Visitor Registered",
            message: `${vName}${rel} has been registered as a campus visitor for you.`,
            type: "VISITOR_REGISTERED",
            relatedId: visitor.id,
            relatedType: "VISITOR",
          });
        }
      } catch (err) {
        console.error("[OperationsService] Error notifying on visitor create:", err);
      }
    })();

    return visitor;
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
    // Throttled to run at most once every 15 minutes to eliminate table-scan overhead on frequent requests
    const now = Date.now();
    if (now - lastMessReconciliationTime > RECONCILIATION_INTERVAL_MS) {
      lastMessReconciliationTime = now;
      const [vegConfig, legacyConfig] = await Promise.all([
        prisma.systemConfig.findUnique({ where: { key: "mess_fee_veg" } }),
        prisma.systemConfig.findUnique({ where: { key: "annual_mess_fee" } }),
      ]);
      const messAmount = vegConfig
        ? parseFloat(vegConfig.value)
        : legacyConfig
        ? parseFloat(legacyConfig.value)
        : 73000;

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

  async approveOfflinePayment(
    feeId: string,
    approverUserId: string,
    approverRole: string,
    data: {
      paymentMethod: string;
      referenceNumber: string;
      bankName?: string;
      paidAt?: Date;
      remarks?: string;
    }
  ) {
    if (approverRole !== "ADMIN" && approverRole !== "ACCOUNTANT") {
      throw ApiError.forbidden("Only Administrators and Accountants can approve offline payments");
    }

    const result = await prisma.$transaction(async (tx) => {
      const fee = await tx.fee.findUnique({
        where: { id: feeId },
        include: {
          student: { include: { user: true } },
          allocation: { include: { room: { include: { floor: { include: { block: true } } } } } },
        },
      });

      if (!fee) throw ApiError.notFound("Fee record not found");
      if (fee.status === "PAID") throw ApiError.conflict("This fee has already been paid");

      // Generate sequential receipt number in format: REC-YYYY-XXXXXX
      const year = new Date().getFullYear();
      const count = await tx.fee.count({
        where: { receiptNumber: { startsWith: `REC-${year}-` } },
      });
      const seq = String(count + 1).padStart(6, "0");
      const receiptNumber = `REC-${year}-${seq}`;

      // Build transaction reference string including bank/branch if present
      let transactionId = data.referenceNumber.trim();
      if (data.bankName && data.bankName.trim()) {
        transactionId = `${transactionId} (${data.bankName.trim()})`;
      }
      if (data.remarks && data.remarks.trim()) {
        transactionId = `${transactionId} - ${data.remarks.trim()}`;
      }

      const updatedFee = await tx.fee.update({
        where: { id: feeId },
        data: {
          status: "PAID",
          paymentMethod: data.paymentMethod,
          transactionId,
          paidAt: data.paidAt || new Date(),
          receiptNumber,
        },
        include: {
          student: { include: { user: true } },
          allocation: { include: { room: { include: { floor: { include: { block: true } } } } } },
        },
      });

      return updatedFee;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // Non-blocking trigger: PDF generation & email delivery via Resend
    receiptService.processReceiptAndEmail(feeId, result.transactionId || "").catch((err) => {
      console.error("[OperationsService] Failed to send receipt email for offline payment:", err);
    });

    dashboardCache.invalidate();
    return result;
  }
}
export const operationsService = new OperationsService();
