'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteBatch } from '@/actions/batch';

export function BatchDeleteButton({ id, groupName }: { id: string; groupName: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(`「${groupName}」のバッチデータを削除しますか？\n関連するレコードもすべて削除されます。`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteBatch(id);
            router.refresh();
        } catch (error) {
            alert(error instanceof Error ? error.message : '削除に失敗しました');
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-red)',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.5 : 1,
                padding: '8px',
                borderRadius: '8px',
                transition: 'background 0.2s',
            }}
            title="削除"
            className="hover:bg-[rgba(239,68,68,0.1)]"
        >
            <Trash2 size={16} />
        </button>
    );
}
