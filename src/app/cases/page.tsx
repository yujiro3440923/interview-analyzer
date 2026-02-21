import { prisma } from '@/lib/db';
import CaseBoardClient from '@/components/case/CaseBoardClient';

export const dynamic = 'force-dynamic';

interface CaseWithRelations {
    id: string;
    status: string;
    owner: string | null;
    nextFollowUpDate: Date | null;
    resolutionNote: string | null;
    createdAt: Date;
    person: { id: string; name: string };
    batch: { groupName: string };
}

export default async function CasesPage() {
    const cases = await prisma.case.findMany({
        include: {
            person: true,
            batch: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    // Explicitly cast to avoid implicit any on map parameters
    const typedCases = cases as unknown as CaseWithRelations[];

    const serialized = typedCases.map((c) => ({
        id: c.id,
        status: c.status,
        owner: c.owner,
        nextFollowUpDate: c.nextFollowUpDate?.toISOString() || null,
        resolutionNote: c.resolutionNote,
        createdAt: c.createdAt.toISOString(),
        person: { id: c.person.id, name: c.person.name },
        batch: { groupName: c.batch.groupName },
    }));

    return <CaseBoardClient cases={serialized} />;
}
