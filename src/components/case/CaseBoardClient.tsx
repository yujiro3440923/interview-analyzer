'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ClipboardList, User, Clock, AlertTriangle, ChevronRight, Filter } from 'lucide-react';
import { updateCaseStatus } from '@/actions/cases';

interface CaseItem {
    id: string;
    status: string;
    owner: string | null;
    nextFollowUpDate: string | null;
    resolutionNote: string | null;
    createdAt: string;
    person: { id: string; name: string };
    batch: { groupName: string };
}

export default function CaseBoardClient({ cases: initialCases }: { cases: CaseItem[] }) {
    const [cases, setCases] = useState(initialCases);
    const [selectedGroup, setSelectedGroup] = useState<string>('all');

    const uniqueGroups = Array.from(new Set(initialCases.map(c => c.batch.groupName))).sort();

    const filteredCases = selectedGroup === 'all'
        ? cases
        : cases.filter((c) => c.batch.groupName === selectedGroup);

    const statuses = ['Open', 'InProgress', 'Pending', 'Resolved'];

    const columns = statuses.map((status) => ({
        status,
        label: status === 'Open' ? '未対応' : status === 'InProgress' ? '対応中' : status === 'Pending' ? '保留' : '解決済み',
        color: status === 'Open' ? 'var(--accent-red)' : status === 'InProgress' ? 'var(--accent-blue)' : status === 'Pending' ? 'var(--accent-yellow)' : 'var(--accent-green)',
        items: filteredCases.filter((c) => c.status === status),
    }));

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                        <ClipboardList size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                        ケースボード
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                        未解決ケースの管理・ステータス更新
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

            {filteredCases.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>ケースがありません</p>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
                    {columns.map((col) => (
                        <div key={col.status} className="kanban-column">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                                <h3 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{col.label}</h3>
                                <span style={{
                                    fontSize: 11, fontWeight: 600, background: 'var(--bg-card)',
                                    padding: '2px 8px', borderRadius: 9999, color: 'var(--text-muted)',
                                }}>
                                    {col.items.length}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {col.items.map((c) => (
                                    <KanbanCard key={c.id} caseItem={c} onStatusChange={(newStatus) => {
                                        setCases((prev) => prev.map((p) => p.id === c.id ? { ...p, status: newStatus } : p));
                                    }} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function KanbanCard({ caseItem, onStatusChange }: { caseItem: CaseItem; onStatusChange: (status: string) => void }) {
    const [isPending, startTransition] = useTransition();
    const statuses = ['Open', 'InProgress', 'Pending', 'Resolved'];
    const days = Math.floor((Date.now() - new Date(caseItem.createdAt).getTime()) / 86400000);

    const handleChange = (newStatus: string) => {
        onStatusChange(newStatus);
        startTransition(async () => {
            await updateCaseStatus(caseItem.id, newStatus as 'Open' | 'InProgress' | 'Pending' | 'Resolved');
        });
    };

    return (
        <div className="kanban-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Link href={`/persons/${caseItem.person.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={14} />
                    {caseItem.person.name}
                    <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                </Link>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {caseItem.batch.groupName}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {[
                        { value: 'Open', label: '未対応', color: 'var(--accent-red)' },
                        { value: 'InProgress', label: '対応中', color: 'var(--accent-blue)' },
                        { value: 'Pending', label: '保留', color: 'var(--accent-yellow)' },
                        { value: 'Resolved', label: '解決済', color: 'var(--accent-green)' }
                    ].map((s) => (
                        <button
                            key={s.value}
                            onClick={() => handleChange(s.value)}
                            disabled={isPending}
                            style={{
                                padding: '4px 8px',
                                fontSize: 11,
                                fontWeight: caseItem.status === s.value ? 700 : 500,
                                color: caseItem.status === s.value ? '#1e293b' : 'var(--text-secondary)',
                                background: caseItem.status === s.value ? s.color : 'transparent',
                                border: `1px solid ${caseItem.status === s.value ? s.color : 'var(--border-color)'}`,
                                borderRadius: 4,
                                cursor: isPending ? 'not-allowed' : 'pointer',
                                opacity: isPending ? 0.5 : 1,
                                transition: 'all 0.2s',
                            }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <span style={{ fontSize: 11, color: days > 7 ? 'var(--accent-red)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {days > 7 && <AlertTriangle size={10} />}
                    <Clock size={10} /> {days}日
                </span>
            </div>

            {caseItem.nextFollowUpDate && (
                <div style={{ fontSize: 11, color: 'var(--accent-yellow)', marginTop: 6 }}>
                    次回フォロー: {new Date(caseItem.nextFollowUpDate).toLocaleDateString('ja-JP')}
                </div>
            )}
        </div>
    );
}
