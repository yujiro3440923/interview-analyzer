import type { UrgencyLevel, CategoryFlags, ThresholdSettings } from '@/types';
import { DEFAULT_THRESHOLDS } from './dictionaries';

/** Determine urgency level based on text content, category, and sentiment */
export function determineUrgency(
    text: string,
    sentimentScore: number,
    categoryFlags: CategoryFlags,
    thresholds: ThresholdSettings = DEFAULT_THRESHOLDS
): UrgencyLevel {
    // Check for HIGH urgency keywords
    for (const keyword of thresholds.urgency.highKeywords) {
        if (text.includes(keyword)) {
            return 'High';
        }
    }

    // Health + strong negative sentiment → High
    if (categoryFlags.health && sentimentScore < -0.3) {
        return 'High';
    }

    // Relationship (harassment/violence indicators) + negative → High
    if (categoryFlags.relationship && sentimentScore < -0.4) {
        return 'High';
    }

    // Check for MEDIUM urgency keywords
    for (const keyword of thresholds.urgency.mediumKeywords) {
        if (text.includes(keyword)) {
            return 'Medium';
        }
    }

    // Negative sentiment → Medium
    if (sentimentScore < -0.2) {
        return 'Medium';
    }

    // Multiple category flags → Medium (complex situation)
    const flagCount = Object.values(categoryFlags).filter(Boolean).length;
    if (flagCount >= 3) {
        return 'Medium';
    }

    return 'Low';
}
