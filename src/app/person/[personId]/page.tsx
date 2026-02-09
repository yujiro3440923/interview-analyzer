import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { User, Calendar, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: {
        personId: string;
    };
}

async function getPersonData(personId: number) {
    const person = await prisma.person.findUnique({
        where: { id: personId },
        include: {
            records: {
                orderBy: { date: 'desc' }
            },
            batch: true
        }
    });
    return person;
}

export default async function PersonPage(props: PageProps) {
    const params = await props.params;
    const personId = parseInt(params.personId, 10);

    if (isNaN(personId)) return notFound();

    const person = await getPersonData(personId);
    if (!person) return notFound();

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <Link href={`/report/${person.batchId}`} className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                レポートに戻る
            </Link>

            <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{person.name}</h1>
                    <p className="text-slate-500">会員ID: {person.originalId || 'N/A'}</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-sm text-slate-500">総相談回数</p>
                    <p className="text-2xl font-bold text-slate-900">{person.records.length} 回</p>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    タイムライン
                </h2>

                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {person.records.map((record) => (
                        <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <MessageSquare className="w-4 h-4 text-white" />
                            </div>

                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <time className="font-caveat font-medium text-blue-500">
                                        {format(new Date(record.date), 'yyyy/MM/dd')}
                                    </time>
                                    {record.sentimentScore !== null && (
                                        <span className={`text-xs px-2 py-1 rounded-full ${record.sentimentScore >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            Sentiment: {record.sentimentScore.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">相談内容</p>
                                        <p className="text-slate-700">{record.content}</p>
                                    </div>
                                    {record.action && (
                                        <div className="pt-2 border-t border-slate-100">
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">対応・処置</p>
                                            <p className="text-slate-600 italic">{record.action}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
