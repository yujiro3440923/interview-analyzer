/**
 * Sample CSV data generator for Interview Analyzer
 * Run: npx tsx scripts/generate-sample.ts > sample-data.csv
 */

const names = [
    'グエン・バン・ミン', 'トラン・ティ・フォン', 'レ・バン・ドゥック',
    'ファム・ティ・ラン', 'ブイ・バン・タン', 'ダン・ティ・ハー',
    'ホアン・バン・ロン', 'ヴォー・ティ・マイ', 'ゴ・バン・クオック',
    'チャン・ティ・トゥイ', 'ハー・バン・ソン', 'リュウ・ティ・リエン',
];

const staff = ['田中', '佐藤', '鈴木', '高橋', '渡辺'];

const contentTemplates = [
    { content: '在留資格の更新手続きについて相談したい。書類の準備が不安。', action: '必要書類のリストを説明し、次回の面談で一緒に確認することにした。' },
    { content: '職場の上司に怒られることが多く、ストレスを感じている。日本語がうまく伝わらないせいだと思う。', action: '上司との関係について詳しく聞き取り。通訳を交えた面談を提案。' },
    { content: '最近、頭痛がひどく、夜も眠れない日が続いている。', action: '近くの病院を紹介し、受診を勧めた。翌週に状況確認の連絡をする。' },
    { content: '給料が契約と違う気がする。残業代が正しく計算されていない。', action: '給与明細を確認し、会社の担当者に問い合わせることにした。' },
    { content: '家族に会いたい。ホームシックがひどくなってきた。', action: '一時帰国の制度について説明。同国出身の仲間との交流を提案。' },
    { content: '日本語の勉強を頑張っている。N3に合格したい。', action: '日本語教室の情報を提供。学習計画の相談にのった。前向きな姿勢を評価。' },
    { content: '寮の隣の部屋がうるさくて困っている。何度言っても改善されない。', action: '寮の管理者に連絡し、改善を要請した。経過観察。' },
    { content: '仕事の内容が聞いていたものと違う。危険な作業をさせられている。', action: '安全管理の状況を確認。労働条件の再確認を会社に要請。' },
    { content: '同僚にいじめられている。無視されたり、からかわれたりする。', action: '具体的な状況を詳しく聞き取り。会社の人事に報告・対応を依頼。' },
    { content: 'ビザの期限が近づいている。更新の手続きがわからない。', action: '入管への申請手続きを一緒に確認。必要書類の準備を手伝う。' },
    { content: '体調は良好。仕事にも慣れてきた。日本の生活が楽しい。', action: '良好な適応状況を確認。引き続きサポートを継続。' },
    { content: '宗教的な食事制限があるが、職場の食堂では対応してもらえない。', action: '会社の食堂担当者にハラル対応について相談。近くのハラル食材店を紹介。' },
    { content: '銀行口座の開設方法がわからない。送金もしたい。', action: '銀行口座開設の手続きを説明。送金サービスの情報を提供。' },
    { content: '健康診断で要再検査と言われたが、病院の予約の仕方がわからない。', action: '病院に同行して予約を手伝った。結果が出たら報告してもらう。' },
    { content: '仕事はとても順調。上司からも評価されている。技能実習の目標に向けて頑張りたい。', action: '良好な状況を確認。技能検定の準備について情報提供。' },
    { content: '同僚との人間関係がとても良い。休日も一緒に遊んでいる。', action: '良好な関係を確認。地域のイベント情報を共有。' },
    { content: '腰痛がひどくなってきた。重い荷物を持つ仕事が原因だと思う。', action: '労災の可能性について説明。会社に作業の見直しを要請。病院受診を勧めた。' },
    { content: '精神的に限界を感じている。毎日がとてもつらい。助けてほしい。', action: '緊急対応。メンタルヘルスの専門相談窓口に連絡。翌日にフォロー面談を設定。' },
    { content: 'パワハラを受けている。上司に暴言を吐かれた。怖くて仕事に行きたくない。', action: '緊急対応。具体的な内容を記録。法的対応も含めた支援計画を策定。会社に厳重注意を要請。' },
    { content: 'マイナンバーカードの申請方法を知りたい。', action: '市役所への同行を提案。申請に必要な書類を説明。' },
];

function randomDate(start: Date, end: Date): Date {
    const time = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(time);
}

function formatDate(d: Date): string {
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

// Generate CSV
const rows: string[] = [];
rows.push('日付,氏名,担当者,相談内容,対応内容');

for (const name of names) {
    const recordCount = 3 + Math.floor(Math.random() * 5);
    const baseDate = randomDate(new Date('2024-06-01'), new Date('2024-09-01'));

    for (let j = 0; j < recordCount; j++) {
        const date = new Date(baseDate.getTime() + j * (7 + Math.random() * 14) * 86400000);
        const staffMember = staff[Math.floor(Math.random() * staff.length)];
        const template = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];

        const escapeCsv = (s: string) => `"${s.replace(/"/g, '""')}"`;
        rows.push([
            formatDate(date),
            name,
            staffMember,
            escapeCsv(template.content),
            escapeCsv(template.action),
        ].join(','));
    }
}

console.log(rows.join('\n'));
