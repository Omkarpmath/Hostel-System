import { z } from "zod";
export const reserveSchema = z.object({ body: z.object({ roomId: z.string().uuid() }) });
export const orderSchema = z.object({ body: z.object({ reservationId: z.string().uuid() }) });
export const verifySchema = z.object({ body: z.object({ razorpayOrderId: z.string().min(1), razorpayPaymentId: z.string().min(1), razorpaySignature: z.string().min(1) }) });
export const cancelSchema = z.object({ body: z.object({ reservationId: z.string().uuid() }) });
//# sourceMappingURL=booking.schema.js.map