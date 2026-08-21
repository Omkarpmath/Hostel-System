import { z } from "zod";
export declare const reserveSchema: z.ZodObject<{
    body: z.ZodObject<{
        roomId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        roomId: string;
    }, {
        roomId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        roomId: string;
    };
}, {
    body: {
        roomId: string;
    };
}>;
export declare const orderSchema: z.ZodObject<{
    body: z.ZodObject<{
        reservationId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        reservationId: string;
    }, {
        reservationId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        reservationId: string;
    };
}, {
    body: {
        reservationId: string;
    };
}>;
export declare const verifySchema: z.ZodObject<{
    body: z.ZodObject<{
        razorpayOrderId: z.ZodString;
        razorpayPaymentId: z.ZodString;
        razorpaySignature: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }, {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    };
}, {
    body: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    };
}>;
export declare const cancelSchema: z.ZodObject<{
    body: z.ZodObject<{
        reservationId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        reservationId: string;
    }, {
        reservationId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        reservationId: string;
    };
}, {
    body: {
        reservationId: string;
    };
}>;
//# sourceMappingURL=booking.schema.d.ts.map