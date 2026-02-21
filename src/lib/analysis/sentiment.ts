import type { SentimentResult, SentimentDict } from '@/types';
import { DEFAULT_SENTIMENT_DICT } from './dictionaries';

/** Calculate sentiment score using dictionary + negation + intensifier rules */
export function analyzeSentiment(
    text: string,
    dict: SentimentDict = DEFAULT_SENTIMENT_DICT
): SentimentResult {
    const positiveHits: string[] = [];
    const negativeHits: string[] = [];
    const negations: string[] = [];
    const intensifiers: string[] = [];

    let posCount = 0;
    let negCount = 0;

    // Check for intensifiers
    for (const word of dict.intensifier) {
        if (text.includes(word)) {
            intensifiers.push(word);
        }
    }
    const intensifierBoost = intensifiers.length > 0 ? 1.3 : 1.0;

    // Check for negation patterns
    const negationFound: string[] = [];
    for (const word of dict.negation) {
        if (text.includes(word)) {
            negationFound.push(word);
        }
    }

    // Special "problem-negation" patterns (問題ない = positive)
    const positiveNegations = ['問題ない', '大丈夫', '心配ない', '不安ない'];
    let hasPositiveNegation = false;
    for (const pn of positiveNegations) {
        if (text.includes(pn)) {
            hasPositiveNegation = true;
            negations.push(pn);
            posCount += 1;
            positiveHits.push(pn);
        }
    }

    // Count positive hits
    for (const word of dict.positive) {
        if (text.includes(word)) {
            // Check if this positive word is negated
            const isNegated = checkNegation(text, word, dict.negation);
            if (isNegated && !hasPositiveNegation) {
                negCount += 1;
                negativeHits.push(`${word}(否定)`);
                negations.push(`${word}→否定`);
            } else {
                posCount += 1;
                positiveHits.push(word);
            }
        }
    }

    // Count negative hits
    for (const word of dict.negative) {
        if (text.includes(word)) {
            // Check if this negative word is negated (double negation = positive)
            const isNegated = checkNegation(text, word, dict.negation);
            if (isNegated) {
                posCount += 0.5; // weaker positive from double negation
                positiveHits.push(`${word}(二重否定)`);
                negations.push(`${word}→二重否定`);
            } else {
                negCount += 1;
                negativeHits.push(word);
            }
        }
    }

    // Apply intensifier boost
    posCount *= intensifierBoost;
    negCount *= intensifierBoost;

    // Calculate score: (pos - neg) / (pos + neg + 3)  → [-1, +1]
    const raw = (posCount - negCount) / (posCount + negCount + 3);
    const score = Math.max(-1, Math.min(1, raw));

    // Confidence based on total hits
    const totalHits = posCount + negCount;
    const confidence = Math.min(1, totalHits / 5);

    return {
        score: Math.round(score * 1000) / 1000,
        confidence: Math.round(confidence * 100) / 100,
        evidence: {
            positiveHits,
            negativeHits,
            negations,
            intensifiers,
        },
    };
}

/** Check if a word is negated in context */
function checkNegation(text: string, word: string, negationWords: string[]): boolean {
    const wordIndex = text.indexOf(word);
    if (wordIndex === -1) return false;

    // Look for negation words within 5 chars after the word
    const afterWord = text.substring(wordIndex + word.length, wordIndex + word.length + 5);
    for (const neg of negationWords) {
        if (neg.length <= 3 && afterWord.includes(neg)) {
            return true;
        }
    }

    // Look for negation words within 3 chars before the word
    const beforeStart = Math.max(0, wordIndex - 3);
    const beforeWord = text.substring(beforeStart, wordIndex);
    for (const neg of negationWords) {
        if (neg.length <= 3 && beforeWord.includes(neg)) {
            return true;
        }
    }

    return false;
}
