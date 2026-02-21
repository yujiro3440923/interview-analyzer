'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ClipboardList, User, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
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
    const statuses = ['Open', 'InProgress', 'Pending', 'Resolved'];

    const columns = statuses.map((status) => ({
        status,
        label: status === 'Open' ? '未対応' : status === 'InProgress' ? '対応中' : status === 'Pending' ? '保留' : '解決済み',
        color: status === 'Open' ? 'var(--accent-red)' : status === 'InProgress' ? 'var(--accent-blue)' : status === 'Pending' ? 'var(--accent-yellow)' : 'var(--accent-green)',
        items: cases.filter((c) => c.status === status),
    }));

    return (
        <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                <ClipboardList size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                ケースボード
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15 }}>
                未解決ケースの管理・ステータス更新
            </p>

            {cases.length === 0 ? (
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <select
                    value={caseItem.status}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={isPending}
                    style={{
                        background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                        borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 12,
                    }}
                >
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

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
