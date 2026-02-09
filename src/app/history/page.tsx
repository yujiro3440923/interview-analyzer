import prisma from '@/lib/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileText, Users, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
    const batches = await prisma.uploadBatch.findMany({
        orderBy: { uploadDate: 'desc' },
        include: {
            _count: {
                select: { records: true, people: true }
            }
        }
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">解析履歴</h1>

            <div className="grid gap-4">
                {batches.map((batch) => (
                    <Link key={batch.id} href={`/report/${batch.id}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border group-hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                        {batch.groupName || batch.filename}
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">{batch.filename}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center text-slate-500 text-sm gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {format(new Date(batch.uploadDate), 'yyyy/MM/dd HH:mm')}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-6 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    <span>{batch._count.records} 件の相談</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-purple-500" />
                                    <span>{batch._count.people} 人</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {batches.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">履歴が見つかりません。</p>
                        <Link href="/" className="text-blue-600 font-medium hover:underline mt-2 inline-block">
                            最初のファイルをアップロードする
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
