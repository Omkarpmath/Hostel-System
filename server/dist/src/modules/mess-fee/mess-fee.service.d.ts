import { MealPlan } from "@prisma/client";
export declare class MessFeeService {
    private studentId;
    getAmounts(): Promise<{
        veg: number;
        nonVeg: number;
    }>;
    getAmount(mealPlan?: MealPlan): Promise<number>;
    updateAmounts(veg: number, nonVeg: number): Promise<{
        veg: number;
        nonVeg: number;
    }>;
    updateAmount(amount: number): Promise<{
        veg: number;
        nonVeg: number;
    }>;
    getMyStatus(userId: string): Promise<{
        annualAmount: number;
        amounts: {
            veg: number;
            nonVeg: number;
        };
        isPaid: boolean;
        paidAt: Date | null;
        mealPlan: import("@prisma/client").$Enums.MealPlan | null;
        transactionId: string | null;
        paymentMethod: string | null;
        history: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.FeeType;
            studentId: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            razorpayOrderId: string | null;
            allocationId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            mealPlan: import("@prisma/client").$Enums.MealPlan | null;
            transactionId: string | null;
            paymentMethod: string | null;
            receiptNumber: string | null;
            receiptEmail: string | null;
            emailSent: boolean;
            emailSentAt: Date | null;
            emailError: string | null;
            screenshotUrl: string | null;
            paidAt: Date | null;
            dueDate: Date;
        }[];
    }>;
    createOrder(userId: string, mealPlan?: MealPlan): Promise<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        reused: boolean;
        mealPlan: import("@prisma/client").$Enums.MealPlan;
    } | {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        mealPlan: import("@prisma/client").$Enums.MealPlan;
        reused?: undefined;
    }>;
    verifyPayment(userId: string, orderId: string, paymentId: string, signature: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.FeeType;
        studentId: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        razorpayOrderId: string | null;
        allocationId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        mealPlan: import("@prisma/client").$Enums.MealPlan | null;
        transactionId: string | null;
        paymentMethod: string | null;
        receiptNumber: string | null;
        receiptEmail: string | null;
        emailSent: boolean;
        emailSentAt: Date | null;
        emailError: string | null;
        screenshotUrl: string | null;
        paidAt: Date | null;
        dueDate: Date;
    }>;
}
export declare const messFeeService: MessFeeService;
//# sourceMappingURL=mess-fee.service.d.ts.map