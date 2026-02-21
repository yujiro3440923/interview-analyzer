/** Forward-fill empty cells downward (for merged cell equivalent in CSV/Excel) */
export function forwardFill(rows: (string | null)[][]): (string | null)[][] {
    if (rows.length === 0) return rows;

    const result = rows.map((row) => [...row]);
    const colCount = Math.max(...result.map((r) => r.length));

    for (let col = 0; col < colCount; col++) {
        let lastValue: string | null = null;
        for (let row = 0; row < result.length; row++) {
            const cell = result[row]?.[col];
            if (cell != null && String(cell).trim() !== '') {
                lastValue = String(cell).trim();
            } else if (lastValue != null) {
                if (!result[row]) result[row] = [];
                result[row][col] = lastValue;
            }
        }
    }

    return result;
}

/** Convert a cell value to string, handling various types */
export function cellToString(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === 'string') return value.trim() || null;
    if (typeof value === 'number') return String(value);
    if (value instanceof Date) {
        return value.toISOString().split('T')[0];
    }
    if (typeof value === 'object' && 'text' in (value as Record<string, unknown>)) {
        return String((value as Record<string, unknown>).text).trim() || null;
    }
    return String(value).trim() || null;
}
