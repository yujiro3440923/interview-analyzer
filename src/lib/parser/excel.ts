import ExcelJS from 'exceljs';
import type { ParsedSheet, ParsedRow, ParseError } from '@/types';
import { guessColumns, findHeaderRow } from './column-guesser';
import { forwardFill, cellToString } from './normalize-cells';
import { extractStaff } from '@/lib/analysis/normalize';

/** Parse an Excel file buffer and return structured data */
export async function parseExcel(buffer: ArrayBuffer): Promise<{
    sheets: ParsedSheet[];
    errors: ParseError[];
}> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheets: ParsedSheet[] = [];
    const errors: ParseError[] = [];

    for (const worksheet of workbook.worksheets) {
        const sheetName = worksheet.name;
        const isGroup = /全員|全体|一覧|まとめ|summary|all/i.test(sheetName);

        // Read all rows as string arrays
        const rawRows: (string | null)[][] = [];
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            const cells: (string | null)[] = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                // Pad with nulls if needed
                while (cells.length < colNumber - 1) cells.push(null);
                cells.push(cellToString(cell.value));
            });
            // Pad row index
            while (rawRows.length < rowNumber - 1) rawRows.push([]);
            rawRows.push(cells);
        });

        if (rawRows.length === 0) continue;

        // Find header row
        const headerRowIndex = findHeaderRow(rawRows);
        const headers = rawRows[headerRowIndex] || [];

        // Guess columns
        const mapping = guessColumns(headers);

        // Forward fill remaining rows (skip header)
        let dataRows = rawRows.slice(headerRowIndex + 1);

        // Fix: Strip completely empty rows to prevent forwardFill from creating ghost records
        dataRows = dataRows.filter((row) =>
            row && row.some((cell) => cell != null && String(cell).trim() !== '')
        );

        const filledRows = forwardFill(dataRows);

        // Parse each row
        const rows: ParsedRow[] = [];
        for (let i = 0; i < filledRows.length; i++) {
            const row = filledRows[i];
            if (!row || row.every((c) => !c)) continue; // skip empty rows

            try {
                const dateVal = mapping.date != null ? row[mapping.date] : null;
                const nameVal = mapping.name != null ? row[mapping.name] : null;
                const contentVal = mapping.content != null ? row[mapping.content] : null;
                const actionVal = mapping.action != null ? row[mapping.action] : null;
                const staffVal = mapping.staff != null ? row[mapping.staff] : null;

                // Skip rows with no meaningful content
                if (!contentVal && !actionVal) {
                    continue;
                }

                // Extract staff from date cell if contains newline
                const staff = staffVal || (dateVal ? extractStaff(dateVal) : null);

                // Parse date (handle multiline date cells)
                const dateStr = dateVal ? dateVal.split('\n')[0].trim() : null;

                rows.push({
                    date: dateStr,
                    name: isGroup ? (nameVal || null) : (nameVal || sheetName),
                    staff,
                    content: contentVal,
                    action: actionVal,
                    sheetName,
                    rowIndex: headerRowIndex + 1 + i + 1, // 1-based, accounting for header
                });
            } catch (err) {
                errors.push({
                    sheet: sheetName,
                    row: headerRowIndex + 1 + i + 1,
                    message: `行の解析に失敗: ${err instanceof Error ? err.message : String(err)}`,
                });
            }
        }

        if (rows.length > 0 || isGroup) {
            sheets.push({ sheetName, isGroup, rows });
        }
    }

    return { sheets, errors };
}
