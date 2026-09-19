import { Role } from "@prisma/client";
export interface LogAuditOptions {
    actorId: string;
    actorRole: Role;
    action: string;
    entityType: string;
    entityId?: string;
    details?: Record<string, unknown> | null;
    ipAddress?: string;
}
/**
 * Centrally and asynchronously records an immutable institutional audit log entry.
 * Errors are caught and logged so audit logging never crashes the primary transaction.
 */
export declare function logAuditEvent(options: LogAuditOptions): Promise<void>;
//# sourceMappingURL=audit.d.ts.map