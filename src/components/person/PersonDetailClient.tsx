'use client';

import { useState, useTransition } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Shield, AlertTriangle, Clock, Calendar, User, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import { updateCaseStatus } from '@/actions/cases';

interface Record {
    id: string;
    date: string | null;
    staff: string | null;
    content: string | null;
    action: string | null;
    sentimentScore: number | null;
    urgency: string;
    categoryMain: string | null;
    sentimentEvidence: { positiveHits: string[]; negativeHits: string[] } | null;
}

interface Case {
    id: string;
    status: string;
    owner: string | null;
    nextFollowUpDate: string | null;
    resolutionNote: string | null;
    createdAt: string;
}

interface Props {
    person: {
        id: string; name: string; riskScore: number; riskTier: string;
        riskFactors: { name: string; value: number; description: string }[] | null;
        startDate: string | null;
    };
    records: Record[];
    cases: Case[];
    insight: string;
}

export default function PersonDetailClient({ person, records, cases, insight }: Props) {
    const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

    // Sentiment trend
    const sentimentData = records
        .filter((r) => r.date && r.sentimentScore != null)
        .map((r) => ({
            date: r.date!.split('T')[0],
            score: r.sentimentScore!,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                        <User size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                        {person.name}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 600, lineHeight: 1.6 }}>{insight}</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="kpi-card" style={{ minWidth: 120, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>リスクスコア</div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: person.riskTier === 'Red' ? 'var(--accent-red)' : person.riskTier === 'Yellow' ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>
                            {person.riskScore}
                        </div>
                    </div>
                    <div className="kpi-card" style={{ minWidth: 120, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>リスクティア</div>
                        <span className={`badge badge-${person.riskTier.toLowerCase()}`} style={{ fontSize: 16, padding: '8px 16px' }}>
                            <Shield size={16} />
                            {person.riskTier}
                        </span>
                    </div>
                    <div className="kpi-card" style={{ minWidth: 120, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>未解決ケース</div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: cases.filter((c) => c.status !== 'Resolved').length > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                            {cases.filter((c) => c.status !== 'Resolved').length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Factors */}
            {person.riskFactors && person.riskFactors.length > 0 && (
                <div className="glass-card" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🔍 リスク要因</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        {person.riskFactors.map((f, i) => (
                            <div key={i} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{f.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                                        <div style={{ width: `${f.value}%`, height: '100%', background: f.value > 60 ? 'var(--accent-red)' : f.value > 30 ? 'var(--accent-yellow)' : 'var(--accent-green)' }} />
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{Math.round(f.value)}</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{f.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sentiment Chart */}
            {sentimentData.length > 0 && (
                <div className="glass-card" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📈 感情スコア推移</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={sentimentData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                            <YAxis domain={[-1, 1]} stroke="var(--text-muted)" fontSize={11} />
                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13 }} />
                            <Line type="monotone" dataKey="score" stroke="var(--accent-blue)" strokeWidth={2} dot={{ fill: 'var(--accent-blue)', r: 4 }} name="感情スコア" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Cases */}
            {cases.length > 0 && (
                <div className="glass-card" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📋 ケース管理</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {cases.map((c) => (
                            <CaseCard key={c.id} caseItem={c} />
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📝 面談タイムライン</h3>
                <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {records.map((record) => (
                        <div key={record.id} className="timeline-card" onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                        <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                                        {record.date ? new Date(record.date).toLocaleDateString('ja-JP') : '日付不明'}
                                    </span>
                                    {record.staff && (
                                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                            <User size={12} style={{ display: 'inline', marginRight: 4 }} />
                                            {record.staff}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {record.categoryMain && (
                                        <span className="badge badge-blue" style={{ fontSize: 11 }}>{record.categoryMain}</span>
                                    )}
                                    <span className={`badge urgency-${record.urgency.toLowerCase()}`} style={{ fontSize: 11 }}>
                                        {record.urgency === 'High' && <AlertTriangle size={10} />}
                                        {record.urgency}
                                    </span>
                                    {record.sentimentScore != null && (
                                        <span style={{ fontSize: 12, fontWeight: 600, color: record.sentimentScore < -0.2 ? 'var(--accent-red)' : record.sentimentScore > 0.2 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                                            {record.sentimentScore.toFixed(2)}
                                        </span>
                                    )}
                                    {expandedRecord === record.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            </div>

                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                <MessageSquare size={12} style={{ display: 'inline', marginRight: 6 }} />
                                {(record.content || '').slice(0, expandedRecord === record.id ? undefined : 100)}
                                {!expandedRecord && (record.content || '').length > 100 && '...'}
                            </p>

                            {expandedRecord === record.id && (
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                                    {record.action && (
                                        <div style={{ marginBottom: 8 }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-green)' }}>対応: </span>
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{record.action}</span>
                                        </div>
                                    )}
                                    {record.sentimentEvidence && (
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {record.sentimentEvidence.positiveHits?.length > 0 && (
                                                <span style={{ color: 'var(--accent-green)', marginRight: 12 }}>
                                                    ポジティブ: {record.sentimentEvidence.positiveHits.join(', ')}
                                                </span>
                                            )}
                                            {record.sentimentEvidence.negativeHits?.length > 0 && (
                                                <span style={{ color: 'var(--accent-red)' }}>
                                                    ネガティブ: {record.sentimentEvidence.negativeHits.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function CaseCard({ caseItem }: { caseItem: Case }) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState(caseItem.status);
    const statuses = ['Open', 'InProgress', 'Pending', 'Resolved'];

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        startTransition(async () => {
            await updateCaseStatus(caseItem.id, newStatus as 'Open' | 'InProgress' | 'Pending' | 'Resolved');
        });
    };

    const days = Math.floor((Date.now() - new Date(caseItem.createdAt).getTime()) / 86400000);

    return (
        <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {[
                            { value: 'Open', label: '未対応', color: 'var(--accent-red)' },
                            { value: 'InProgress', label: '対応中', color: 'var(--accent-blue)' },
                            { value: 'Pending', label: '保留', color: 'var(--accent-yellow)' },
                            { value: 'Resolved', label: '解決済', color: 'var(--accent-green)' }
                        ].map((s) => (
                            <button
                                key={s.value}
                                onClick={() => handleStatusChange(s.value)}
                                disabled={isPending}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: 12,
                                    fontWeight: status === s.value ? 700 : 500,
                                    color: status === s.value ? '#1e293b' : 'var(--text-secondary)',
                                    background: status === s.value ? s.color : 'transparent',
                                    border: `1px solid ${status === s.value ? s.color : 'var(--border-color)'}`,
                                    borderRadius: 6,
                                    cursor: isPending ? 'not-allowed' : 'pointer',
                                    opacity: isPending ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    {caseItem.owner && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>担当: {caseItem.owner}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {days}日経過
                    </span>
                    {caseItem.nextFollowUpDate && (
                        <span style={{ fontSize: 12, color: 'var(--accent-yellow)' }}>
                            次回: {new Date(caseItem.nextFollowUpDate).toLocaleDateString('ja-JP')}
                        </span>
                    )}
                </div>
            </div>
            {caseItem.resolutionNote && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>{caseItem.resolutionNote}</p>
            )}
        </div>
    );
}
