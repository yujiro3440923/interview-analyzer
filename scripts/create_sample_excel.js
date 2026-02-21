const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.utils.book_new();

// Sheet 1: Standard Format
const data1 = [
    ["Date", "Name", "Problem", "Action"],
    [new Date(2023, 0, 15), "Nguyen Van A", "寮のエアコンが壊れて寒い", "管理会社に連絡し修理手配"],
    [new Date(2023, 0, 20), "Tran Thi B", "給与明細の見方がわからない", "通訳同席で説明"],
    [new Date(2023, 1, 5), "Nguyen Van A", "日本語の勉強方法について相談", "社内教室を案内"],
    [new Date(2023, 1, 10), "Le Van C", "体調不良で病院に行きたい", "病院へ同行"],
    [new Date(2023, 1, 15), "Tran Thi B", "同僚との人間関係で悩み", "個別にヒアリング実施"],
];
const ws1 = XLSX.utils.aoa_to_sheet(data1);
XLSX.utils.book_append_sheet(wb, ws1, "Standard");

// Sheet 2: Merged Cells (Date is merged for same day)
// 2023/03/01 - 2 records
// 2023/03/05 - 1 record
const data2 = [
    ["Date", "Name", "Problem", "Action"],
    [new Date(2023, 2, 1), "Pham Van D", "自転車がパンクした", "修理店を案内"],
    [null, "Hoang Thi E", "Wifiがつながらない", "ルーター再起動を指示"],
    [new Date(2023, 2, 5), "Pham Van D", "仕事のミスで落ち込んでいる", "励ましと再指導"],
];
const ws2 = XLSX.utils.aoa_to_sheet(data2);
// Merge A2:A3
ws2['!merges'] = [{ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }];
XLSX.utils.book_append_sheet(wb, ws2, "MergedCells");

// Sheet 3: Newline in Cell (Date\nName)
const data3 = [
    ["Date/Name", "Content", "Response"],
    ["2023/04/01\nNguyen Van A", "帰国したい", "事情を聴取、説得"],
    ["2023/04/10\nTran Thi B", "残業時間を減らしたい", "部署異動を検討"],
];
const ws3 = XLSX.utils.aoa_to_sheet(data3);
XLSX.utils.book_append_sheet(wb, ws3, "Newlines");

const outputPath = path.join(process.cwd(), 'sample_data.xlsx');
XLSX.writeFile(wb, outputPath);
console.log(`Sample Excel created at: ${outputPath}`);
