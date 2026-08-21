import crypto from "crypto";
import { prisma } from "../../config/db.js";
import { razorpayClient } from "../../config/razorpay.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
const CONFIG_KEY = "annual_mess_fee";
const DEFAULT_AMOUNT = 78000;
export class MessFeeService {
    // ─── Helpers ───
    async studentId(userId) {
        const student = await prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!student)
            throw ApiError.badRequest("Complete your student profile first");
        return student.id;
    }
    // ─── Config ───
    async getAmount() {
        const config = await prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY } });
        return config ? parseFloat(config.value) : DEFAULT_AMOUNT;
    }
    async updateAmount(amount) {
        if (amount < 1)
            throw ApiError.badRequest("Mess fee must be at least ₹1");
        return prisma.systemConfig.upsert({
            where: { key: CONFIG_KEY },
            update: { value: String(amount) },
            create: { key: CONFIG_KEY, value: String(amount), description: "Annual mess fee amount in INR" },
        });
    }
    // ─── Student status ───
    async getMyStatus(userId) {
        const studentId = await this.studentId(userId);
        const amount = await this.getAmount();
        // Find any MESS_FEE records for this student
        const fees = await prisma.fee.findMany({
            where: { studentId, type: "MESS_FEE" },
            orderBy: { createdAt: "desc" },
        });
        const paidFee = fees.find((f) => f.status === "PAID");
        return {
            annualAmount: amount,
            isPaid: !!paidFee,
            paidAt: paidFee?.paidAt || null,
            transactionId: paidFee?.transactionId || null,
            paymentMethod: paidFee?.paymentMethod || null,
            history: fees,
        };
    }
    // ─── Create Razorpay order ───
    async createOrder(userId) {
        const studentId = await this.studentId(userId);
        const amount = await this.getAmount();
        const amountPaise = Math.round(amount * 100);
        if (amountPaise < 100)
            throw ApiError.badRequest("Mess fee must be at least ₹1.00");
        // Check if already paid
        const paid = await prisma.fee.findFirst({
            where: { studentId, type: "MESS_FEE", status: "PAID" },
        });
        if (paid)
            throw ApiError.conflict("Mess fee has already been paid");
        // Check for existing PENDING order (reuse it like hostel fee does)
        const pending = await prisma.fee.findFirst({
            where: { studentId, type: "MESS_FEE", status: "PENDING", razorpayOrderId: { not: null } },
        });
        if (pending?.razorpayOrderId) {
            return {
                orderId: pending.razorpayOrderId,
                amount: amountPaise,
                currency: "INR",
                keyId: env.RAZORPAY_KEY_ID,
                reused: true,
            };
        }
        // Create new Razorpay order
        const order = await razorpayClient().orders.create({
            amount: amountPaise,
            currency: "INR",
            receipt: `mess_${studentId.slice(0, 20)}`,
            notes: { studentId, type: "MESS_FEE" },
        });
        // Create or update the PENDING fee record
        if (pending) {
            await prisma.fee.update({
                where: { id: pending.id },
                data: { razorpayOrderId: order.id, amount },
            });
        }
        else {
            await prisma.fee.create({
                data: {
                    studentId,
                    amount,
                    type: "MESS_FEE",
                    status: "PENDING",
                    razorpayOrderId: order.id,
                    dueDate: new Date(new Date().getFullYear(), 11, 31), // end of current year
                },
            });
        }
        return {
            orderId: order.id,
            amount: amountPaise,
            currency: "INR",
            keyId: env.RAZORPAY_KEY_ID,
        };
    }
    // ─── Verify payment (same HMAC pattern as booking.service.ts) ───
    async verifyPayment(userId, orderId, paymentId, signature) {
        const studentId = await this.studentId(userId);
        // HMAC-SHA256 verification (identical to booking.service.ts)
        if (!env.RAZORPAY_KEY_SECRET)
            throw ApiError.badRequest("Razorpay test keys are not configured");
        const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");
        const expectedBuffer = Buffer.from(expected);
        const signatureBuffer = Buffer.from(signature);
        if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
            throw ApiError.badRequest("Payment signature verification failed");
        }
        // Idempotent: if already paid with this payment ID, return success
        const existing = await prisma.fee.findFirst({
            where: { transactionId: paymentId, type: "MESS_FEE", status: "PAID" },
        });
        if (existing)
            return existing;
        // Find the pending fee with this order ID
        const fee = await prisma.fee.findFirst({
            where: { studentId, razorpayOrderId: orderId, type: "MESS_FEE", status: "PENDING" },
        });
        if (!fee)
            throw ApiError.badRequest("No pending mess fee found for this order");
        // Also check no other PAID mess fee exists (race condition guard)
        const alreadyPaid = await prisma.fee.findFirst({
            where: { studentId, type: "MESS_FEE", status: "PAID" },
        });
        if (alreadyPaid)
            throw ApiError.conflict("Mess fee has already been paid");
        // Mark as paid
        return prisma.fee.update({
            where: { id: fee.id },
            data: {
                status: "PAID",
                transactionId: paymentId,
                paymentMethod: "RAZORPAY",
                paidAt: new Date(),
            },
        });
    }
}
export const messFeeService = new MessFeeService();
//# sourceMappingURL=mess-fee.service.js.map