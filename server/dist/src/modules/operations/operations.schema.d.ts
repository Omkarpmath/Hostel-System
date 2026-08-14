import { z } from "zod";
export declare const allocationSchema: z.ZodObject<{
    body: z.ZodObject<{
        studentId: z.ZodString;
        roomId: z.ZodString;
        bedNumber: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        studentId: string;
        roomId: string;
        bedNumber?: number | undefined;
    }, {
        studentId: string;
        roomId: string;
        bedNumber?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        studentId: string;
        roomId: string;
        bedNumber?: number | undefined;
    };
}, {
    body: {
        studentId: string;
        roomId: string;
        bedNumber?: number | undefined;
    };
}>;
export declare const leaveSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["HOME_LEAVE", "MEDICAL", "EMERGENCY", "OTHER"]>>;
        reason: z.ZodString;
        fromDate: z.ZodDate;
        toDate: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        reason: string;
        fromDate: Date;
        toDate: Date;
        type?: "HOME_LEAVE" | "MEDICAL" | "EMERGENCY" | "OTHER" | undefined;
    }, {
        reason: string;
        fromDate: Date;
        toDate: Date;
        type?: "HOME_LEAVE" | "MEDICAL" | "EMERGENCY" | "OTHER" | undefined;
    }>, {
        reason: string;
        fromDate: Date;
        toDate: Date;
        type?: "HOME_LEAVE" | "MEDICAL" | "EMERGENCY" | "OTHER" | undefined;
    }, {
        reason: string;
        fromDate: Date;
        toDate: Date;
        type?: "HOME_LEAVE" | "MEDICAL" | "EMERGENCY" | "OTHER" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        reason: string;
        fromDate: Date;
        toDate: Date;
        type?: "HOME_LEAVE" | "MEDICAL" | "EMERGENCY" | "OTHER" | undefined;
    };
}, {
    body: {
        reason: string;
        fromDate: Date;
        toDate: Date;
        type?: "HOME_LEAVE" | "MEDICAL" | "EMERGENCY" | "OTHER" | undefined;
    };
}>;
export declare const leaveStatusSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        status: z.ZodEnum<["APPROVED", "REJECTED"]>;
        rejectionReason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "APPROVED" | "REJECTED";
        rejectionReason?: string | undefined;
    }, {
        status: "APPROVED" | "REJECTED";
        rejectionReason?: string | undefined;
    }>, {
        status: "APPROVED" | "REJECTED";
        rejectionReason?: string | undefined;
    }, {
        status: "APPROVED" | "REJECTED";
        rejectionReason?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: "APPROVED" | "REJECTED";
        rejectionReason?: string | undefined;
    };
}, {
    body: {
        status: "APPROVED" | "REJECTED";
        rejectionReason?: string | undefined;
    };
}>;
export declare const complaintSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        category: z.ZodOptional<z.ZodEnum<["ELECTRICAL", "PLUMBING", "FURNITURE", "CLEANING", "NETWORK", "OTHER"]>>;
        priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        title: string;
        category?: "OTHER" | "ELECTRICAL" | "PLUMBING" | "FURNITURE" | "CLEANING" | "NETWORK" | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    }, {
        description: string;
        title: string;
        category?: "OTHER" | "ELECTRICAL" | "PLUMBING" | "FURNITURE" | "CLEANING" | "NETWORK" | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        description: string;
        title: string;
        category?: "OTHER" | "ELECTRICAL" | "PLUMBING" | "FURNITURE" | "CLEANING" | "NETWORK" | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    };
}, {
    body: {
        description: string;
        title: string;
        category?: "OTHER" | "ELECTRICAL" | "PLUMBING" | "FURNITURE" | "CLEANING" | "NETWORK" | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    };
}>;
export declare const complaintStatusSchema: z.ZodObject<{
    body: z.ZodObject<{
        status: z.ZodEnum<["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]>;
        resolution: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
        resolution?: string | undefined;
    }, {
        status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
        resolution?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
        resolution?: string | undefined;
    };
}, {
    body: {
        status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
        resolution?: string | undefined;
    };
}>;
export declare const visitorSchema: z.ZodObject<{
    body: z.ZodObject<{
        visitorName: z.ZodString;
        visitorPhone: z.ZodString;
        relationship: z.ZodString;
        purpose: z.ZodString;
        idProofType: z.ZodOptional<z.ZodString>;
        idProofNumber: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        visitorName: string;
        visitorPhone: string;
        relationship: string;
        purpose: string;
        idProofType?: string | undefined;
        idProofNumber?: string | undefined;
    }, {
        visitorName: string;
        visitorPhone: string;
        relationship: string;
        purpose: string;
        idProofType?: string | undefined;
        idProofNumber?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        visitorName: string;
        visitorPhone: string;
        relationship: string;
        purpose: string;
        idProofType?: string | undefined;
        idProofNumber?: string | undefined;
    };
}, {
    body: {
        visitorName: string;
        visitorPhone: string;
        relationship: string;
        purpose: string;
        idProofType?: string | undefined;
        idProofNumber?: string | undefined;
    };
}>;
//# sourceMappingURL=operations.schema.d.ts.map