import type { AnalysisResult, AppSettings } from '@/types';
import { normalizeText } from './normalize';
import { classifyCategory } from './category';
import { analyzeSentiment } from './sentiment';
import { extractKeywords } from './keywords';
import { determineUrgency } from './urgency';
import { DEFAULT_SETTINGS } from './dictionaries';

/** Run the full analysis pipeline on a single record */
export async function analyzeRecord(
    content: string | null,
    action: string | null,
    settings: AppSettings = DEFAULT_SETTINGS
): Promise<AnalysisResult> {
    // 1. Normalize text
    const textAll = normalizeText(content, action);

    if (!textAll || textAll.trim().length === 0) {
        return {
            textAll: '',
            categoryMain: 'other',
            categoryFlags: {
                procedure: false, relationship: false, work: false,
                health: false, life: false, language_culture: false, other: true,
            },
            keywords: [],
            sentiment: { score: 0, confidence: 0, evidence: { positiveHits: [], negativeHits: [], negations: [], intensifiers: [] } },
            urgency: 'Low',
        };
    }

    // 2. Category classification
    const { main: categoryMain, flags: categoryFlags } = classifyCategory(textAll, settings.dict);

    // 3. Sentiment analysis
    const sentiment = analyzeSentiment(textAll, settings.sentimentDict);

    // 4. Keyword extraction
    const keywords = await extractKeywords(textAll, 10);

    // 5. Urgency determination
    const urgency = determineUrgency(textAll, sentiment.score, categoryFlags, settings.thresholds);

    return {
        textAll,
        categoryMain,
        categoryFlags,
        keywords,
        sentiment,
        urgency,
    };
}
