/**
 * Parse a CSV text buffer or string into an array of objects.
 * Handles quoted cells with commas, whitespace trimming, and header normalization.
 */
export declare function parseCsv(csvText: string): Record<string, string>[];
/**
 * Format an array of objects into a standard CSV string with escaped quotes.
 */
export declare function generateCsv(headers: {
    key: string;
    label: string;
}[], data: Record<string, any>[]): string;
//# sourceMappingURL=csv.d.ts.map