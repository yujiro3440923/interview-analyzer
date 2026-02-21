import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { aggregateGroupStats } from '@/lib/aggregation/group';
import { analyzePhases } from '@/lib/analysis/phase';
import GroupReportClient from '@/components/batch/GroupReportClient';

export const dynamic = 'force-dynamic';

interface BatchRecord {
    date: Date | null;
    sentimentScore: number | null;
    categoryMain: string | null;
    categoryFlags: unknown;
    textAll: string | null;
    urgency: string;
    personId: string | null;
}

interface BatchPerson {
    id: string;
    name: string;
    riskScore: number;
    riskTier: string;
    startDate: Date | null;
    _count: { records: number; cases: number };
}

interface BatchCase {
    id: string;
    status: string;
    createdAt: Date;
    person: { name: string };
}

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const batch = await prisma.uploadBatch.findUnique({
        where: { id },
        include: {
            persons: {
                orderBy: { riskScore: 'desc' },
                include: { _count: { select: { records: true, cases: true } } },
            },
            records: true,
            cases: { include: { person: true } },
        },
    });

    if (!batch) notFound();

    const records = batch.records as BatchRecord[];
    const persons = batch.persons as BatchPerson[];
    const cases = batch.cases as BatchCase[];

    // Aggregate stats
    const recordsForAgg = records.map((r) => ({
        date: r.date,
        sentimentScore: r.sentimentScore,
        categoryMain: r.categoryMain,
        categoryFlags: r.categoryFlags as Record<string, boolean> | null,
        textAll: r.textAll,
        urgency: r.urgency,
    }));

    const personsForAgg = persons.map((p) => ({ riskTier: p.riskTier }));
    const casesForAgg = cases.map((c) => ({ status: c.status }));

    const stats = await aggregateGroupStats(recordsForAgg, personsForAgg, casesForAgg);

    // Phase analysis
    let phases = null;
    const personsWithStart = persons.filter((p) => p.startDate);
    if (personsWithStart.length > 0) {
        const allPhaseRecords = records
            .filter((r) => r.personId && personsWithStart.some((p) => p.id === r.personId))
            .map((r) => {
                const person = personsWithStart.find((p) => p.id === r.personId);
                return {
                    date: r.date,
                    sentimentScore: r.sentimentScore,
                    categoryMain: r.categoryMain,
                    _startDate: person?.startDate || null,
                };
            });

        if (allPhaseRecords.length > 0) {
            const earliest = personsWithStart
                .map((p) => p.startDate!)
                .sort((a, b) => a.getTime() - b.getTime())[0];
            phases = analyzePhases(
                allPhaseRecords.map((r) => ({ date: r.date, sentimentScore: r.sentimentScore, categoryMain: r.categoryMain })),
                earliest
            );
        }
    }

    const openCases = cases
        .filter((c) => c.status !== 'Resolved')
        .map((c) => ({
            id: c.id,
            person: { name: c.person.name },
            status: c.status,
            createdAt: c.createdAt.toISOString(),
        }));

    const personsList = persons.map((p) => ({
        id: p.id,
        name: p.name,
        riskScore: p.riskScore,
        riskTier: p.riskTier,
        _count: p._count,
    }));

    return (
        <GroupReportClient
            batchId={id}
            groupName={batch.groupName}
            stats={stats}
            persons={personsList}
            phases={phases}
            openCases={openCases}
        />
    );
}
