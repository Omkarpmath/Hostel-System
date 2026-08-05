interface TokenPayload {
    userId: string;
    role: string;
    email: string;
}
export declare function generateAccessToken(payload: TokenPayload): string;
export declare function generateRefreshToken(payload: TokenPayload): string;
export declare function verifyAccessToken(token: string): TokenPayload;
export declare function verifyRefreshToken(token: string): TokenPayload;
export {};
//# sourceMappingURL=jwt.d.ts.map