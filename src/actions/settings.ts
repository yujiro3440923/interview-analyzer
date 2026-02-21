'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/analysis/dictionaries';

export async function getSettings(groupName: string): Promise<AppSettings> {
    const settings = await prisma.settings.findUnique({
        where: { groupName },
    });

    if (!settings) return DEFAULT_SETTINGS;

    return {
        dict: (settings.dict as unknown as AppSettings['dict']) || DEFAULT_SETTINGS.dict,
        sentimentDict: (settings.sentimentDict as unknown as AppSettings['sentimentDict']) || DEFAULT_SETTINGS.sentimentDict,
        thresholds: (settings.thresholds as unknown as AppSettings['thresholds']) || DEFAULT_SETTINGS.thresholds,
        notifications: (settings.notifications as unknown as AppSettings['notifications']) || DEFAULT_SETTINGS.notifications,
    };
}

export async function saveSettings(groupName: string, settings: AppSettings) {
    await prisma.settings.upsert({
        where: { groupName },
        create: {
            groupName,
            dict: settings.dict as any,
            sentimentDict: settings.sentimentDict as any,
            thresholds: settings.thresholds as any,
            notifications: settings.notifications as any,
        },
        update: {
            dict: settings.dict as any,
            sentimentDict: settings.sentimentDict as any,
            thresholds: settings.thresholds as any,
            notifications: settings.notifications as any,
        },
    });

    revalidatePath('/admin/settings');
}

export async function getGroupNames(): Promise<string[]> {
    const batches = await prisma.uploadBatch.findMany({
        select: { groupName: true },
        distinct: ['groupName'],
    });
    return batches.map((b: { groupName: string }) => b.groupName);
}
