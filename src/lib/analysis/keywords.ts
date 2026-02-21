import { STOPWORDS } from './dictionaries';

// Kuromoji tokenizer type
interface KuromojiToken {
    surface_form: string;
    pos: string;
    pos_detail_1: string;
    reading?: string;
}

type Tokenizer = {
    tokenize: (text: string) => KuromojiToken[];
};

let tokenizerInstance: Tokenizer | null = null;
let tokenizerPromise: Promise<Tokenizer> | null = null;

/** Initialize kuromoji tokenizer (singleton) */
async function getTokenizer(): Promise<Tokenizer> {
    if (tokenizerInstance) return tokenizerInstance;
    if (tokenizerPromise) return tokenizerPromise;

    tokenizerPromise = new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const kuromoji = require('kuromoji');
        const dictPath = 'node_modules/kuromoji/dict';

        kuromoji.builder({ dicPath: dictPath }).build(
            (err: Error | null, tokenizer: Tokenizer) => {
                if (err) {
                    console.error('Failed to initialize kuromoji:', err);
                    reject(err);
                    return;
                }
                tokenizerInstance = tokenizer;
                resolve(tokenizer);
            }
        );
    });

    return tokenizerPromise;
}

/** Extract keywords from text using kuromoji morphological analysis */
export async function extractKeywords(
    text: string,
    topN: number = 10
): Promise<string[]> {
    if (!text || text.trim().length === 0) return [];

    try {
        const tokenizer = await getTokenizer();
        const tokens = tokenizer.tokenize(text);

        const wordCounts = new Map<string, number>();

        for (const token of tokens) {
            // Only keep nouns, verbs, adjectives
            const pos = token.pos;
            if (pos !== '名詞' && pos !== '動詞' && pos !== '形容詞') continue;

            // Skip non-meaningful sub-types
            if (token.pos_detail_1 === '非自立' || token.pos_detail_1 === '接尾') continue;

            const word = token.surface_form;

            // Skip short words, numbers, and stopwords
            if (word.length < 2) continue;
            if (/^\d+$/.test(word)) continue;
            if (STOPWORDS.has(word)) continue;

            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }

        // Sort by frequency and return top N
        return Array.from(wordCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([word]) => word);
    } catch (error) {
        console.error('Keyword extraction failed:', error);
        // Fallback: simple word extraction without kuromoji
        return fallbackKeywordExtraction(text, topN);
    }
}

/** Batch extract keywords from multiple texts and aggregate */
export async function extractBatchKeywords(
    texts: string[],
    topN: number = 20
): Promise<{ word: string; count: number }[]> {
    try {
        const tokenizer = await getTokenizer();
        const wordCounts = new Map<string, number>();

        for (const text of texts) {
            if (!text || text.trim().length === 0) continue;
            const tokens = tokenizer.tokenize(text);

            for (const token of tokens) {
                const pos = token.pos;
                if (pos !== '名詞' && pos !== '動詞' && pos !== '形容詞') continue;
                if (token.pos_detail_1 === '非自立' || token.pos_detail_1 === '接尾') continue;

                const word = token.surface_form;
                if (word.length < 2 || /^\d+$/.test(word) || STOPWORDS.has(word)) continue;

                wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            }
        }

        return Array.from(wordCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([word, count]) => ({ word, count }));
    } catch (error) {
        console.error('Batch keyword extraction failed:', error);
        return [];
    }
}

/** Fallback keyword extraction without kuromoji */
function fallbackKeywordExtraction(text: string, topN: number): string[] {
    // Simple approach: split by common delimiters and filter
    const words = text
        .replace(/[。、！？\s]+/g, ' ')
        .split(' ')
        .filter((w) => w.length >= 2 && !STOPWORDS.has(w));

    const counts = new Map<string, number>();
    for (const w of words) {
        counts.set(w, (counts.get(w) || 0) + 1);
    }

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([word]) => word);
}
