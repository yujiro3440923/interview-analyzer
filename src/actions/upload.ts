'use server';

import { prisma } from '@/lib/db';
import { parseExcel } from '@/lib/parser/excel';
import { parseCsv } from '@/lib/parser/csv';
import { parseDate } from '@/lib/analysis/normalize';
import { analyzeRecord } from '@/lib/analysis/pipeline';
import { calculateRiskScore } from '@/lib/analysis/risk';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/analysis/dictionaries';

export async function uploadAndAnalyze(formData: FormData): Promise<{ batchId?: string; error?: string }> {
    const file = formData.get('file') as File;
    const groupName = (formData.get('groupName') as string) || 'default';

    if (!file) return { error: 'ファイルが選択されていません' };

    const filename = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const isExcel = /\.xlsx?$/i.test(filename);

    // Load settings for this group
    let settings: AppSettings = DEFAULT_SETTINGS;
    const savedSettings = await prisma.settings.findUnique({ where: { groupName } });
    if (savedSettings) {
        settings = {
            dict: (savedSettings.dict as unknown as AppSettings['dict']) || DEFAULT_SETTINGS.dict,
            sentimentDict: (savedSettings.sentimentDict as unknown as AppSettings['sentimentDict']) || DEFAULT_SETTINGS.sentimentDict,
            thresholds: (savedSettings.thresholds as unknown as AppSettings['thresholds']) || DEFAULT_SETTINGS.thresholds,
            notifications: (savedSettings.notifications as unknown as AppSettings['notifications']) || DEFAULT_SETTINGS.notifications,
        };
    }

    try {
        // Parse file
        console.log(`[Upload] Starting file parse for ${filename}`);
        let parseResult;
        if (isExcel) {
            parseResult = await parseExcel(arrayBuffer);
        } else {
            const buffer = Buffer.from(arrayBuffer);
            const text = buffer.toString('utf-8');
            parseResult = parseCsv(text);
        }
        console.log(`[Upload] Parsed file, found ${parseResult.sheets.length} sheets`);

        // Create batch
        const batch = await prisma.uploadBatch.create({
            data: {
                filename,
                groupName,
                parsingLog: parseResult.errors.length > 0 ? (parseResult.errors as any) : undefined,
            },
        });
        console.log(`[Upload] Created batch record ${batch.id}`);

        // Collect all unique person names
        const personNames = new Set<string>();
        for (const sheet of parseResult.sheets) {
            for (const row of sheet.rows) {
                if (row.name) personNames.add(row.name);
            }
        }

        // Create persons
        const personMap = new Map<string, string>(); // name → personId
        for (const name of personNames) {
            const person = await prisma.person.create({
                data: { name, batchId: batch.id },
            });
            personMap.set(name, person.id);
        }
        console.log(`[Upload] Created ${personMap.size} person records`);

        // Process records
        let recordCount = 0;
        for (const sheet of parseResult.sheets) {
            for (const row of sheet.rows) {
                try {
                    const analysis = await analyzeRecord(row.content, row.action, settings);
                    const date = parseDate(row.date);
                    const personId = row.name ? personMap.get(row.name) || null : null;

                    await prisma.interviewRecord.create({
                        data: {
                            date,
                            staff: row.staff,
                            content: row.content,
                            action: row.action,
                            textAll: analysis.textAll,
                            sentimentScore: analysis.sentiment.score,
                            sentimentConfidence: analysis.sentiment.confidence,
                            sentimentEvidence: analysis.sentiment.evidence as any,
                            urgency: analysis.urgency,
                            categoryMain: analysis.categoryMain,
                            categoryFlags: analysis.categoryFlags as any,
                            keywords: analysis.keywords,
                            personId,
                            batchId: batch.id,
                        },
                    });

                    // Auto-create case for high urgency records
                    if (analysis.urgency === 'High' && personId) {
                        await prisma.case.create({
                            data: {
                                status: 'Open',
                                personId,
                                batchId: batch.id,
                            },
                        });
                    }

                    recordCount++;
                    if (recordCount % 50 === 0) {
                        console.log(`[Upload] Processed ${recordCount} records`);
                    }
                } catch (recordError) {
                    console.error(`[Upload] Failed to process a record at row ${row.rowIndex}:`, recordError);
                }
            }
        }
        console.log(`[Upload] Finished processing ${recordCount} records`);

        // Calculate risk scores for each person
        for (const [, personId] of personMap) {
            const records = await prisma.interviewRecord.findMany({
                where: { personId },
                select: {
                    date: true,
                    sentimentScore: true,
                    categoryMain: true,
                    textAll: true,
                },
            });

            const openCaseCount = await prisma.case.count({
                where: { personId, status: { not: 'Resolved' } },
            });

            const riskResult = calculateRiskScore({
                records: records.map((r: { date: Date | null; sentimentScore: number | null; categoryMain: string | null; textAll: string | null }) => ({
                    date: r.date,
                    sentimentScore: r.sentimentScore,
                    categoryMain: r.categoryMain,
                    textAll: r.textAll,
                })),
                openCaseCount,
                thresholds: settings.thresholds,
            });

            // Try to detect startDate from the earliest record
            const dated = records.filter((r: { date: Date | null }) => r.date != null);
            const sorted = dated.sort((a: { date: Date | null }, b: { date: Date | null }) => (a.date!.getTime()) - (b.date!.getTime()));
            const earliestRecord = sorted[0];

            await prisma.person.update({
                where: { id: personId },
                data: {
                    riskScore: riskResult.score,
                    riskTier: riskResult.tier,
                    riskFactors: riskResult.factors as any,
                    startDate: earliestRecord?.date || null,
                },
            });
        }
        console.log(`[Upload] Calculated risks for all persons`);

        // Update batch counts
        await prisma.uploadBatch.update({
            where: { id: batch.id },
            data: {
                recordCount,
                personCount: personMap.size,
            },
        });

        console.log(`[Upload] Batch ${batch.id}: ${recordCount} records, ${personMap.size} persons for group "${groupName}"`);

        return { batchId: batch.id };
    } catch (globalError) {
        console.error(`[Upload] FATAL ERROR during batch upload:`, globalError);
        return { error: '解析中にサーバーエラーが発生しました（ファイルが破損しているか、対応していない形式の可能性があります）' };
    }
}
