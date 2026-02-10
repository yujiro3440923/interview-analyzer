'use client';

interface KeywordsListProps {
    keywords: { word: string; count: number }[];
}

export function KeywordsList({ keywords }: KeywordsListProps) {
    if (!keywords || keywords.length === 0) {
        return <div className="h-64 flex items-center justify-center text-slate-400">No keywords found</div>;
    }

    const maxCount = Math.max(...keywords.map(k => k.count), 1);

    return (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {keywords.map((k, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <span className="w-24 text-sm font-medium text-slate-700 truncate" title={k.word}>{k.word}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(k.count / maxCount) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">{k.count}</span>
                </div>
            ))}
        </div>
    );
}
