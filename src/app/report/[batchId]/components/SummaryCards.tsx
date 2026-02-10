import { Users, FileText, Smile } from 'lucide-react';

interface SummaryCardsProps {
    totalRecords: number;
    totalPeople: number;
    avgSentiment: number;
}

export function SummaryCards({ totalRecords, totalPeople, avgSentiment }: SummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">Total Consultations</p>
                    <p className="text-2xl font-bold text-slate-900">{totalRecords}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">Active Members</p>
                    <p className="text-2xl font-bold text-slate-900">{totalPeople}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
                <div className={`p-3 rounded-lg ${avgSentiment >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <Smile className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">Avg. Sentiment</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {avgSentiment > 0 ? '+' : ''}{avgSentiment.toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
}
