export declare class VerifyService {
    /**
     * Public verification: look up a student by their unique dynamic QR token
     * (or legacy UUID token) and return non-sensitive verification data including hostel & fee status.
     */
    verifyStudent(token: string): Promise<{
        verified: boolean;
        student: {
            name: string;
            avatarUrl: string | null;
            usn: string;
            department: string;
            year: number;
            semester: number;
            gender: import("@prisma/client").$Enums.Gender;
            bloodGroup: string | null;
        };
        hostel: {
            allocated: boolean;
            hostelName: string;
            hostelType: import("@prisma/client").$Enums.HostelType;
            blockName: string;
            floorName: string;
            roomNumber: string;
            bedNumber: number;
        } | {
            allocated: boolean;
            hostelName: null;
            roomNumber: null;
            hostelType?: undefined;
            blockName?: undefined;
            floorName?: undefined;
            bedNumber?: undefined;
        };
        fees: {
            hostelFee: {
                status: string;
                paidAt: Date | null;
                amount: import("@prisma/client/runtime/library").Decimal;
            } | {
                status: string;
                paidAt: null;
                amount: null;
            };
            messFee: {
                status: string;
                paidAt: Date | null;
                amount: import("@prisma/client/runtime/library").Decimal;
            } | {
                status: string;
                paidAt: null;
                amount: null;
            };
        };
        verifiedAt: string;
    }>;
}
export declare const verifyService: VerifyService;
//# sourceMappingURL=verify.service.d.ts.map