export interface DynamicQrPayload {
    sid: string;
    usn: string;
    uid: string;
    iat: number;
    exp: number;
    n: string;
}
export interface VerificationResult {
    valid: boolean;
    isDynamic: boolean;
    studentProfileId?: string;
    usn?: string;
    userId?: string;
    error?: "EXPIRED" | "INVALID" | "TAMPERED";
    message?: string;
    issuedAt?: Date;
    expiresAt?: Date;
}
export declare const QR_ROTATION_INTERVAL_SECONDS = 30;
export declare const QR_GRACE_PERIOD_SECONDS = 0;
/**
 * Generate a cryptographically signed, short-lived Dynamic QR token.
 * Output format: DQR_<base64url(payload)>.<base64url(signature)>
 */
export declare function generateDynamicQrToken(student: {
    id: string;
    usn: string;
    userId: string;
}): {
    token: string;
    expiresInSeconds: number;
    expiresAt: Date;
};
/**
 * Verify a token string (verifies signature, expiration, and ensures dynamic token integrity).
 */
export declare function verifyQrToken(rawToken: string): VerificationResult;
//# sourceMappingURL=dynamicQr.d.ts.map