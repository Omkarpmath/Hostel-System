export declare class MessFeeService {
    private studentId;
    getAmount(): Promise<number>;
    updateAmount(amount: number): Promise<{
        id: string;
        updatedAt: Date;
        description: string | null;
        key: string;
        value: string;
    }>;
    getMyStatus(userId: string): Promise<{
        annualAmount: number;
        isPaid: boolean;
        paidAt: Date | null;
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
            transactionId: string | null;
            paymentMethod: string | null;
            receiptNumber: string | null;
            screenshotUrl: string | null;
            paidAt: Date | null;
            dueDate: Date;
        }[];
    }>;
    createOrder(userId: string): Promise<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        reused: boolean;
    } | {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
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
        transactionId: string | null;
        paymentMethod: string | null;
        receiptNumber: string | null;
        screenshotUrl: string | null;
        paidAt: Date | null;
        dueDate: Date;
    }>;
}
export declare const messFeeService: MessFeeService;
//# sourceMappingURL=mess-fee.service.d.ts.map