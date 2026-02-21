'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteBatch(batchId: string) {
    if (!batchId) {
        throw new Error('バッチIDが指定されていません');
    }

    try {
        await prisma.uploadBatch.delete({
            where: { id: batchId },
        });

        revalidatePath('/batches');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete batch:', error);
        throw new Error('バッチの削除に失敗しました');
    }
}
