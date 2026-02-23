import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { generatePersonInsight } from '@/lib/analysis/insight';
import PersonDetailClient from '@/components/person/PersonDetailClient';
import type { RiskFactor, SentimentEvidence } from '@/types';

export const dynamic = 'force-dynamic';

interface PersonRecord {
    id: string;
    date: Date | null;
    staff: string | null;
    content: string | null;
    action: string | null;
    sentimentScore: number | null;
    sentimentEvidence: unknown;
    urgency: string;
    categoryMain: string | null;
    aiResult?: any | null;
}

interface PersonCase {
    id: string;
    status: string;
    owner: string | null;
    nextFollowUpDate: Date | null;
    resolutionNote: string | null;
    createdAt: Date;
}

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const person = await prisma.person.findUnique({
        where: { id },
        include: {
            records: { include: { aiResult: true }, orderBy: { date: 'desc' } },
            cases: { orderBy: { createdAt: 'desc' } },
        },
    });

    if (!person) notFound();

    const records = person.records as PersonRecord[];
    const cases = person.cases as PersonCase[];

    const openCases = cases.filter((c) => c.status !== 'Resolved').length;

    const topCategoryMap = new Map<string, number>();
    for (const r of records) {
        if (r.categoryMain) topCategoryMap.set(r.categoryMain, (topCategoryMap.get(r.categoryMain) || 0) + 1);
    }
    const topCategory = Array.from(topCategoryMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';

    const avgSentiment = records.filter((r) => r.sentimentScore != null).length > 0
        ? records.filter((r) => r.sentimentScore != null).reduce((a, r) => a + r.sentimentScore!, 0) / records.filter((r) => r.sentimentScore != null).length
        : 0;

    const insight = generatePersonInsight({
        name: person.name,
        riskScore: person.riskScore,
        riskTier: person.riskTier,
        avgSentiment,
        recordCount: records.length,
        openCases,
        topCategory,
    });

    return (
        <PersonDetailClient
            person={{
                id: person.id,
                name: person.name,
                riskScore: person.riskScore,
                riskTier: person.riskTier,
                riskFactors: (person.riskFactors as RiskFactor[] | null) || null,
                startDate: person.startDate?.toISOString() || null,
            }}
            records={records.map((r) => ({
                id: r.id,
                date: r.date?.toISOString() || null,
                staff: r.staff,
                content: r.content,
                action: r.action,
                sentimentScore: r.sentimentScore,
                urgency: r.urgency,
                categoryMain: r.categoryMain,
                sentimentEvidence: r.sentimentEvidence as SentimentEvidence | null,
                aiResult: r.aiResult?.resultJson as any,
            }))}
            cases={cases.map((c) => ({
                id: c.id,
                status: c.status,
                owner: c.owner,
                nextFollowUpDate: c.nextFollowUpDate?.toISOString() || null,
                resolutionNote: c.resolutionNote,
                createdAt: c.createdAt.toISOString(),
            }))}
            insight={insight}
        />
    );
}
