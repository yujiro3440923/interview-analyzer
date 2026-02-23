'use server';

import { prisma } from '@/lib/db';
import {
    generateInterviewInsightRaw,
    generateBatchInsightRaw,
    generateInputHash,
    INTERVIEW_PROMPT_VERSION,
    BATCH_PROMPT_VERSION
} from '@/lib/ai/gemini';
import { aggregateGroupStats } from '@/lib/aggregation/group';
import { getSettings } from '@/actions/settings';

export async function generateInterviewInsightAction(recordId: string) {
    // 1. Fetch the record
    const record = await prisma.interviewRecord.findUnique({
        where: { id: recordId },
        include: { aiResult: true, batch: { select: { groupName: true } } }
    });

    if (!record) {
        throw new Error("InterviewRecord not found");
    }

    // Prepare text for AI. If textAll is not available, fallback to content/action.
    const textContext = record.textAll || `[Content]: ${record.content}\n[Action]: ${record.action}`;
    const inputHash = generateInputHash(textContext);

    // If we already have the exact same prompt output logic, skip regenerating
    if (
        record.aiResult &&
        record.aiResult.inputHash === inputHash &&
        record.aiResult.promptVersion === INTERVIEW_PROMPT_VERSION
    ) {
        return { success: true, result: record.aiResult.resultJson, message: 'Already up to date' };
    }

    // Get API Key from settings (fallback to env)
    const settings = await getSettings(record.batch.groupName);
    const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY || '';

    try {
        // 2. Call Gemini
        const resultJson = await generateInterviewInsightRaw(textContext, apiKey);

        // 3. Upsert into database
        const aiResult = await prisma.interviewAIResult.upsert({
            where: { interviewRecordId: recordId },
            create: {
                interviewRecordId: recordId,
                resultJson,
                model: "gemini-2.5-flash",
                promptVersion: INTERVIEW_PROMPT_VERSION,
                temperature: 0,
                topP: 0.95,
                inputHash
            },
            update: {
                resultJson,
                model: "gemini-2.5-flash",
                promptVersion: INTERVIEW_PROMPT_VERSION,
                temperature: 0,
                topP: 0.95,
                inputHash
            }
        });

        return { success: true, result: aiResult.resultJson };
    } catch (e) {
        console.error("AI Generation Error (Interview):", e);
        return { success: false, error: String(e) };
    }
}

export async function generateBatchInsightAction(batchId: string) {
    // 1. Fetch the batch with necessary relations to run `aggregateGroupStats`
    const batch = await prisma.uploadBatch.findUnique({
        where: { id: batchId },
        include: {
            records: true,
            persons: true,
            cases: true,
            aiInsight: true
        }
    });

    if (!batch) {
        throw new Error("Batch not found");
    }

    // 2. Prepare aggregated data for AI
    const recordsForAgg = batch.records.map((r) => ({
        date: r.date,
        sentimentScore: r.sentimentScore,
        categoryMain: r.categoryMain,
        categoryFlags: r.categoryFlags as Record<string, boolean> | null,
        textAll: r.textAll,
        urgency: r.urgency,
    }));

    const personsForAgg = batch.persons.map((p) => ({ riskTier: p.riskTier }));
    const casesForAgg = batch.cases.map((c) => ({ status: c.status }));

    const stats = await aggregateGroupStats(recordsForAgg, personsForAgg, casesForAgg);

    // AI receives this aggregated structure
    const inputContext = JSON.stringify({
        totalRecords: stats.totalRecords,
        totalPersons: stats.totalPersons,
        redAlertCount: stats.redAlertCount,
        yellowAlertCount: stats.yellowAlertCount,
        categoryDistribution: stats.categoryDistribution,
        topKeywords: stats.topKeywords,
    }, null, 2);

    const inputHash = generateInputHash(inputContext);

    if (
        batch.aiInsight &&
        batch.aiInsight.inputHash === inputHash &&
        batch.aiInsight.promptVersion === BATCH_PROMPT_VERSION
    ) {
        return { success: true, result: batch.aiInsight.resultJson, message: 'Already up to date' };
    }

    // Get API Key from settings (fallback to env)
    const settings = await getSettings(batch.groupName);
    const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY || '';

    try {
        // 3. Call Gemini
        const resultJson = await generateBatchInsightRaw(inputContext, apiKey);

        // 4. Upsert into DB
        const aiInsight = await prisma.batchAIInsight.upsert({
            where: { batchId },
            create: {
                batchId,
                resultJson,
                model: "gemini-2.5-flash",
                promptVersion: BATCH_PROMPT_VERSION,
                temperature: 0,
                topP: 0.95,
                inputHash
            },
            update: {
                resultJson,
                model: "gemini-2.5-flash",
                promptVersion: BATCH_PROMPT_VERSION,
                temperature: 0,
                topP: 0.95,
                inputHash
            }
        });

        return { success: true, result: aiInsight.resultJson };
    } catch (e) {
        console.error("AI Generation Error (Batch):", e);
        return { success: false, error: String(e) };
    }
}
