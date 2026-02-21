import { getSettings, getGroupNames } from '@/actions/settings';
import AdminSettingsClient from '@/components/admin/AdminSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ group?: string }>;
}) {
    const { group } = await searchParams;
    const groupName = group || 'default';
    const settings = await getSettings(groupName);
    const groups = await getGroupNames();

    return <AdminSettingsClient groupName={groupName} settings={settings} groups={groups} />;
}
