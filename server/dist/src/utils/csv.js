/**
 * Parse a CSV text buffer or string into an array of objects.
 * Handles quoted cells with commas, whitespace trimming, and header normalization.
 */
export function parseCsv(csvText) {
    const lines = csvText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2)
        return [];
    const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i];
        if (!rawLine)
            continue;
        const values = parseCsvLine(rawLine);
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            const headerKey = headers[j];
            row[headerKey] = (values[j] ?? "").trim();
        }
        records.push(row);
    }
    return records;
}
/**
 * Parses an individual CSV line properly handling quoted entries with commas.
 */
function parseCsvLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // skip escaped quote
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === "," && !inQuotes) {
            result.push(current);
            current = "";
        }
        else {
            current += char;
        }
    }
    result.push(current);
    return result;
}
/**
 * Format an array of objects into a standard CSV string with escaped quotes.
 */
export function generateCsv(headers, data) {
    const headerRow = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(",");
    const dataRows = data.map((item) => {
        return headers
            .map((h) => {
            const val = item[h.key];
            const str = val === null || val === undefined ? "" : String(val);
            return `"${str.replace(/"/g, '""')}"`;
        })
            .join(",");
    });
    return [headerRow, ...dataRows].join("\r\n");
}
//# sourceMappingURL=csv.js.map