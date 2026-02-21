'use client';

import { useState, useTransition } from 'react';
import { Settings, Save, RefreshCcw } from 'lucide-react';
import { saveSettings } from '@/actions/settings';
import type { AppSettings } from '@/types';

interface Props {
    groupName: string;
    settings: AppSettings;
    groups: string[];
}

export default function AdminSettingsClient({ groupName: initialGroup, settings: initialSettings, groups }: Props) {
    const [groupName, setGroupName] = useState(initialGroup);
    const [settings, setSettings] = useState<AppSettings>(initialSettings);
    const [activeSection, setActiveSection] = useState('category');
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        startTransition(async () => {
            await saveSettings(groupName, settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        });
    };

    const sections = [
        { id: 'category', label: 'カテゴリ辞書' },
        { id: 'sentiment', label: '感情辞書' },
        { id: 'thresholds', label: '閾値設定' },
        { id: 'notifications', label: '通知設定' },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                        <Settings size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                        管理設定
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>辞書・閾値・通知設定の管理</p>
                </div>
                <button className="btn-primary" onClick={handleSave} disabled={isPending}>
                    {isPending ? <RefreshCcw size={16} className="spin" /> : <Save size={16} />}
                    <span style={{ marginLeft: 8 }}>{saved ? '保存しました ✓' : '保存'}</span>
                </button>
            </div>

            {/* Group selector */}
            <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    グループ名
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        className="input-field"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        style={{ maxWidth: 300 }}
                    />
                    {groups.length > 0 && (
                        <select
                            className="input-field"
                            style={{ maxWidth: 200 }}
                            value=""
                            onChange={(e) => { if (e.target.value) setGroupName(e.target.value); }}
                        >
                            <option value="">既存グループ...</option>
                            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                    )}
                </div>
            </div>

            {/* Section tabs */}
            <div className="tab-group" style={{ marginBottom: 24 }}>
                {sections.map((s) => (
                    <button key={s.id} className={`tab-btn ${activeSection === s.id ? 'active' : ''}`} onClick={() => setActiveSection(s.id)}>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Section content */}
            <div className="glass-card">
                {activeSection === 'category' && (
                    <CategoryDictEditor
                        dict={settings.dict}
                        onChange={(dict) => setSettings({ ...settings, dict })}
                    />
                )}
                {activeSection === 'sentiment' && (
                    <SentimentDictEditor
                        dict={settings.sentimentDict}
                        onChange={(sentimentDict) => setSettings({ ...settings, sentimentDict })}
                    />
                )}
                {activeSection === 'thresholds' && (
                    <ThresholdsEditor
                        thresholds={settings.thresholds}
                        onChange={(thresholds) => setSettings({ ...settings, thresholds })}
                    />
                )}
                {activeSection === 'notifications' && (
                    <NotificationsEditor
                        notifications={settings.notifications}
                        onChange={(notifications) => setSettings({ ...settings, notifications })}
                    />
                )}
            </div>
        </div>
    );
}

function CategoryDictEditor({ dict, onChange }: { dict: AppSettings['dict']; onChange: (d: AppSettings['dict']) => void }) {
    const categories = Object.keys(dict);
    const [editing, setEditing] = useState(categories[0] || '');

    return (
        <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>カテゴリ辞書</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>各カテゴリに含まれるキーワードを編集できます（カンマ区切り）</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {categories.map((cat) => (
                    <button key={cat} className={`tab-btn ${editing === cat ? 'active' : ''}`} onClick={() => setEditing(cat)} style={{ fontSize: 12 }}>
                        {cat}
                    </button>
                ))}
            </div>
            {editing && (
                <textarea
                    className="input-field"
                    rows={6}
                    value={dict[editing]?.join(', ') || ''}
                    onChange={(e) => {
                        const words = e.target.value.split(/[,、]/).map((w) => w.trim()).filter(Boolean);
                        onChange({ ...dict, [editing]: words });
                    }}
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
            )}
        </div>
    );
}

function SentimentDictEditor({ dict, onChange }: { dict: AppSettings['sentimentDict']; onChange: (d: AppSettings['sentimentDict']) => void }) {
    const fields = [
        { key: 'positive' as const, label: 'ポジティブ語' },
        { key: 'negative' as const, label: 'ネガティブ語' },
        { key: 'negation' as const, label: '否定語' },
        { key: 'intensifier' as const, label: '強調語' },
    ];

    return (
        <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>感情辞書</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {fields.map((f) => (
                    <div key={f.key}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                        <textarea
                            className="input-field"
                            rows={3}
                            value={dict[f.key].join(', ')}
                            onChange={(e) => {
                                const words = e.target.value.split(/[,、]/).map((w) => w.trim()).filter(Boolean);
                                onChange({ ...dict, [f.key]: words });
                            }}
                            style={{ fontFamily: 'monospace', fontSize: 13 }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

function ThresholdsEditor({ thresholds, onChange }: { thresholds: AppSettings['thresholds']; onChange: (t: AppSettings['thresholds']) => void }) {
    return (
        <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>閾値設定</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        Yellow閾値 (RiskScore)
                    </label>
                    <input
                        className="input-field"
                        type="number"
                        value={thresholds.riskTier.yellow}
                        onChange={(e) => onChange({
                            ...thresholds,
                            riskTier: { ...thresholds.riskTier, yellow: Number(e.target.value) },
                        })}
                    />
                </div>
                <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        Red閾値 (RiskScore)
                    </label>
                    <input
                        className="input-field"
                        type="number"
                        value={thresholds.riskTier.red}
                        onChange={(e) => onChange({
                            ...thresholds,
                            riskTier: { ...thresholds.riskTier, red: Number(e.target.value) },
                        })}
                    />
                </div>
            </div>

            <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    高緊急度キーワード（カンマ区切り）
                </label>
                <textarea
                    className="input-field"
                    rows={3}
                    value={thresholds.urgency.highKeywords.join(', ')}
                    onChange={(e) => {
                        const words = e.target.value.split(/[,、]/).map((w) => w.trim()).filter(Boolean);
                        onChange({ ...thresholds, urgency: { ...thresholds.urgency, highKeywords: words } });
                    }}
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
            </div>
        </div>
    );
}

function NotificationsEditor({ notifications, onChange }: { notifications: AppSettings['notifications']; onChange: (n: AppSettings['notifications']) => void }) {
    return (
        <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>通知設定</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ fontSize: 14, fontWeight: 600 }}>通知を有効にする</label>
                    <button
                        onClick={() => onChange({ ...notifications, enabled: !notifications.enabled })}
                        style={{
                            width: 48, height: 24, borderRadius: 12, border: 'none',
                            background: notifications.enabled ? 'var(--accent-blue)' : 'var(--border-color)',
                            cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                        }}
                    >
                        <div style={{
                            width: 18, height: 18, borderRadius: '50%', background: 'white',
                            position: 'absolute', top: 3,
                            left: notifications.enabled ? 27 : 3,
                            transition: 'left 0.2s',
                        }} />
                    </button>
                </div>
                <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>通知先メール</label>
                    <input
                        className="input-field"
                        type="email"
                        value={notifications.email}
                        onChange={(e) => onChange({ ...notifications, email: e.target.value })}
                        placeholder="admin@example.com"
                        style={{ maxWidth: 360 }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={notifications.triggerOnRed}
                            onChange={(e) => onChange({ ...notifications, triggerOnRed: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: 'var(--accent-blue)' }}
                        />
                        Red判定時に通知
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={notifications.triggerOnHighUrgency}
                            onChange={(e) => onChange({ ...notifications, triggerOnHighUrgency: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: 'var(--accent-blue)' }}
                        />
                        高緊急度時に通知
                    </label>
                </div>
            </div>
        </div>
    );
}
