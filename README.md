# Interview Analyzer — 面談ログ解析システム

外国人労働者の面談ログ（Excel/CSV）をアップロードし、自動解析・リスク管理・傾向分析を行うWebアプリケーションです。

## 技術スタック

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Vercel Postgres) + Prisma ORM
- **Charts**: Recharts
- **NLP**: Kuromoji（形態素解析）, Gemini API（自動要約・インサイト生成）
- **File Parsing**: exceljs + papaparse

## ローカル起動

### 前提条件
- Node.js 18+
- PostgreSQL（ローカルまたはDocker）

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. 環境変数の設定
```bash
cp .env.example .env
# .env を編集してデータベース接続情報を入力
```

**ローカルPostgreSQLの場合:**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/interview_analyzer"
DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/interview_analyzer"
```

**Dockerでの起動:**
```bash
docker run -d --name interview-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=interview_analyzer -p 5432:5432 postgres:16
```

### 3. DBマイグレーション
```bash
npx prisma generate
npx prisma db push
```

### 4. 開発サーバー起動
```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス。

### サンプルデータの生成
```bash
npx tsx scripts/generate-sample.ts > sample-data.csv
```
生成された `sample-data.csv` をアップロード画面からアップロードしてください。

---

## Vercelデプロイ

### 1. Vercel Postgresの設定
1. Vercelダッシュボードでプロジェクトを作成
2. Storage → Create Database → Postgres を選択
3. 環境変数 `DATABASE_URL` と `DIRECT_DATABASE_URL` が自動設定される

### 2. デプロイ
```bash
# Vercel CLIでデプロイ
npx vercel

# 本番デプロイ
npx vercel --prod
```

### 3. マイグレーション
```bash
npx prisma db push
```

---

## 環境変数

| 変数名 | 説明 |
|---|---|
| `DATABASE_URL` | PostgreSQL接続URL (Prisma用) |
| `DIRECT_DATABASE_URL` | PostgreSQL直接接続URL (マイグレーション用) |
| `GEMINI_API_KEY` | Gemini APIキー（AI要約・インサイト生成用） |

---

## 画面構成

| 画面 | パス | 機能 |
|---|---|---|
| アップロード | `/` | DnDでExcel/CSV をアップロード → 自動解析 |
| バッチ履歴 | `/batches` | 過去のアップロード一覧 |
| 団体レポート | `/batches/[id]` | KPIカード + 推移/カテゴリ/キーワード/フェーズ/未解決タブ |
| 個人詳細 | `/persons/[id]` | リスクスコア + 感情推移 + タイムライン + ケース管理 |
| ケースボード | `/cases` | Kanban形式で未解決ケース管理 |
| 管理設定 | `/admin/settings` | 辞書・閾値・通知設定の編集 |

---

## よくあるエラー

### `ECONNREFUSED` - データベース接続エラー
→ PostgreSQLが起動しているか確認。`.env` のURLが正しいか確認。

### `kuromoji` 辞書読み込みエラー
→ `node_modules/kuromoji/dict` ディレクトリが存在するか確認。`npm install` を再実行。

### ファイルアップロードが大きすぎる
→ `next.config.ts` の `bodySizeLimit` を調整（デフォルト: 10MB）。

### Vercelでのデプロイエラー
→ Vercel Postgresの環境変数が正しく設定されているか確認。`npx prisma generate` をビルド前に実行。
