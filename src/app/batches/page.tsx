import { prisma } from '@/lib/db';
import { BatchList } from '@/components/batch/BatchList';

export const dynamic = 'force-dynamic';

interface BatchItem {
    id: string;
    uploadDate: Date;
    groupName: string;
    filename: string;
    recordCount: number;
    personCount: number;
}

export default async function BatchHistoryPage() {
    const batches: BatchItem[] = await prisma.uploadBatch.findMany({
        orderBy: { uploadDate: 'desc' },
    });

    return <BatchList initialBatches={batches} />;
}
