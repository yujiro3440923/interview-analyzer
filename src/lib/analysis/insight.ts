import { getCategoryLabel } from './category';

interface InsightData {
    totalRecords: number;
    avgSentiment: number;
    redAlertCount: number;
    yellowAlertCount: number;
    topCategory: string;
    topCategoryCount: number;
    totalPersons: number;
    highUrgencyCount: number;
    openCaseCount: number;
}

/** Generate insight text for group report */
export function generateGroupInsights(data: InsightData): string[] {
    const insights: string[] = [];

    // Overall summary
    insights.push(
        `今回のバッチでは${data.totalPersons}名から計${data.totalRecords}件の面談記録を分析しました。`
    );

    // Sentiment overview
    if (data.avgSentiment < -0.3) {
        insights.push(
            `⚠️ 全体の感情スコア平均は${data.avgSentiment.toFixed(2)}と低い水準にあります。個別フォローの検討を推奨します。`
        );
    } else if (data.avgSentiment > 0.2) {
        insights.push(
            `✅ 全体の感情スコア平均は${data.avgSentiment.toFixed(2)}と良好な状態です。`
        );
    } else {
        insights.push(
            `全体の感情スコア平均は${data.avgSentiment.toFixed(2)}で、中程度の水準です。`
        );
    }

    // Red alerts
    if (data.redAlertCount > 0) {
        insights.push(
            `🔴 ${data.redAlertCount}名が「赤信号（Red）」のリスクティアにあります。優先的な対応が必要です。`
        );
    }

    // Yellow alerts
    if (data.yellowAlertCount > 0) {
        insights.push(
            `🟡 ${data.yellowAlertCount}名が「黄信号（Yellow）」のリスクティアにあります。経過観察を推奨します。`
        );
    }

    // Top category
    if (data.topCategory && data.topCategory !== 'other') {
        insights.push(
            `最も多い相談カテゴリは「${getCategoryLabel(data.topCategory as never)}」で${data.topCategoryCount}件です。`
        );
    }

    // High urgency
    if (data.highUrgencyCount > 0) {
        insights.push(
            `⚡ ${data.highUrgencyCount}件が「緊急度：高」と判定されました。早急な確認を推奨します。`
        );
    }

    // Open cases
    if (data.openCaseCount > 0) {
        insights.push(
            `📋 ${data.openCaseCount}件の未解決ケースがあります。ケースボードでの確認・対応を推奨します。`
        );
    }

    return insights;
}

/** Generate insight text for person detail */
export function generatePersonInsight(data: {
    name: string;
    riskScore: number;
    riskTier: string;
    avgSentiment: number;
    recordCount: number;
    openCases: number;
    topCategory: string;
}): string {
    const parts: string[] = [];

    parts.push(`${data.name}さん（リスクスコア: ${data.riskScore}/100）`);

    if (data.riskTier === 'Red') {
        parts.push('は現在「赤信号」の状態です。早急な個別対応を検討してください。');
    } else if (data.riskTier === 'Yellow') {
        parts.push('は現在「黄信号」の状態です。継続的な経過観察を推奨します。');
    } else {
        parts.push('は現在安定した状態です。');
    }

    if (data.openCases > 0) {
        parts.push(` ${data.openCases}件の未解決ケースがあります。`);
    }

    return parts.join('');
}
