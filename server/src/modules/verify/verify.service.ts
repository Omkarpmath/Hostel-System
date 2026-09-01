import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { verifyQrToken } from "../../utils/dynamicQr.js";

export class VerifyService {
  /**
   * Public verification: look up a student by their unique dynamic QR token
   * (or legacy UUID token) and return non-sensitive verification data including hostel & fee status.
   */
  async verifyStudent(token: string) {
    if (!token || token.length < 10) {
      throw ApiError.notFound("Invalid or unrecognized QR code");
    }

    const check = verifyQrToken(token);

    if (!check.valid) {
      if (check.error === "EXPIRED") {
        throw ApiError.badRequest(
          check.message || "This QR code has expired. Please ask the student to present the live QR on their phone."
        );
      }
      if (check.error === "TAMPERED") {
        throw ApiError.badRequest("QR code verification failed. This token appears to be modified or invalid.");
      }
      throw ApiError.notFound("Invalid or unrecognized QR code");
    }

    // Determine query filter: either by student ID (from dynamic token) or static qrCodeToken
    const whereClause = check.isDynamic && check.studentProfileId
      ? { id: check.studentProfileId }
      : { qrCodeToken: token };

    const student = await prisma.studentProfile.findUnique({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            // Deliberately exclude: email, phone, passwordHash
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
        fees: {
          where: { status: "PAID" },
          select: { type: true, status: true, paidAt: true, amount: true },
          orderBy: { paidAt: "desc" },
        },
      },
    });

    if (!student) {
      throw ApiError.notFound("Student record not found for this QR code");
    }

    const allocation = student.roomAllocations[0] || null;
    const hostelFeePaid = student.fees.find((f) => f.type === "HOSTEL_FEE");
    const messFeePaid = student.fees.find((f) => f.type === "MESS_FEE");

    return {
      verified: true,
      student: {
        name: `${student.user.firstName} ${student.user.lastName}`.trim(),
        avatarUrl: student.user.avatarUrl,
        usn: student.usn,
        department: student.department,
        year: student.year,
        semester: student.semester,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
      },
      hostel: allocation
        ? {
            allocated: true,
            hostelName: allocation.room.floor.block.hostel.name,
            hostelType: allocation.room.floor.block.hostel.type,
            blockName: allocation.room.floor.block.name,
            floorName: allocation.room.floor.name,
            roomNumber: allocation.room.roomNumber,
            bedNumber: allocation.bedNumber,
          }
        : {
            allocated: false,
            hostelName: null,
            roomNumber: null,
          },
      fees: {
        hostelFee: hostelFeePaid
          ? { status: "PAID", paidAt: hostelFeePaid.paidAt, amount: hostelFeePaid.amount }
          : { status: "UNPAID", paidAt: null, amount: null },
        messFee: messFeePaid
          ? { status: "PAID", paidAt: messFeePaid.paidAt, amount: messFeePaid.amount }
          : { status: "UNPAID", paidAt: null, amount: null },
      },
      verifiedAt: new Date().toISOString(),
    };
  }
}

export const verifyService = new VerifyService();
