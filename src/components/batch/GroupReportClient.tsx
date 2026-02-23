'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Users, FileText, TrendingDown, AlertTriangle, Search,
    ArrowUpRight, Shield, Sparkles, Loader2
} from 'lucide-react';
import type { GroupStats, PhaseData } from '@/types';
import { generateBatchInsightAction } from '@/actions/ai';

export interface AIInsight {
    overall_summary: string;
    hot_topics: { topic: string; description: string; representative_record_ids: string[] }[];
    deltas: { metric: string; change: string }[];
    priority_alerts: { alert: string; representative_record_ids: string[] }[];
}

interface PersonItem {
    id: string;
    name: string;
    riskScore: number;
    riskTier: string;
    _count: { records: number; cases: number };
}

interface Props {
    batchId: string;
    groupName: string;
    stats: GroupStats;
    persons: PersonItem[];
    phases: PhaseData[] | null;
    openCases: { id: string; person: { name: string }; status: string; createdAt: string }[];
    aiInsight: AIInsight | null;
}

const CATEGORY_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6', '#6b7280'];

export default function GroupReportClient({ batchId, groupName, stats, persons, phases, openCases, aiInsight }: Props) {
    const [activeTab, setActiveTab] = useState(aiInsight ? 'ai' : 'trend');
    const [searchQuery, setSearchQuery] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [localInsight, setLocalInsight] = useState<AIInsight | null>(aiInsight);

    const handleGenerateAI = async () => {
        setIsGeneratingAI(true);
        try {
            const res = await generateBatchInsightAction(batchId);
            if (res.success && res.result) {
                setLocalInsight(res.result as unknown as AIInsight);
                setActiveTab('ai');
            } else {
                alert('AIインサイトの生成に失敗しました: ' + res.error);
            }
        } catch (e) {
            console.error(e);
            alert('エラーが発生しました');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const filteredPersons = persons.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const tabs = [
        { id: 'ai', label: 'AIインサイト', icon: <Sparkles size={14} style={{ marginRight: 6 }} /> },
        { id: 'trend', label: '推移' },
        { id: 'category', label: 'カテゴリ' },
        { id: 'keywords', label: 'キーワード' },
        { id: 'phase', label: 'フェーズ' },
        { id: 'unresolved', label: '未解決' },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>バッチ詳細</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{groupName}</h1>
            </div>

            {/* Insights */}
            {stats.insights.length > 0 && (
                <div className="glass-card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.05))' }}>
                    <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--accent-blue)' }}>📊 インサイト</h3>
                    {stats.insights.map((insight, i) => (
                        <p key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.6 }}>{insight}</p>
                    ))}
                </div>
            )}

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                <KpiCard icon={<FileText size={20} />} label="総件数" value={String(stats.totalRecords)} color="var(--accent-blue)" />
                <KpiCard icon={<Users size={20} />} label="対象人数" value={`${stats.totalPersons}名`} color="var(--accent-purple)" />
                <KpiCard icon={<TrendingDown size={20} />} label="平均感情" value={stats.avgSentiment.toFixed(2)} color={stats.avgSentiment < -0.2 ? 'var(--accent-red)' : 'var(--accent-green)'} />
                <KpiCard icon={<AlertTriangle size={20} />} label="赤信号" value={`${stats.redAlertCount}名`} color="var(--accent-red)" />
            </div>

            {/* Tabs */}
            <div className="tab-group" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={tab.id === 'ai' && activeTab === 'ai' ? { background: 'var(--accent-purple)', color: '#fff', borderColor: 'var(--accent-purple)' } : {}}
                        >
                            {tab.icon && tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
                {!localInsight && (
                    <button
                        onClick={handleGenerateAI}
                        disabled={isGeneratingAI}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: 13, background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        {isGeneratingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        バッチ全体のAIインサイトを生成
                    </button>
                )}
            </div>

            {/* Tab content */}
            <div className="glass-card" style={{ marginBottom: 32, minHeight: 400 }}>
                {activeTab === 'ai' && <AITab insight={localInsight} />}
                {activeTab === 'trend' && <TrendTab data={stats.trendData} />}
                {activeTab === 'category' && <CategoryTab distribution={stats.categoryDistribution} />}
                {activeTab === 'keywords' && <KeywordsTab keywords={stats.topKeywords} />}
                {activeTab === 'phase' && <PhaseTab phases={phases} />}
                {activeTab === 'unresolved' && <UnresolvedTab cases={openCases} />}
            </div>

            {/* Person List */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>対象者一覧</h2>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="input-field"
                            style={{ paddingLeft: 36, width: 240 }}
                            placeholder="名前で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>名前</th>
                                <th>リスクスコア</th>
                                <th>リスクティア</th>
                                <th>記録数</th>
                                <th>ケース数</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPersons.map((person) => (
                                <tr key={person.id}>
                                    <td style={{ fontWeight: 600 }}>{person.name}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 60, height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${person.riskScore}%`,
                                                    height: '100%',
                                                    borderRadius: 3,
                                                    background: person.riskTier === 'Red' ? 'var(--accent-red)' : person.riskTier === 'Yellow' ? 'var(--accent-yellow)' : 'var(--accent-green)',
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 13 }}>{person.riskScore}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${person.riskTier.toLowerCase()}`}>
                                            <Shield size={12} />
                                            {person.riskTier}
                                        </span>
                                    </td>
                                    <td>{person._count.records}件</td>
                                    <td>{person._count.cases}件</td>
                                    <td>
                                        <Link href={`/persons/${person.id}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                                            詳細 <ArrowUpRight size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ color }}>{icon}</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
        </div>
    );
}

function TrendTab({ data }: { data: { date: string; count: number }[] }) {
    if (data.length === 0) return <EmptyState message="推移データがありません" />;
    return (
        <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>件数推移</h3>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13 }} />
                    <Line type="monotone" dataKey="count" stroke="var(--accent-blue)" strokeWidth={2} dot={{ fill: 'var(--accent-blue)', r: 4 }} name="件数" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

function CategoryTab({ distribution }: { distribution: { category: string; count: number; percentage: number }[] }) {
    if (distribution.length === 0) return <EmptyState message="カテゴリデータがありません" />;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>カテゴリ別件数</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={distribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                        <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                        <YAxis type="category" dataKey="category" stroke="var(--text-muted)" fontSize={12} width={100} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13 }} />
                        <Bar dataKey="count" name="件数" radius={[0, 4, 4, 0]}>
                            {distribution.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>カテゴリ割合</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                        <Pie
                            data={distribution}
                            dataKey="count"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            label={({ category, percent }: any) => `${category} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                        >
                            {distribution.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13 }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function KeywordsTab({ keywords }: { keywords: { word: string; count: number }[] }) {
    if (keywords.length === 0) return <EmptyState message="キーワードデータがありません" />;
    return (
        <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>キーワード Top 20</h3>
            <ResponsiveContainer width="100%" height={500}>
                <BarChart data={keywords} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis type="category" dataKey="word" stroke="var(--text-muted)" fontSize={12} width={80} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13 }} />
                    <Bar dataKey="count" name="出現数" fill="var(--accent-purple)" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function PhaseTab({ phases }: { phases: PhaseData[] | null }) {
    if (!phases) {
        return (
            <div style={{ textAlign: 'center', padding: 60 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>入社日（startDate）が未設定のためフェーズ分析はできません。</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>個人詳細画面から入社日を設定してください。</p>
            </div>
        );
    }
    return (
        <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>在籍フェーズ別分析</h3>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={phases}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                    <XAxis dataKey="phase" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13 }} />
                    <Bar dataKey="count" name="件数" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgSentiment" name="平均感情" fill="var(--accent-green)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function UnresolvedTab({ cases }: { cases: { id: string; person: { name: string }; status: string; createdAt: string }[] }) {
    const openCases = cases.filter((c) => c.status !== 'Resolved');
    if (openCases.length === 0) return <EmptyState message="未解決ケースはありません 🎉" />;
    return (
        <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>未解決ケース ({openCases.length}件)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {openCases.map((c) => {
                    const days = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000);
                    return (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                            <div>
                                <span style={{ fontWeight: 600, marginRight: 12 }}>{c.person.name}</span>
                                <span className={`badge badge-${c.status === 'Open' ? 'red' : 'yellow'}`}>{c.status}</span>
                            </div>
                            <span style={{ color: days > 7 ? 'var(--accent-red)' : 'var(--text-muted)', fontSize: 13 }}>
                                {days}日経過
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 15 }}>
            {message}
        </div>
    );
}

function AITab({ insight }: { insight: AIInsight | null }) {
    if (!insight) return <EmptyState message="AIインサイトはまだ生成されていません。右上の「生成」ボタンを押してください。" />;

    return (
        <div style={{ padding: 8 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <Sparkles size={20} /> AI バッチインサイト
            </h3>

            <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>📋 全体要約</h4>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-secondary)', padding: '16px', borderRadius: 12 }}>
                    {insight.overall_summary}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
                <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-red)', marginBottom: 12 }}>🚨 重点アラート</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {insight.priority_alerts.length > 0 ? insight.priority_alerts.map((alert, i) => (
                            <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--accent-red)', background: 'rgba(239, 68, 68, 0.05)' }}>
                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{alert.alert}</div>
                                {alert.representative_record_ids?.length > 0 && (
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        代表ID: {alert.representative_record_ids.join(', ')}
                                    </div>
                                )}
                            </div>
                        )) : <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>重点的なアラートはありません</div>}
                    </div>
                </div>

                <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-yellow)', marginBottom: 12 }}>📈 前回からの差分・変化</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {insight.deltas.length > 0 ? insight.deltas.map((delta, i) => (
                            <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 14, fontWeight: 500 }}>{delta.metric}</span>
                                <span style={{ fontSize: 14, color: 'var(--accent-blue)', fontWeight: 700 }}>{delta.change}</span>
                            </div>
                        )) : <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>有意な差分・変化は検出されませんでした</div>}
                    </div>
                </div>
            </div>

            <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 12 }}>🔥 ホットトピック Top 5</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {insight.hot_topics.map((topic, i) => (
                        <div key={i} style={{ padding: 16, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                                {i + 1}. {topic.topic}
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                                {topic.description}
                            </p>
                            {topic.representative_record_ids?.length > 0 && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: 6 }}>
                                    代表ID: {topic.representative_record_ids.join(', ')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
