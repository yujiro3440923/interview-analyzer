import type { GroupStats, TrendDataPoint, CategoryTrendPoint, CategoryKey } from '@/types';
import { getCategoryLabel } from '@/lib/analysis/category';
import { extractBatchKeywords } from '@/lib/analysis/keywords';
import { generateGroupInsights } from '@/lib/analysis/insight';

interface RecordForAggregation {
    date: Date | null;
    sentimentScore: number | null;
    categoryMain: string | null;
    categoryFlags: Record<string, boolean> | null;
    textAll: string | null;
    urgency: string;
}

interface PersonForAggregation {
    riskTier: string;
}

interface CaseForAggregation {
    status: string;
}

/** Aggregate records into group-level statistics */
export async function aggregateGroupStats(
    records: RecordForAggregation[],
    persons: PersonForAggregation[],
    cases: CaseForAggregation[]
): Promise<GroupStats> {
    const totalRecords = records.length;
    const totalPersons = persons.length;

    // Average sentiment
    const sentiments = records
        .filter((r) => r.sentimentScore != null)
        .map((r) => r.sentimentScore!);
    const avgSentiment = sentiments.length > 0
        ? Math.round((sentiments.reduce((a, b) => a + b, 0) / sentiments.length) * 100) / 100
        : 0;

    // Alert counts
    const redAlertCount = persons.filter((p) => p.riskTier === 'Red').length;
    const yellowAlertCount = persons.filter((p) => p.riskTier === 'Yellow').length;

    // Trend data (group by month)
    const trendMap = new Map<string, number>();
    for (const r of records) {
        if (!r.date) continue;
        const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
        trendMap.set(key, (trendMap.get(key) || 0) + 1);
    }
    const trendData: TrendDataPoint[] = Array.from(trendMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

    // Category trend (by month)
    const catTrendMap = new Map<string, Record<string, number>>();
    for (const r of records) {
        if (!r.date || !r.categoryMain) continue;
        const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
        if (!catTrendMap.has(key)) catTrendMap.set(key, {});
        const cats = catTrendMap.get(key)!;
        cats[r.categoryMain] = (cats[r.categoryMain] || 0) + 1;
    }
    const categoryTrend: CategoryTrendPoint[] = Array.from(catTrendMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, cats]) => ({ date, ...cats }));

    // Category distribution
    const catCounts = new Map<string, number>();
    for (const r of records) {
        if (!r.categoryMain) continue;
        catCounts.set(r.categoryMain, (catCounts.get(r.categoryMain) || 0) + 1);
    }
    const categoryDistribution = Array.from(catCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({
            category: getCategoryLabel(category as CategoryKey),
            count,
            percentage: Math.round((count / totalRecords) * 100),
        }));

    // Top keywords
    const texts = records.map((r) => r.textAll || '').filter(Boolean);
    const topKeywords = await extractBatchKeywords(texts, 20);

    // High urgency count
    const highUrgencyCount = records.filter((r) => r.urgency === 'High').length;

    // Open case count
    const openCaseCount = cases.filter((c) => c.status !== 'Resolved').length;

    // Top category
    const topCatEntry = categoryDistribution[0];

    // Generate insights
    const insights = generateGroupInsights({
        totalRecords,
        avgSentiment,
        redAlertCount,
        yellowAlertCount,
        topCategory: topCatEntry ? Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other' : 'other',
        topCategoryCount: topCatEntry?.count || 0,
        totalPersons,
        highUrgencyCount,
        openCaseCount,
    });

    return {
        totalRecords,
        totalPersons,
        avgSentiment,
        redAlertCount,
        yellowAlertCount,
        trendData,
        categoryTrend,
        categoryDistribution,
        topKeywords,
        insights,
    };
}
