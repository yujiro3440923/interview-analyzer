import type { CategoryDict, CategoryFlags, CategoryKey } from '@/types';
import { DEFAULT_CATEGORY_DICT } from './dictionaries';

const CATEGORY_PRIORITY: CategoryKey[] = [
    'health',
    'relationship',
    'work',
    'procedure',
    'life',
    'language_culture',
    'other',
];

/** Classify text into categories based on dictionary matching */
export function classifyCategory(
    text: string,
    dict: CategoryDict = DEFAULT_CATEGORY_DICT
): { main: CategoryKey; flags: CategoryFlags } {
    const flags: CategoryFlags = {
        procedure: false,
        relationship: false,
        work: false,
        health: false,
        life: false,
        language_culture: false,
        other: false,
    };

    const lowerText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(dict)) {
        if (category in flags) {
            for (const keyword of keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    flags[category as keyof CategoryFlags] = true;
                    break;
                }
            }
        }
    }

    // Determine main category by priority
    let main: CategoryKey = 'other';
    for (const cat of CATEGORY_PRIORITY) {
        if (cat !== 'other' && flags[cat]) {
            main = cat;
            break;
        }
    }

    // If no category matched, set other to true
    if (main === 'other') {
        flags.other = true;
    }

    return { main, flags };
}

/** Get Japanese label for category */
export function getCategoryLabel(category: CategoryKey): string {
    const labels: Record<CategoryKey, string> = {
        procedure: '手続き・制度',
        relationship: '人間関係',
        work: '仕事・労働',
        health: '健康・メンタル',
        life: '生活・住居',
        language_culture: '言語・文化',
        other: 'その他',
    };
    return labels[category] || category;
}

/** Get category color for charts */
export function getCategoryColor(category: CategoryKey): string {
    const colors: Record<CategoryKey, string> = {
        procedure: '#3b82f6',
        relationship: '#ef4444',
        work: '#f59e0b',
        health: '#ec4899',
        life: '#10b981',
        language_culture: '#8b5cf6',
        other: '#6b7280',
    };
    return colors[category] || '#6b7280';
}
