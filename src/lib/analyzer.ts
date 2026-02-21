import kuromoji from 'kuromoji';
import path from 'path';
// @ts-ignore
import lda from 'lda';

// Singleton for Tokenizer to avoid reloading dictionary
let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;

const getTokenizer = (): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> => {
    return new Promise((resolve, reject) => {
        if (tokenizer) {
            resolve(tokenizer);
            return;
        }

        kuromoji.builder({ dicPath: path.join(process.cwd(), 'public', 'dict') }).build((err, _tokenizer) => {
            if (err) {
                reject(err);
            } else {
                tokenizer = _tokenizer;
                resolve(_tokenizer);
            }
        });
    });
};

export interface AnalysisResult {
    tokens: string[];
    keywords: { word: string; count: number }[];
    topics: string[];
    sentimentScore: number;
}

// Simple sentiment dictionary (MVP)
const POSITIVE_WORDS = ['解決', '良好', '改善', '安心', '理解', '協力', '感謝', '順調', 'できた', '対応済み'];
const NEGATIVE_WORDS = ['不安', '不満', '困難', '未解決', '悪い', '痛い', '辛い', '辞めたい', 'トラブル', 'ミス', '苦情', '分からない'];

export async function analyzeText(text: string): Promise<AnalysisResult> {
    if (!text) return { tokens: [], keywords: [], topics: [], sentimentScore: 0 };

    const tokenizer = await getTokenizer();
    const tokens = tokenizer.tokenize(text);

    // Filter for nouns and verbs, exclude particles/symbols
    const relevantTokens = tokens
        .filter((t) => (t.pos === '名詞' && t.pos_detail_1 !== '数') || t.pos === '動詞' || t.pos === '形容詞')
        .map((t) => t.surface_form);

    // Sentiment Scoring
    let score = 0;
    tokens.forEach((t) => {
        if (POSITIVE_WORDS.includes(t.surface_form)) score += 1;
        if (NEGATIVE_WORDS.includes(t.surface_form)) score -= 1;
    });
    // Normalize score slightly (-1 to 1 is ideal but hard without total count, so just raw score for now or clamped)
    const clampedScore = Math.min(1, Math.max(-1, score * 0.2));

    return {
        tokens: relevantTokens,
        keywords: [], // Populated later if needed per-doc
        topics: [],   // Populated by batch LDA
        sentimentScore: clampedScore,
    };
}

export function performBatchAnalysis(docs: string[], numTopics = 5) {
    // LDA expects array of strings (documents)
    // It returns array of topics, each topic is array of terms
    // term: { term: "word", probability: 0.05 }

    if (docs.length === 0) return [];

    // LDA library is simple
    // docs should be space-separated tokens for better English LDA, 
    // but for Japanese we should pre-tokenize and join with spaces?
    // The 'lda' library extracts terms itself using regex, so passing Japanese text directly might not work well 
    // unless we pass space-separated nouns.

    // Actually, 'analyzeText' returns tokens. We should use those.
    // But this function takes raw docs? Let's assume the caller passes joined tokens.

    // However, for MVP, if we pass raw Japanese text to 'lda' library, it splits by space. 
    // So we MUST tokenize first.

    try {
        const result = lda(docs, numTopics, 5); // 5 terms per topic
        return result;
    } catch (e) {
        console.error("LDA Error:", e);
        return [];
    }
}

export function extractKeywordsGlobal(allTokens: string[][]): { word: string; count: number }[] {
    const map = new Map<string, number>();
    allTokens.flat().forEach((t) => {
        if (t.length < 2) return; // Skip single chars
        map.set(t, (map.get(t) || 0) + 1);
    });

    return Array.from(map.entries())
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);
}
