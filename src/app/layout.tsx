import type { Metadata } from 'next';
import './globals.css';
import { clsx } from 'clsx';
// import { Inter } from 'next/font/google';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Interview Analyzer',
  description: 'Analyze interview logs for foreign workers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={clsx("bg-slate-50 text-slate-900 min-h-screen")}>
        <nav className="border-b bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="font-bold text-xl text-blue-600">面談分析くん (Interview Analyzer)</a>
            <div className="flex gap-4">
              <a href="/" className="text-sm font-medium hover:text-blue-600">アップロード</a>
              <a href="/history" className="text-sm font-medium hover:text-blue-600">履歴一覧</a>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
