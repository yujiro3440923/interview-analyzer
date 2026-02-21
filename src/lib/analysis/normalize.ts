/**
 * Text normalization utilities
 */

/** Normalize text by cleaning whitespace, fullwidth chars, and combining content + action */
export function normalizeText(content: string | null, action: string | null): string {
    const parts = [content, action].filter(Boolean).map((t) => cleanText(t!));
    return parts.join(' ').trim();
}

/** Clean a single text string */
export function cleanText(text: string): string {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\u3000/g, ' ')  // fullwidth space
        .replace(/\s+/g, ' ')
        .trim();
}

/** Parse cell content that may contain date + staff separated by newline */
export function parseCellWithNewline(value: string): { primary: string; secondary: string | null } {
    const lines = value.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
        return { primary: lines[0] || '', secondary: null };
    }
    return { primary: lines[0], secondary: lines.slice(1).join(' ') };
}

/** Try to parse a date string from various formats */
export function parseDate(value: string | number | null | undefined): Date | null {
    if (value == null || value === '') return null;

    // Excel serial number
    if (typeof value === 'number') {
        // Excel epoch starts at 1900-01-01 (serial = 1)
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 86400000);
        if (!isNaN(date.getTime())) return date;
        return null;
    }

    const str = String(value).trim();
    if (!str) return null;

    // Handle multiline cells (take first line as date)
    const firstLine = str.split('\n')[0].trim();

    // Common Japanese date formats
    const patterns = [
        // 2024年1月15日
        /(\d{4})年(\d{1,2})月(\d{1,2})日/,
        // 2024/01/15 or 2024/1/15
        /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,
        // R6.1.15 (Reiwa)
        /R(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,
        // 令和6年1月15日
        /令和(\d{1,2})年(\d{1,2})月(\d{1,2})日/,
    ];

    for (const pattern of patterns) {
        const match = firstLine.match(pattern);
        if (match) {
            let year = parseInt(match[1]);
            const month = parseInt(match[2]);
            const day = parseInt(match[3]);

            // Reiwa conversion
            if (pattern.source.startsWith('R') || pattern.source.includes('令和')) {
                year = year + 2018;
            }

            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) return date;
        }
    }

    // Fallback: try native Date parse
    const parsed = new Date(firstLine);
    if (!isNaN(parsed.getTime())) return parsed;

    return null;
}

/** Extract staff name from cell content (after newline or in parentheses) */
export function extractStaff(value: string | null): string | null {
    if (!value) return null;
    const { secondary } = parseCellWithNewline(value);
    if (secondary) return secondary;

    // Try to extract from parentheses: (担当: 田中)
    const match = value.match(/[（(](?:担当[：:]?\s*)?(.+?)[）)]/);
    if (match) return match[1].trim();

    return null;
}
