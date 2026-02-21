import type { RiskResult, RiskFactor, RiskTier, ThresholdSettings, CategoryKey } from '@/types';
import { DEFAULT_THRESHOLDS, UNRESOLVED_EXPRESSIONS } from './dictionaries';

interface PersonRecordData {
    date: Date | null;
    sentimentScore: number | null;
    categoryMain: string | null;
    textAll: string | null;
}

interface RiskInput {
    records: PersonRecordData[];
    openCaseCount: number;
    thresholds?: ThresholdSettings;
    lookbackDays?: number;
}

const HIGH_RISK_CATEGORIES: CategoryKey[] = ['health', 'relationship'];

/** Calculate risk score for a person based on their records and cases */
export function calculateRiskScore(input: RiskInput): RiskResult {
    const {
        records,
        openCaseCount,
        thresholds = DEFAULT_THRESHOLDS,
        lookbackDays = 60,
    } = input;

    const factors: RiskFactor[] = [];
    const weights = thresholds.riskWeights;

    // Sort records by date
    const sortedRecords = [...records]
        .filter((r) => r.date != null)
        .sort((a, b) => (a.date!.getTime()) - (b.date!.getTime()));

    const now = new Date();
    const cutoff = new Date(now.getTime() - lookbackDays * 86400000);
    const recentRecords = sortedRecords.filter((r) => r.date! >= cutoff);
    const olderRecords = sortedRecords.filter((r) => r.date! < cutoff);

    // Factor 1: Volume increase
    const recentRate = recentRecords.length / Math.max(lookbackDays / 30, 1);
    const olderRate = olderRecords.length / Math.max((sortedRecords.length > 0
        ? (cutoff.getTime() - sortedRecords[0].date!.getTime()) / (30 * 86400000)
        : 1), 1);
    const volumeScore = olderRate > 0
        ? Math.min(100, ((recentRate - olderRate) / Math.max(olderRate, 0.5)) * 100)
        : recentRecords.length > 2 ? 60 : recentRecords.length * 20;
    factors.push({
        name: '相談件数増加',
        value: Math.max(0, volumeScore),
        weight: weights.volumeIncrease,
        description: `直近${lookbackDays}日: ${recentRecords.length}件`,
    });

    // Factor 2: Sentiment decline
    const sentimentScores = recentRecords
        .filter((r) => r.sentimentScore != null)
        .map((r) => r.sentimentScore!);
    let sentimentDeclineScore = 0;
    if (sentimentScores.length >= 2) {
        const firstHalf = sentimentScores.slice(0, Math.floor(sentimentScores.length / 2));
        const secondHalf = sentimentScores.slice(Math.floor(sentimentScores.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const decline = firstAvg - secondAvg;
        sentimentDeclineScore = Math.max(0, Math.min(100, decline * 200));
    } else if (sentimentScores.length === 1 && sentimentScores[0] < -0.3) {
        sentimentDeclineScore = 50;
    }
    const avgSentiment = sentimentScores.length > 0
        ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
        : 0;
    if (avgSentiment < -0.5) sentimentDeclineScore = Math.max(sentimentDeclineScore, 70);
    factors.push({
        name: '感情スコア低下',
        value: sentimentDeclineScore,
        weight: weights.sentimentDecline,
        description: `平均感情: ${avgSentiment.toFixed(2)}`,
    });

    // Factor 3: High risk category ratio
    const highRiskCount = recentRecords.filter(
        (r) => r.categoryMain && HIGH_RISK_CATEGORIES.includes(r.categoryMain as CategoryKey)
    ).length;
    const highRiskRatio = recentRecords.length > 0 ? highRiskCount / recentRecords.length : 0;
    factors.push({
        name: '高リスクカテゴリ比率',
        value: Math.min(100, highRiskRatio * 100),
        weight: weights.highRiskCategory,
        description: `${highRiskCount}/${recentRecords.length}件が健康/人間関係`,
    });

    // Factor 4: Open cases
    const openCaseScore = Math.min(100, openCaseCount * 30);
    factors.push({
        name: '未解決ケース',
        value: openCaseScore,
        weight: weights.openCases,
        description: `${openCaseCount}件が未解決`,
    });

    // Factor 5: Unresolved expressions
    const allText = recentRecords.map((r) => r.textAll || '').join(' ');
    let unresolvedHits = 0;
    for (const expr of UNRESOLVED_EXPRESSIONS) {
        if (allText.includes(expr)) unresolvedHits++;
    }
    const unresolvedScore = Math.min(100, unresolvedHits * 25);
    factors.push({
        name: '未解決表現',
        value: unresolvedScore,
        weight: weights.unresolvedExpressions,
        description: `${unresolvedHits}個の未解決表現を検出`,
    });

    // Calculate weighted total
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedSum = factors.reduce((sum, f) => sum + (f.value * f.weight), 0);
    const score = Math.round(Math.min(100, Math.max(0, weightedSum / totalWeight)));

    // Determine tier
    let tier: RiskTier = 'Green';
    if (score >= thresholds.riskTier.red) tier = 'Red';
    else if (score >= thresholds.riskTier.yellow) tier = 'Yellow';

    return { score, tier, factors };
}
