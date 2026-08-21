import { z } from "zod";
export declare const updateAmountSchema: z.ZodObject<{
    body: z.ZodObject<{
        amount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        amount: number;
    }, {
        amount: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        amount: number;
    };
}, {
    body: {
        amount: number;
    };
}>;
export declare const verifyPaymentSchema: z.ZodObject<{
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
//# sourceMappingURL=mess-fee.schema.d.ts.map