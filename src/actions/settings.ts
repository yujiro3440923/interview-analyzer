'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/analysis/dictionaries';

export async function getSettings(groupName: string): Promise<AppSettings> {
    const settings = await prisma.settings.findUnique({
        where: { groupName },
    });

    let geminiApiKey = settings?.geminiApiKey || '';

    // API Key Fallback: If not found for the specific group, try to use the 'default' group's key
    if (!geminiApiKey && groupName !== 'default') {
        const defaultSettings = await prisma.settings.findUnique({
            where: { groupName: 'default' },
            select: { geminiApiKey: true }
        });
        geminiApiKey = defaultSettings?.geminiApiKey || '';
    }

    if (!settings) {
        return {
            ...DEFAULT_SETTINGS,
            geminiApiKey
        };
    }

    return {
        dict: (settings.dict as unknown as AppSettings['dict']) || DEFAULT_SETTINGS.dict,
        sentimentDict: (settings.sentimentDict as unknown as AppSettings['sentimentDict']) || DEFAULT_SETTINGS.sentimentDict,
        thresholds: (settings.thresholds as unknown as AppSettings['thresholds']) || DEFAULT_SETTINGS.thresholds,
        notifications: (settings.notifications as unknown as AppSettings['notifications']) || DEFAULT_SETTINGS.notifications,
        geminiApiKey,
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
            geminiApiKey: settings.geminiApiKey || null,
        },
        update: {
            dict: settings.dict as any,
            sentimentDict: settings.sentimentDict as any,
            thresholds: settings.thresholds as any,
            notifications: settings.notifications as any,
            geminiApiKey: settings.geminiApiKey || null,
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
