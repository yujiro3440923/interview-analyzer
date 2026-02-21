import Papa from 'papaparse';
import type { ParsedSheet, ParsedRow, ParseError } from '@/types';
import { guessColumns, findHeaderRow } from './column-guesser';
import { forwardFill } from './normalize-cells';
import { extractStaff } from '@/lib/analysis/normalize';

/** Parse a CSV string and return structured data */
export function parseCsv(csvString: string): {
    sheets: ParsedSheet[];
    errors: ParseError[];
} {
    const errors: ParseError[] = [];

    const result = Papa.parse(csvString, {
        header: false,
        skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
        for (const err of result.errors) {
            errors.push({
                sheet: 'CSV',
                row: err.row ?? 0,
                message: `CSV解析エラー: ${err.message}`,
            });
        }
    }

    const rawRows: (string | null)[][] = (result.data as string[][]).map((row: string[]) =>
        row.map((cell: string) => (cell.trim() || null))
    );

    if (rawRows.length === 0) {
        return { sheets: [], errors };
    }

    // Find header row
    const headerRowIndex = findHeaderRow(rawRows);
    const headers = rawRows[headerRowIndex] || [];

    // Guess columns
    const mapping = guessColumns(headers);

    // Forward fill data rows
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const filledRows = forwardFill(dataRows);

    // Parse rows
    const rows: ParsedRow[] = [];
    for (let i = 0; i < filledRows.length; i++) {
        const row = filledRows[i];
        if (!row || row.every((c) => !c)) continue;

        try {
            const dateVal = mapping.date != null ? row[mapping.date] : null;
            const nameVal = mapping.name != null ? row[mapping.name] : null;
            const contentVal = mapping.content != null ? row[mapping.content] : null;
            const actionVal = mapping.action != null ? row[mapping.action] : null;
            const staffVal = mapping.staff != null ? row[mapping.staff] : null;

            if (!contentVal && !actionVal) continue;

            const staff = staffVal || (dateVal ? extractStaff(dateVal) : null);
            const dateStr = dateVal ? dateVal.split('\n')[0].trim() : null;

            rows.push({
                date: dateStr,
                name: nameVal || null,
                staff,
                content: contentVal,
                action: actionVal,
                sheetName: 'CSV',
                rowIndex: headerRowIndex + 1 + i + 1,
            });
        } catch (err) {
            errors.push({
                sheet: 'CSV',
                row: headerRowIndex + 1 + i + 1,
                message: `行の解析に失敗: ${err instanceof Error ? err.message : String(err)}`,
            });
        }
    }

    return {
        sheets: [{ sheetName: 'CSV', isGroup: true, rows }],
        errors,
    };
}
