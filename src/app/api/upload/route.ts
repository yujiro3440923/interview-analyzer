import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseInterviewLog } from '@/lib/parser';
import { analyzeText, extractKeywordsGlobal, performBatchAnalysis } from '@/lib/analyzer';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. Parse Excel
        const rows = await parseInterviewLog(buffer, file.name);

        if (rows.length === 0) {
            return NextResponse.json({ error: 'No valid rows found in Excel' }, { status: 400 });
        }

        // 2. Create Upload Batch
        const batch = await prisma.uploadBatch.create({
            data: {
                filename: file.name,
                groupName: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            },
        });

        // 3. Process each row & Analyze
        const processedRows = [];
        const allDocTokens: string[][] = [];

        // Temporary map to track people in this batch
        const personMap = new Map<string, number>(); // Name -> PersonID

        for (const row of rows) {
            // Analyze text
            const contentAnalysis = await analyzeText(row.content);
            const actionAnalysis = await analyzeText(row.action);

            // Combine tokens for topic modeling
            const combinedTokens = [...contentAnalysis.tokens, ...actionAnalysis.tokens];
            if (combinedTokens.length > 0) {
                allDocTokens.push(combinedTokens);
            }

            processedRows.push({
                row,
                contentAnalysis,
                actionAnalysis
            });
        }

        // 4. Batch Analysis (Topics, Global Keywords)
        // LDA expects documents as space-separated strings
        const ldaDocs = allDocTokens.map(tokens => tokens.join(' '));
        // Run LDA on the whole batch
        // We can't easily map LDA topics back to individual docs with the simple 'lda' lib 
        // without more work, but for MVP we can just extract global topics.
        // For individual topics, we might need a per-doc topic inference or just use keyword overlap.

        // For MVP, let's just save global keywords/topics to the Batch? 
        // Or we can try to estimate topics per person later.

        // Let's create People and Records
        for (const item of processedRows) {
            let personId = personMap.get(item.row.name);

            if (!personId) {
                const person = await prisma.person.create({
                    data: {
                        name: item.row.name,
                        batchId: batch.id,
                        originalId: String(item.row.rowNumber)
                    }
                });
                personId = person.id;
                personMap.set(item.row.name, personId);
            }

            // Keywords for this record (simple frequency)
            const recordKeywords = extractKeywordsGlobal([item.contentAnalysis.tokens]).slice(0, 5);

            await prisma.interviewRecord.create({
                data: {
                    date: item.row.date || new Date(), // Fallback to now if null
                    content: item.row.content,
                    action: item.row.action,
                    sentimentScore: item.contentAnalysis.sentimentScore,
                    topics: JSON.stringify([]), // To be filled if we do per-doc topic inference
                    keywords: JSON.stringify(recordKeywords),
                    personId: personId,
                    batchId: batch.id
                }
            });
        }

        // Global stats could be calculated here and returned, or computed on read.

        return NextResponse.json({ success: true, batchId: batch.id, count: rows.length });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
