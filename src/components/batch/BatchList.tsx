'use client';

import { Calendar, Users, FileText, ArrowRight, Filter } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { BatchDeleteButton } from '@/components/batch/BatchDeleteButton';

interface BatchItem {
    id: string;
    uploadDate: Date;
    groupName: string;
    filename: string;
    recordCount: number;
    personCount: number;
}

export function BatchList({ initialBatches }: { initialBatches: BatchItem[] }) {
    const [selectedGroup, setSelectedGroup] = useState<string>('all');

    // Get unique groups
    const uniqueGroups = Array.from(new Set(initialBatches.map(b => b.groupName))).sort();

    // Filter batches
    const filteredBatches = selectedGroup === 'all'
        ? initialBatches
        : initialBatches.filter(b => b.groupName === selectedGroup);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>バッチ履歴</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                        過去のアップロード・解析結果を確認できます
                    </p>
                </div>

                {uniqueGroups.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                        <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
                        <select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: 14,
                                fontWeight: 500,
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">すべての団体 / グループ</option>
                            {uniqueGroups.map(group => (
                                <option key={group} value={group}>{group}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {filteredBatches.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
                    <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
                        {selectedGroup === 'all' ? 'まだデータがありません。' : '条件に一致するデータがありません。'}
                        <Link href="/" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600, marginLeft: 4 }}>
                            アップロードする →
                        </Link>
                    </p>
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>アップロード日時</th>
                                <th>グループ名</th>
                                <th>ファイル名</th>
                                <th>記録数</th>
                                <th>対象者数</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBatches.map((batch) => (
                                <tr key={batch.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Calendar size={14} style={{ color: 'var(--accent-blue)' }} />
                                            {new Date(batch.uploadDate).toLocaleString('ja-JP')}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{batch.groupName}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{batch.filename}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <FileText size={14} style={{ color: 'var(--accent-purple)' }} />
                                            {batch.recordCount}件
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Users size={14} style={{ color: 'var(--accent-green)' }} />
                                            {batch.personCount}名
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <Link
                                                href={`/batches/${batch.id}`}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    color: 'var(--accent-blue)',
                                                    textDecoration: 'none',
                                                    fontWeight: 600,
                                                    fontSize: 13,
                                                }}
                                            >
                                                詳細 <ArrowRight size={14} />
                                            </Link>
                                            <BatchDeleteButton id={batch.id} groupName={batch.groupName} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
