'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface Person {
    id: number;
    originalId: string | null;
    name: string;
    _count: { records: number };
}

interface PersonListProps {
    people: Person[];
}

export function PersonList({ people }: PersonListProps) {
    const [search, setSearch] = useState('');

    const filteredPeople = people.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.originalId && p.originalId.includes(search))
    );

    return (
        <div>
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="名前で検索..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3">氏名</th>
                            <th className="px-6 py-3">相談回数</th>
                            <th className="px-6 py-3">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPeople.map((person) => (
                            <tr key={person.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {person.name}
                                </td>
                                <td className="px-6 py-4">
                                    {person._count.records} 件
                                </td>
                                <td className="px-6 py-4">
                                    <a href={`/person/${person.id}`} className="font-medium text-blue-600 hover:underline">
                                        詳細を見る
                                    </a>
                                </td>
                            </tr>
                        ))}
                        {filteredPeople.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                                    該当者が見つかりません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
