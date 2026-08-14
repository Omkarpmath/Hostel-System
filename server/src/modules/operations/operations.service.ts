import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";

const studentInclude = { student: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } } } as const;

function roomInclude() {
  return { room: { include: { floor: { include: { block: { include: { hostel: { select: { id: true, name: true, type: true } } } } } } } } };
}

export class OperationsService {
  private wardenStudents(wardenId: string): Prisma.StudentProfileWhereInput {
    return { roomAllocations: { some: { status: "ACTIVE", room: { floor: { block: { hostel: { wardenId } } } } } } };
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
      prisma.visitor.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } }),
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
      const active = await tx.roomAllocation.findMany({ where: { roomId, status: "ACTIVE" }, select: { bedNumber: true } });
      const bedNumber = requestedBed || Array.from({ length: room.capacity }, (_, i) => i + 1).find((n) => !active.some((a) => a.bedNumber === n));
      if (!bedNumber || active.some((a) => a.bedNumber === bedNumber) || bedNumber > room.capacity) throw ApiError.conflict("Selected bed is not available");
      const nextOccupied = room.occupiedBeds + 1;
      const allocation = await tx.roomAllocation.create({ data: { studentId, roomId, bedNumber, allocatedFrom: new Date() }, include: { ...studentInclude, ...roomInclude() } });
      await tx.room.update({ where: { id: roomId }, data: { occupiedBeds: nextOccupied, status: nextOccupied >= room.capacity ? "FULL" : "PARTIALLY_OCCUPIED", version: { increment: 1 } } });
      return allocation;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async listLeaves(userId: string, role: string) {
    const where = role === "STUDENT" ? { studentId: await this.studentId(userId) } : role === "WARDEN" ? { student: this.wardenStudents(userId) } : {};
    return prisma.leaveRequest.findMany({ where, include: studentInclude, orderBy: { createdAt: "desc" } });
  }
  async createLeave(userId: string, data: any) { return prisma.leaveRequest.create({ data: { studentId: await this.studentId(userId), ...data }, include: studentInclude }); }
  async decideLeave(id: string, approverId: string, data: any) {
    const leave = await prisma.leaveRequest.findFirst({ where: { id, student: this.wardenStudents(approverId) }, select: { status: true } });
    if (!leave) throw ApiError.notFound("Leave request not found in your hostel scope");
    if (leave.status !== "PENDING") throw ApiError.conflict("Only pending leave requests can be decided");
    return prisma.leaveRequest.update({ where: { id }, data: { status: data.status, rejectionReason: data.status === "REJECTED" ? data.rejectionReason : null, approvedBy: approverId, approvedAt: new Date() }, include: studentInclude });
  }

  async listComplaints(userId: string, role: string) {
    const where = role === "STUDENT" ? { studentId: await this.studentId(userId) } : role === "WARDEN" ? { student: this.wardenStudents(userId) } : {};
    return prisma.complaint.findMany({ where, include: { ...studentInclude, images: true }, orderBy: { createdAt: "desc" } });
  }
  async createComplaint(userId: string, data: any) { return prisma.complaint.create({ data: { studentId: await this.studentId(userId), ...data }, include: studentInclude }); }
  async updateComplaint(id: string, wardenId: string, data: any) {
    const complaint = await prisma.complaint.findFirst({ where: { id, student: this.wardenStudents(wardenId) }, select: { id: true } });
    if (!complaint) throw ApiError.notFound("Complaint not found in your hostel scope");
    return prisma.complaint.update({ where: { id }, data: { ...data, resolvedAt: ["RESOLVED", "CLOSED"].includes(data.status) ? new Date() : undefined }, include: studentInclude });
  }

  async listVisitors(userId: string, role: string) {
    const where = role === "STUDENT" ? { studentId: await this.studentId(userId) } : role === "WARDEN" ? { student: this.wardenStudents(userId) } : {};
    return prisma.visitor.findMany({ where, include: studentInclude, orderBy: { createdAt: "desc" } });
  }
  async createVisitor(userId: string, data: any) { return prisma.visitor.create({ data: { studentId: await this.studentId(userId), ...data }, include: studentInclude }); }
  async listFees(userId: string, role: string) {
    const where = role === "STUDENT" ? { studentId: await this.studentId(userId) } : {};
    return prisma.fee.findMany({ where, include: { ...studentInclude, allocation: { include: roomInclude() } }, orderBy: { createdAt: "desc" } });
  }
}
export const operationsService = new OperationsService();
