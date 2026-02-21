import * as XLSX from 'xlsx';

export interface RawInterviewRow {
    date: Date | null;
    name: string;
    content: string;
    action: string;
    originalDateString?: string;
    rowNumber: number;
    sheetName: string;
}

export async function parseInterviewLog(fileBuffer: Buffer, filename: string): Promise<RawInterviewRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
    const allRows: RawInterviewRow[] = [];

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        // Simple check: if sheet name implies "All" or "Summary", prioritize it? 
        // For now, we aggregate all sheets.

        // Handle merged cells by filling them
        if (sheet['!ref']) {
            const range = XLSX.utils.decode_range(sheet['!ref']);

            // Fill merged cells
            if (sheet['!merges']) {
                sheet['!merges'].forEach((merge) => {
                    // Find the value of the top-left cell
                    const startCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
                    const val = sheet[startCell];

                    // Apply to all cells in range
                    for (let r = merge.s.r; r <= merge.e.r; ++r) {
                        for (let c = merge.s.c; c <= merge.e.c; ++c) {
                            const targetCell = XLSX.utils.encode_cell({ r, c });
                            sheet[targetCell] = val; // Copy value (reference is fine for simple types)
                        }
                    }
                });
            }

            // Convert to JSON (array of arrays first to handle headers manually)
            const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

            if (jsonData.length === 0) continue;

            // Detect header row (simple heuristic: look for "Date" / "Name" / "Content" keywords)
            let headerRowIndex = 0;
            let headers: string[] = [];

            // Try to find header row in first 10 rows
            for (let i = 0; i < Math.min(10, jsonData.length); i++) {
                const row = jsonData[i] as string[];
                const joined = row.join(' ').toLowerCase();
                if (joined.includes('date') || joined.includes('日付') || joined.includes('problem') || joined.includes('相談') || joined.includes('内容')) {
                    headerRowIndex = i;
                    headers = row.map(String);
                    break;
                }
            }

            // Map columns
            // We look for: Date, Name, Content (Problem), Action (Response)
            const colMap = {
                date: -1,
                name: -1,
                content: -1,
                action: -1
            };

            headers.forEach((h, idx) => {
                const lower = h.toLowerCase();
                if (lower.includes('date') || lower.includes('日付')) colMap.date = idx;
                else if (lower.includes('name') || lower.includes('氏名') || lower.includes('名前')) colMap.name = idx;
                else if (lower.includes('problem') || lower.includes('相談') || lower.includes('内容') || lower.includes('件名')) colMap.content = idx;
                else if (lower.includes('action') || lower.includes('対応') || lower.includes('処置') || lower.includes('その後')) colMap.action = idx;
            });

            // Extract data
            for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                const row = jsonData[i] as any[];
                if (!row || row.length === 0) continue;

                let dateVal = colMap.date > -1 ? row[colMap.date] : null;
                let nameVal = colMap.name > -1 ? row[colMap.name] : '';
                let contentVal = colMap.content > -1 ? row[colMap.content] : '';
                let actionVal = colMap.action > -1 ? row[colMap.action] : '';

                // Fallback: if no headers found, assume columns 0, 1, 2, 3 based on MVP spec
                if (colMap.date === -1 && colMap.content === -1) {
                    // Assume 0=Date, 1=Name, 2=Content, 3=Action (or variations)
                    // Or assume 0=Date, 1=Content, 2=Action
                    if (row[0] instanceof Date || (typeof row[0] === 'string' && row[0].match(/\d/))) {
                        dateVal = row[0];
                        // Heuristic: Name might be in col 1 or embedded in 0
                        // If col 1 is short, it's name. If long, it's content.
                        const col1 = row[1] ? String(row[1]) : '';
                        if (col1.length < 20) {
                            nameVal = col1;
                            contentVal = row[2] || '';
                            actionVal = row[3] || '';
                        } else {
                            contentVal = col1;
                            actionVal = row[2] || '';
                        }
                    }
                }

                // Handle "Date + Name" in one cell
                if (dateVal && typeof dateVal === 'string' && dateVal.includes('\n')) {
                    const parts = dateVal.split('\n');
                    // Try to find date part
                    // This is tricky without strict format, but MVP handles simple cases
                    // Assume Part 0 is date, Part 1 is name
                    dateVal = parts[0];
                    if (!nameVal) nameVal = parts[1] || '';
                }

                // Normalize Date
                let parsedDate: Date | null = null;
                if (dateVal instanceof Date) {
                    parsedDate = dateVal;
                } else if (typeof dateVal === 'string' && dateVal.trim()) {
                    parsedDate = new Date(dateVal); // Basic JS parsing
                    if (isNaN(parsedDate.getTime())) parsedDate = null;
                } else if (typeof dateVal === 'number') {
                    // Excel serial date not handled by xlsx cellDates:true? 
                    // Usually xlsx handles it.
                    // parsedDate = new Date((dateVal - (25567 + 2))*86400*1000); 
                }

                if (!contentVal) continue; // Skip empty rows

                allRows.push({
                    date: parsedDate,
                    originalDateString: String(dateVal),
                    name: String(nameVal).trim() || `Unknown-${i}`,
                    content: String(contentVal).trim(),
                    action: String(actionVal).trim(),
                    rowNumber: i + 1,
                    sheetName
                });
            }
        }
    }

    return allRows;
}
