'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { CaseStatus } from '@/types';

export async function updateCaseStatus(
    caseId: string,
    status: CaseStatus,
    data?: { owner?: string; nextFollowUpDate?: string; resolutionNote?: string }
) {
    await prisma.case.update({
        where: { id: caseId },
        data: {
            status,
            ...(data?.owner && { owner: data.owner }),
            ...(data?.nextFollowUpDate && { nextFollowUpDate: new Date(data.nextFollowUpDate) }),
            ...(data?.resolutionNote && { resolutionNote: data.resolutionNote }),
        },
    });

    revalidatePath('/cases');
    revalidatePath('/persons');
}

export async function createCase(personId: string, batchId: string) {
    const newCase = await prisma.case.create({
        data: {
            status: 'Open',
            personId,
            batchId,
        },
    });

    revalidatePath('/cases');
    revalidatePath(`/persons/${personId}`);
    return newCase;
}

export async function getCases(batchId?: string) {
    return prisma.case.findMany({
        where: batchId ? { batchId } : undefined,
        include: {
            person: true,
            batch: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}
