import type { ColumnMapping } from '@/types';

const DATE_PATTERNS = ['日付', 'date', '面談日', '相談日', '実施日', '年月日'];
const NAME_PATTERNS = ['氏名', '名前', 'name', '対象者', '労働者', '技能実習生', '相談者'];
const STAFF_PATTERNS = ['担当', 'staff', '面談者', '相談員', '対応者', '支援員'];
const CONTENT_PATTERNS = ['相談', '内容', 'content', '相談内容', '面談内容', '主訴', '概要', '報告'];
const ACTION_PATTERNS = ['対応', 'action', 'その後', '対応内容', '対処', '措置', '結果', 'フォロー', 'その他'];

/** Guess column mapping from header row */
export function guessColumns(headers: (string | null | undefined)[]): ColumnMapping {
    const mapping: ColumnMapping = {};
    const normalizedHeaders = headers.map((h) =>
        h ? String(h).trim().toLowerCase().replace(/\s+/g, '') : ''
    );

    for (let i = 0; i < normalizedHeaders.length; i++) {
        const header = normalizedHeaders[i];
        if (!header) continue;

        if (!mapping.date && matchesAny(header, DATE_PATTERNS)) {
            mapping.date = i;
        } else if (!mapping.name && matchesAny(header, NAME_PATTERNS)) {
            mapping.name = i;
        } else if (!mapping.staff && matchesAny(header, STAFF_PATTERNS)) {
            mapping.staff = i;
        } else if (!mapping.content && matchesAny(header, CONTENT_PATTERNS)) {
            mapping.content = i;
        } else if (!mapping.action && matchesAny(header, ACTION_PATTERNS)) {
            mapping.action = i;
        }
    }

    // Fallback: position-based mapping if essentials are missing
    if (mapping.date == null && mapping.content == null) {
        // Assume: col0=date, col1=name or content, col2=content or action, col3=action
        const colCount = headers.length;
        if (colCount >= 3) {
            mapping.date = 0;
            mapping.content = 1;
            mapping.action = 2;
        } else if (colCount >= 2) {
            mapping.date = 0;
            mapping.content = 1;
        }
    } else if (mapping.content == null && mapping.date != null) {
        // Content is likely the widest text column; find first unmapped column after date
        for (let i = 0; i < headers.length; i++) {
            if (i !== mapping.date && i !== mapping.name && i !== mapping.staff && i !== mapping.action) {
                mapping.content = i;
                break;
            }
        }
    }

    return mapping;
}

function matchesAny(header: string, patterns: string[]): boolean {
    return patterns.some((p) => header.includes(p.toLowerCase()));
}

/** Find the header row index (first row with recognizable column names) */
export function findHeaderRow(rows: (string | null | undefined)[][]): number {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        if (!row) continue;
        const normalized = row.map((c) => (c ? String(c).trim().toLowerCase() : ''));
        const recognizable = normalized.filter((c) => {
            return (
                matchesAny(c, DATE_PATTERNS) ||
                matchesAny(c, NAME_PATTERNS) ||
                matchesAny(c, CONTENT_PATTERNS) ||
                matchesAny(c, ACTION_PATTERNS) ||
                matchesAny(c, STAFF_PATTERNS)
            );
        });
        if (recognizable.length >= 2) return i;
    }
    return 0; // default to first row
}
