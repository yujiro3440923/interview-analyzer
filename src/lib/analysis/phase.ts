import type { PhaseData } from '@/types';

interface PhaseRecord {
    date: Date | null;
    sentimentScore: number | null;
    categoryMain: string | null;
}

const PHASE_RANGES = [
    { label: '入社直後', range: '0-30日', min: 0, max: 30 },
    { label: '適応期', range: '31-90日', min: 31, max: 90 },
    { label: '安定期前期', range: '91-180日', min: 91, max: 180 },
    { label: '安定期後期', range: '181日以上', min: 181, max: Infinity },
];

/** Analyze records by tenure phase */
export function analyzePhases(
    records: PhaseRecord[],
    startDate: Date | null
): PhaseData[] | null {
    if (!startDate) return null;

    const phases: PhaseData[] = PHASE_RANGES.map((p) => ({
        phase: p.label,
        range: p.range,
        count: 0,
        avgSentiment: 0,
        topCategory: 'other',
    }));

    const phaseBuckets: { sentiments: number[]; categories: Map<string, number> }[] =
        PHASE_RANGES.map(() => ({ sentiments: [], categories: new Map() }));

    for (const record of records) {
        if (!record.date) continue;
        const tenureDays = Math.floor(
            (record.date.getTime() - startDate.getTime()) / 86400000
        );
        if (tenureDays < 0) continue;

        const phaseIndex = PHASE_RANGES.findIndex(
            (p) => tenureDays >= p.min && tenureDays <= p.max
        );
        if (phaseIndex === -1) continue;

        phases[phaseIndex].count++;
        if (record.sentimentScore != null) {
            phaseBuckets[phaseIndex].sentiments.push(record.sentimentScore);
        }
        if (record.categoryMain) {
            const cats = phaseBuckets[phaseIndex].categories;
            cats.set(record.categoryMain, (cats.get(record.categoryMain) || 0) + 1);
        }
    }

    // Calculate averages and top categories
    for (let i = 0; i < phases.length; i++) {
        const bucket = phaseBuckets[i];
        if (bucket.sentiments.length > 0) {
            phases[i].avgSentiment = Math.round(
                (bucket.sentiments.reduce((a, b) => a + b, 0) / bucket.sentiments.length) * 100
            ) / 100;
        }
        if (bucket.categories.size > 0) {
            let maxCat = 'other';
            let maxCount = 0;
            for (const [cat, count] of bucket.categories) {
                if (count > maxCount) {
                    maxCat = cat;
                    maxCount = count;
                }
            }
            phases[i].topCategory = maxCat;
        }
    }

    return phases;
}
