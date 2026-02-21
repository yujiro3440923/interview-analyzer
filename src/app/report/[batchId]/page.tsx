import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { SummaryCards } from './components/SummaryCards';
import { TrendChart } from './components/TrendChart';
import { KeywordsList } from './components/KeywordsList';
import { PersonList } from './components/PersonList';

interface PageProps {
    params: {
        batchId: string;
    };
}

// Helper to calculate stats
async function getBatchData(batchId: number) {
    const batch = await prisma.uploadBatch.findUnique({
        where: { id: batchId },
        include: {
            records: {
                include: { person: true }
            },
            people: {
                include: { _count: { select: { records: true } } }
            }
        }
    });

    if (!batch) return null;

    const totalRecords = batch.records.length;
    const totalPeople = batch.people.length;

    // Calculate generic sentiment average
    const avgSentiment = batch.records.reduce((acc, r) => acc + (r.sentimentScore || 0), 0) / (totalRecords || 1);

    // Group by month for Trend
    const trendMap = new Map<string, number>();
    batch.records.forEach(r => {
        const key = format(new Date(r.date), 'yyyy-MM');
        trendMap.set(key, (trendMap.get(key) || 0) + 1);
    });
    const trendData = Array.from(trendMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Aggregate Keywords
    const keywordMap = new Map<string, number>();
    batch.records.forEach(r => {
        if (!r.keywords) return;
        try {
            const kws = JSON.parse(r.keywords) as { word: string, count: number }[];
            kws.forEach(k => {
                keywordMap.set(k.word, (keywordMap.get(k.word) || 0) + k.count);
            });
        } catch (e) { }
    });
    const topKeywords = Array.from(keywordMap.entries())
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

    return {
        batch,
        stats: {
            totalRecords,
            totalPeople,
            avgSentiment,
            trendData,
            topKeywords
        }
    };
}

export default async function ReportPage(props: PageProps) {
    const params = await props.params;
    const batchId = parseInt(params.batchId, 10);

    if (isNaN(batchId)) return notFound();

    const data = await getBatchData(batchId);
    if (!data) return notFound();

    const { batch, stats } = data;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{batch.groupName || 'Analysis Report'}</h1>
                    <p className="text-slate-500">Uploaded on {format(new Date(batch.uploadDate), 'PPP')}</p>
                </div>
                <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Analysis Complete
                    </span>
                </div>
            </div>

            <SummaryCards
                totalRecords={stats.totalRecords}
                totalPeople={stats.totalPeople}
                avgSentiment={stats.avgSentiment}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="font-semibold text-lg mb-4">Consultation Trend</h3>
                    <TrendChart data={stats.trendData} />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="font-semibold text-lg mb-4">Frequent Keywords</h3>
                    <KeywordsList keywords={stats.topKeywords} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold text-lg mb-4">Individual Records</h3>
                <PersonList people={batch.people} />
            </div>
        </div>
    );
}
