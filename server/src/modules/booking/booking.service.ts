import crypto from "crypto";
import { Prisma, RoomStatus } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { razorpayClient } from "../../config/razorpay.js";
import { ApiError } from "../../utils/ApiError.js";

import { receiptService } from "../receipt/receipt.service.js";

const roomInclude = { floor: { include: { block: { include: { hostel: { select: { id: true, name: true } } } } } } } as const;

export class BookingService {
  private async studentId(userId: string) {
    const student = await prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw ApiError.badRequest("Complete your student profile before booking a room");
    return student.id;
  }

  private async expireReservations(studentId?: string) {
    await prisma.reservation.updateMany({ where: { status: "PENDING", expiresAt: { lte: new Date() }, ...(studentId ? { studentId } : {}) }, data: { status: "EXPIRED" } });
  }

  async reserve(userId: string, roomId: string) {
    const studentId = await this.studentId(userId);
    await this.expireReservations(studentId);
    return prisma.$transaction(async (tx) => {
      const [allocation, existing, room] = await Promise.all([
        tx.roomAllocation.findFirst({ where: { studentId, status: "ACTIVE" } }),
        tx.reservation.findFirst({ where: { studentId, status: "PENDING", expiresAt: { gt: new Date() } }, include: { room: { include: roomInclude } } }),
        tx.room.findUnique({ where: { id: roomId }, include: roomInclude }),
      ]);
      if (allocation) throw ApiError.conflict("You already have an active room allocation");
      if (existing) return existing;
      if (!room || !room.isActive || !["AVAILABLE", "PARTIALLY_OCCUPIED"].includes(room.status)) throw ApiError.badRequest("This room is not available");
      const held = await tx.reservation.count({ where: { roomId, status: "PENDING", expiresAt: { gt: new Date() } } });
      if (room.occupiedBeds + held >= room.capacity) throw ApiError.conflict("This room has just been reserved by another student");
      return tx.reservation.create({ data: { studentId, roomId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }, include: { room: { include: roomInclude } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async activeReservation(userId: string) {
    const studentId = await this.studentId(userId);
    await this.expireReservations(studentId);
    const reservation = await prisma.reservation.findFirst({ where: { studentId, status: "PENDING", expiresAt: { gt: new Date() } }, include: { room: { include: roomInclude } }, orderBy: { createdAt: "desc" } });
    if (!reservation?.razorpayOrderId) return reservation;

    // A browser refresh can happen after Checkout has completed but before its
    // callback reaches our API. Reconcile a captured Razorpay payment so that a
    // successful payment always results in a room allocation.
    let payments: { items: Array<{ id: string; status: string }> };
    try {
      payments = await razorpayClient().orders.fetchPayments(reservation.razorpayOrderId) as { items: Array<{ id: string; status: string }> };
    } catch {
      return reservation;
    }
    const successfulPayment = payments.items.find((payment) => payment.status === "captured" || payment.status === "authorized");
    if (!successfulPayment) return reservation;
    await this.allocatePaidReservation(studentId, reservation.razorpayOrderId, successfulPayment.id);
    return null;
  }

  async createOrder(userId: string, reservationId: string) {
    const studentId = await this.studentId(userId);
    await this.expireReservations(studentId);
    const reservation = await prisma.reservation.findFirst({ where: { id: reservationId, studentId, status: "PENDING", expiresAt: { gt: new Date() } }, include: { room: true } });
    if (!reservation) throw ApiError.notFound("Active reservation not found or it has expired");
    const amount = Math.round(Number(reservation.room.feePerSemester) * 100);
    if (amount < 100) throw ApiError.badRequest("The room fee must be at least ₹1.00 to create a payment order");
    // A dismissed or failed Checkout must remain retryable. Razorpay permits its
    // unpaid order to be reopened, so return it rather than creating duplicates.
    if (reservation.razorpayOrderId) {
      return { reservationId: reservation.id, orderId: reservation.razorpayOrderId, amount, currency: "INR", keyId: env.RAZORPAY_KEY_ID, reused: true };
    }
    const order = await razorpayClient().orders.create({ amount, currency: "INR", receipt: `res_${reservation.id.slice(0, 24)}`, notes: { reservationId: reservation.id, studentId } });
    await prisma.reservation.update({ where: { id: reservation.id }, data: { razorpayOrderId: order.id } });
    return { reservationId: reservation.id, orderId: order.id, amount, currency: "INR", keyId: env.RAZORPAY_KEY_ID };
  }

  async verifyAndAllocate(userId: string, orderId: string, paymentId: string, signature: string) {
    const studentId = await this.studentId(userId);
    if (!env.RAZORPAY_KEY_SECRET) throw ApiError.badRequest("Razorpay test keys are not configured");
    const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) throw ApiError.badRequest("Payment signature verification failed");
    return this.allocatePaidReservation(studentId, orderId, paymentId);
  }

  private async allocatePaidReservation(studentId: string, orderId: string, paymentId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const paid = await tx.fee.findFirst({ where: { transactionId: paymentId }, include: { allocation: true } });
      if (paid?.allocation) return { allocation: paid.allocation, feeId: paid.id };
      const reservation = await tx.reservation.findFirst({ where: { studentId, razorpayOrderId: orderId, status: "PENDING", expiresAt: { gt: new Date() } } });
      if (!reservation) throw ApiError.badRequest("Reservation is invalid or expired");
      await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${reservation.roomId} FOR UPDATE`;
      const [room, active] = await Promise.all([tx.room.findUnique({ where: { id: reservation.roomId } }), tx.roomAllocation.findFirst({ where: { studentId, status: "ACTIVE" } })]);
      if (!room || !room.isActive || room.occupiedBeds >= room.capacity) throw ApiError.conflict("Room is no longer available");
      if (active) throw ApiError.conflict("You already have an active room allocation");
      const beds = await tx.roomAllocation.findMany({ where: { roomId: room.id, status: "ACTIVE" }, select: { bedNumber: true } });
      const bedNumber = Array.from({ length: room.capacity }, (_, index) => index + 1).find((bed) => !beds.some((entry) => entry.bedNumber === bed));
      if (!bedNumber) throw ApiError.conflict("Room is no longer available");
      const allocation = await tx.roomAllocation.create({ data: { studentId, roomId: room.id, bedNumber, allocatedFrom: new Date() } });
      const occupiedBeds = room.occupiedBeds + 1;
      await tx.room.update({ where: { id: room.id }, data: { occupiedBeds, status: occupiedBeds >= room.capacity ? "FULL" : "PARTIALLY_OCCUPIED", version: { increment: 1 } } });
      const fee = await tx.fee.create({
        data: {
          studentId,
          allocationId: allocation.id,
          amount: room.feePerSemester,
          type: "HOSTEL_FEE",
          status: "PAID",
          transactionId: paymentId,
          paymentMethod: "RAZORPAY",
          paidAt: new Date(),
          dueDate: new Date(),
        },
      });

      // Ensure PENDING mess fee invoice is created if none exists
      const existingMessFee = await tx.fee.findFirst({
        where: { studentId, type: "MESS_FEE" },
      });
      if (!existingMessFee) {
        const messConfig = await tx.systemConfig.findUnique({ where: { key: "annual_mess_fee" } });
        const messAmount = messConfig ? parseFloat(messConfig.value) : 78000;
        const messDueDate = new Date();
        messDueDate.setDate(messDueDate.getDate() + 30);
        await tx.fee.create({
          data: {
            studentId,
            allocationId: allocation.id,
            amount: messAmount,
            type: "MESS_FEE",
            status: "PENDING",
            dueDate: messDueDate,
          },
        });
      }

      await tx.reservation.update({ where: { id: reservation.id }, data: { status: "CONVERTED" } });
      return { allocation, feeId: fee.id };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // Trigger PDF generation and Resend email delivery (non-blocking, fail-safe)
    if (result?.feeId) {
      receiptService.processReceiptAndEmail(result.feeId, paymentId).catch((err) => {
        console.error("[BookingService] Failed to send receipt email:", err);
      });
    }

    return result.allocation;
  }

  async cancel(userId: string, reservationId: string) {
    const studentId = await this.studentId(userId);
    const result = await prisma.reservation.updateMany({ where: { id: reservationId, studentId, status: "PENDING" }, data: { status: "EXPIRED" } });
    if (!result.count) throw ApiError.notFound("Active reservation not found");
  }
}
export const bookingService = new BookingService();
