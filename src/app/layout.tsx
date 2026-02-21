import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Upload, History, LayoutDashboard, Settings, ClipboardList } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Interview Analyzer — 面談ログ解析システム',
  description: '外国人労働者面談ログを自動解析し、リスク管理・傾向分析を支援するシステム',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar */}
          <nav style={{
            width: 240,
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            padding: '24px 0',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 50,
          }}>
            <div style={{ padding: '0 20px', marginBottom: 32 }}>
              <h1 style={{
                fontSize: 18,
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}>
                Interview Analyzer
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                面談ログ解析システム
              </p>
            </div>

            <NavLink href="/" icon={<Upload size={18} />} label="アップロード" />
            <NavLink href="/batches" icon={<History size={18} />} label="バッチ履歴" />
            <NavLink href="/cases" icon={<ClipboardList size={18} />} label="ケースボード" />
            <NavLink href="/admin/settings" icon={<Settings size={18} />} label="管理設定" />

            <div style={{ flex: 1 }} />
            <div style={{ padding: '0 20px', fontSize: 11, color: 'var(--text-muted)' }}>
              v1.0.0 MVP
            </div>
          </nav>

          {/* Main content */}
          <main style={{
            flex: 1,
            marginLeft: 240,
            padding: '32px 40px',
            minHeight: '100vh',
          }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: 500,
        transition: 'all 0.15s',
      }}
      className="hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
    >
      {icon}
      {label}
    </Link>
  );
}
