export interface ReceiptData {
    receiptNumber: string;
    studentName: string;
    usn: string;
    department?: string;
    studentEmail: string;
    receiptEmail: string;
    feeType: string;
    amount: number;
    paidAt: Date;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    hostelName: string;
    blockName?: string;
    roomNumber?: string;
    bedNumber?: number;
}
export declare class ReceiptService {
    /**
     * Generate sequential receipt number in format: REC-YYYY-XXXXXX
     */
    generateReceiptNumber(): Promise<string>;
    /**
     * Generate an official, branded vector PDF receipt buffer using pure-JS pdfkit.
     */
    generateReceiptPdf(data: ReceiptData): Promise<Buffer>;
    /**
     * Process receipt generation, extract Razorpay checkout email, and dispatch via Resend.
     * Fully idempotent and non-blocking for payment success.
     */
    processReceiptAndEmail(feeId: string, razorpayPaymentId: string, options?: {
        force?: boolean;
    }): Promise<{
        success: boolean;
        email: string | null;
        skipped: boolean;
        receiptNumber?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        receiptNumber: string;
        email: string;
        error: string;
        skipped?: undefined;
    } | {
        success: boolean;
        receiptNumber: string;
        email: string;
        skipped?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        email?: undefined;
        skipped?: undefined;
        receiptNumber?: undefined;
    }>;
    /**
     * Get PDF buffer for direct download / viewing by fee ID.
     */
    getReceiptPdfByFeeId(feeId: string, requesterUserId: string, requesterRole: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
}
export declare const receiptService: ReceiptService;
//# sourceMappingURL=receipt.service.d.ts.map