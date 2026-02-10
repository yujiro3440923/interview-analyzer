import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { clsx } from 'clsx';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={clsx(inter.className, "bg-slate-50 text-slate-900 min-h-screen")}>
        <nav className="border-b bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="font-bold text-xl text-blue-600">Interview Analyzer</a>
            <div className="flex gap-4">
              <a href="/" className="text-sm font-medium hover:text-blue-600">Upload</a>
              <a href="/history" className="text-sm font-medium hover:text-blue-600">History</a>
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
