import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { notificationService } from "../notification/notification.service.js";
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
                where: { status: "ACTIVE" },
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
};
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
                where: { status: "ACTIVE" },
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
    wardenStudents(wardenId, specificHostelId) {
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
    async studentId(userId) {
        const student = await prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!student)
            throw ApiError.notFound("Student profile has not been created yet");
        return student.id;
    }
    async getWardenIdsForStudent(studentId) {
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
    async getMyOverview(userId) {
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
    async allocate(studentId, roomId, requestedBed) {
        return prisma.$transaction(async (tx) => {
            const [student, room, current] = await Promise.all([
                tx.studentProfile.findUnique({ where: { id: studentId } }),
                tx.room.findUnique({ where: { id: roomId } }),
                tx.roomAllocation.findFirst({ where: { studentId, status: "ACTIVE" } }),
            ]);
            if (!student)
                throw ApiError.notFound("Student not found");
            if (!room || !room.isActive)
                throw ApiError.notFound("Room not found");
            if (current)
                throw ApiError.conflict("This student already has an active room allocation");
            if (["MAINTENANCE", "RESERVED"].includes(room.status))
                throw ApiError.badRequest("This room is not available for allocation");
            if (room.occupiedBeds >= room.capacity)
                throw ApiError.conflict("This room is already full");
            const pendingReservations = await tx.reservation.count({ where: { roomId, status: "PENDING", expiresAt: { gt: new Date() } } });
            if (room.occupiedBeds + pendingReservations >= room.capacity)
                throw ApiError.conflict("The remaining bed is temporarily reserved by a student completing payment");
            const active = await tx.roomAllocation.findMany({ where: { roomId, status: "ACTIVE" }, select: { bedNumber: true } });
            const bedNumber = requestedBed || Array.from({ length: room.capacity }, (_, i) => i + 1).find((n) => !active.some((a) => a.bedNumber === n));
            if (!bedNumber || active.some((a) => a.bedNumber === bedNumber) || bedNumber > room.capacity)
                throw ApiError.conflict("Selected bed is not available");
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
    async listLeaves(userId, role, filters) {
        let where = {};
        const selectedHostelId = filters?.hostelId && filters.hostelId !== "ALL" ? filters.hostelId : undefined;
        if (role === "STUDENT") {
            where = { studentId: await this.studentId(userId) };
        }
        else if (role === "WARDEN") {
            where = { student: this.wardenStudents(userId, selectedHostelId) };
        }
        else {
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
    async createLeave(userId, data) {
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
            }
            catch (err) {
                console.error("[OperationsService] Error notifying on leave create:", err);
            }
        })();
        return leave;
    }
    async decideLeave(id, approverId, role, data) {
        const where = { id };
        if (role === "WARDEN") {
            where.student = this.wardenStudents(approverId);
        }
        const leave = await prisma.leaveRequest.findFirst({
            where,
            include: { student: { select: { userId: true } } },
        });
        if (!leave)
            throw ApiError.notFound("Leave request not found in your hostel scope");
        if (leave.status !== "PENDING")
            throw ApiError.conflict("Only pending leave requests can be decided");
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
                    }
                    else if (data.status === "REJECTED") {
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
            }
            catch (err) {
                console.error("[OperationsService] Error notifying on leave decision:", err);
            }
        })();
        return updated;
    }
    async listComplaints(userId, role, filters) {
        let where = {};
        const selectedHostelId = filters?.hostelId && filters.hostelId !== "ALL" ? filters.hostelId : undefined;
        if (role === "STUDENT") {
            where = { studentId: await this.studentId(userId) };
        }
        else if (role === "WARDEN") {
            where = { student: this.wardenStudents(userId, selectedHostelId) };
        }
        else {
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
    async createComplaint(userId, data, files) {
        const studentId = await this.studentId(userId);
        const { title, description, category, priority } = data;
        const complaint = await prisma.$transaction(async (tx) => {
            const created = await tx.complaint.create({
                data: { studentId, title, description, category, priority },
                include: { ...studentInclude, images: true },
            });
            if (files && files.length > 0) {
                await tx.complaintImage.createMany({
                    data: files.map((f) => ({
                        complaintId: created.id,
                        imageUrl: `data:${f.mimetype};base64,${f.buffer.toString("base64")}`,
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
            }
            catch (err) {
                console.error("[OperationsService] Error notifying warden on complaint create:", err);
            }
        })();
        return complaint;
    }
    async updateComplaint(id, approverId, role, data) {
        const where = { id };
        if (role === "WARDEN") {
            where.student = this.wardenStudents(approverId);
        }
        const complaint = await prisma.complaint.findFirst({
            where,
            include: { student: { select: { userId: true } } },
        });
        if (!complaint)
            throw ApiError.notFound("Complaint not found in your hostel scope");
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
                        }
                        else {
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
                }
                catch (err) {
                    console.error("[OperationsService] Error notifying on complaint update:", err);
                }
            })();
        }
        return updated;
    }
    async listVisitors(userId, role, filters) {
        const where = {};
        // 1. Role-based scoping
        if (role === "SECURITY") {
            const security = await prisma.user.findUnique({
                where: { id: userId },
                select: { assignedHostelId: true },
            });
            if (!security?.assignedHostelId)
                return [];
            where.student = {
                roomAllocations: {
                    some: {
                        status: "ACTIVE",
                        room: { floor: { block: { hostelId: security.assignedHostelId } } },
                    },
                },
            };
        }
        else if (role === "WARDEN") {
            const warden = await prisma.user.findUnique({
                where: { id: userId },
                include: { wardenHostels: { where: { deletedAt: null }, select: { id: true } } },
            });
            const assignedIds = warden?.wardenHostels.map((h) => h.id) || [];
            if (assignedIds.length === 0)
                return [];
            let targetHostelFilter = { in: assignedIds };
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
        }
        else if (role === "ADMIN") {
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
        }
        else if (role === "STUDENT") {
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
    async createVisitor(userId, role, data) {
        let targetStudentId = data.studentId;
        if (role === "STUDENT") {
            targetStudentId = await this.studentId(userId);
        }
        else {
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
                if (!student)
                    throw ApiError.notFound("Student not found");
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
            }
            catch (err) {
                console.error("[OperationsService] Error notifying on visitor create:", err);
            }
        })();
        return visitor;
    }
    async listHostelStudents(userId, role, queryHostelId) {
        let targetHostelId = queryHostelId;
        if (role === "SECURITY") {
            const security = await prisma.user.findUnique({
                where: { id: userId },
                select: { assignedHostelId: true },
            });
            if (!security?.assignedHostelId)
                return [];
            targetHostelId = security.assignedHostelId;
        }
        else if (role === "WARDEN") {
            const warden = await prisma.user.findUnique({
                where: { id: userId },
                include: { wardenHostels: { where: { deletedAt: null }, select: { id: true } } },
            });
            const assignedIds = warden?.wardenHostels.map((h) => h.id) || [];
            if (assignedIds.length === 0)
                return [];
            if (targetHostelId && !assignedIds.includes(targetHostelId)) {
                throw ApiError.forbidden("You do not have access to this hostel");
            }
            if (!targetHostelId) {
                targetHostelId = assignedIds[0];
            }
        }
        const where = {};
        if (targetHostelId && targetHostelId !== "ALL") {
            where.roomAllocations = {
                some: {
                    status: "ACTIVE",
                    room: { floor: { block: { hostelId: targetHostelId } } },
                },
            };
        }
        else {
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
    async listFees(userId, role, filters) {
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
        let where = {};
        const selectedHostelId = filters?.hostelId && filters.hostelId !== "ALL" ? filters.hostelId : undefined;
        if (role === "STUDENT") {
            where = { studentId: await this.studentId(userId) };
        }
        else if (role === "WARDEN") {
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
        }
        else {
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
//# sourceMappingURL=operations.service.js.map