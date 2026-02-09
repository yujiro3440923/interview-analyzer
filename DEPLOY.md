# Vercel デプロイ & 納品ガイド

このアプリケーションを Vercel にデプロイし、納品するための手順書です。

## ⚠️ 重要：データベースについて
現在のコードは **SQLite** (`dev.db`) を使用しています。
Vercel の標準環境（サーバーレス）では、SQLite のファイルは保存されません（デプロイや再起動のたびにデータが消えます）。
**本番環境として Vercel で運用する場合は、必ず `Vercel Postgres` (または Supabase, PlanetScale 等) への切り替えが必要です。**

---

## 手順 1. GitHub へのプッシュ (完了済み)
ソースコードは以下のリポジトリにアップロードされています。
URL: https://github.com/yujiro3440923/InterviewAnalyzer.git

---

## 手順 2. Vercel プロジェクトの作成
1. [Vercel](https://vercel.com) にログインします。
2. "Add New..." -> "Project" をクリックします。
3. GitHub アカウントを連携し、`InterviewAnalyzer` リポジトリをインポートします。
4. **Build Command** や **Output Directory** はデフォルトのままでOKです。
5. "Deploy" をクリックします。
   - ※ 初回デプロイは失敗する可能性があります（データベース設定がまだのため）。

---

## 手順 3. Vercel Postgres (データベース) のセットアップ
データの永続化のため、Vercel 上でデータベースを作成します。

1. 作成した Vercel プロジェクトのダッシュボードへ移動します。
2. 上部メニューの **Storage** をクリックします。
3. **Connect Database** -> **Create New** -> **Vercel Postgres** を選択します。
4. 利用規約に同意し、Database Name (例: `interview-db`) を入力して作成します。
5. Region (リージョン) は `Japan (Tokyo)` などを推奨しますが、Vercel Functions のリージョンと近い場所を選んでください。
6. 作成が完了すると、自動的にプロジェクトの **Environment Variables** (環境変数) に `POSTGRES_PRISMA_URL` などが追加されます。

---

## 手順 4. コードの修正 (Postgres 対応)
ローカルのコードを修正し、SQLite から Postgres に切り替えて再度プッシュする必要があります。

### A. `prisma/schema.prisma` の変更
`prisma/schema.prisma` ファイルを開き、`datasource` ブロックを以下のように書き換えます。

```prisma
// 変更前 (SQLite)
// datasource db {
//   provider = "sqlite"
//   url      = env("DATABASE_URL")
// }

// 変更後 (Postgres)
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL") // Connection Pooling
  directUrl = env("POSTGRES_URL_NON_POOLING") // Direct connection
}
```

### B. マイグレーションファイルの再生成
データベースの種類が変わるため、既存のマイグレーションフォルダを削除して作り直します。
ターミナルで以下を実行してください（※ローカル環境）。

```bash
# 既存のマイグレーションを削除
rm -rf prisma/migrations

# (重要) ローカルでPostgres環境がない場合、マイグレーション生成のみ行います
# そのため、.env に一時的なダミーURLを入れるか、または --skip-seed 等を使いますが、
# 一番簡単なのは「スキーマ変更だけコミットして、Vercel上でマイグレーションを実行する」方法です。
```
※ もしローカルに Postgres がない場合、`npx prisma migrate dev` はエラーになります。
その場合は、**`prisma/schema.prisma` の変更だけを行ってコミット・プッシュしてください。**
その後、Vercel の管理画面 (Settings > Build & Development Settings) の **Build Command** を以下のように変更します。

```bash
prisma generate && prisma migrate deploy && next build
```

これにより、デプロイ時に自動的にデータベースの更新が行われます。

---

## 手順 5. 辞書ファイルの確認 (Kuromoji)
このアプリは `public/dict` フォルダにある辞書ファイルを使用します。
これは Next.js の仕様上、Vercel でも問題なく読み込まれますので、追加の設定は不要です。

---

## 納品時の注意点 (クライアントに渡す場合)

もしあなたがクライアントにこのシステムを納品する場合、以下の点を確認してください。

1. **GitHub リポジトリの権限**
   - クライアントの GitHub アカウントにリポジトリを譲渡 (Transfer) するか、招待してください。

2. **Vercel アカウント**
   - クライアントの Vercel アカウントでプロジェクトを作成し直す必要があります。
   - 上記の「手順3 (データベース)」もクライアント側の環境で実施する必要があります。

3. **環境変数**
   - データベースの接続情報 (`POSTGRES_PRISMA_URL` 等) は機密情報です。`.env` ファイルは GitHub に上がらないようになっていますので、Vercel の管理画面で設定されていることを確認してください。
