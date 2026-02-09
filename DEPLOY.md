# Vercel Deployment Guide

To deploy "Interview Analyzer" to Vercel, please follow these steps.

## ⚠️ Important Database Note
This application currently uses **SQLite** (`dev.db`).
Vercel's standard environment (Serverless) **does not support persistent SQLite files**.
If you deploy as is, the database will be reset every time the server restarts or redeploys, and your uploaded data will disappear.

### Recommended Solution: Use Vercel Postgres
For a persistent production App on Vercel, we recommend switching to **Vercel Postgres**.

## Steps to Deploy

### 1. Push to GitHub
Ensure your code is pushed to your GitHub repository:
https://github.com/yujiro3440923/InterviewAnalyzer.git

### 2. Create Vercel Project
1. Log in to [Vercel](https://vercel.com).
2. Click "Add New..." -> "Project".
3. Import `InterviewAnalyzer` from your GitHub.

### 3. Setup Vercel Postgres (Database)
1. In the Vercel Project Dashboard, go to **Storage**.
2. Click **Connect Database** -> **Create New** -> **Vercel Postgres**.
3. Accept the terms and create the database.
4. This will automatically add environment variables (like `POSTGRES_PRISMA_URL`) to your project settings.

### 4. Update Project for Postgres (Required Changes)

You need to modify the code slightly to support Postgres instead of SQLite.

**A. Update `prisma/schema.prisma`**
Change the `datasource` provider:
```prisma
datasource db {
  provider = "postgresql" // Changed from "sqlite"
  url      = env("POSTGRES_PRISMA_URL") // Vercel provides this automatically
  directUrl = env("POSTGRES_URL_NON_POOLING") // Optional, but good for migrations
}
```

**B. Update Migrations**
Since you are switching databases, you should delete the old `prisma/migrations` folder locally and re-create migrations for Postgres.

```bash
# Delete old migrations
rm -rf prisma/migrations

# Generate new migration for Postgres
npx prisma migrate dev --name init_postgres
```
*Note: You need a local Postgres running to test this, or you can just commit the schema change and let Vercel handle it if you only care about production.*

**C. Commit and Push Changes**
Push the changes to GitHub. Vercel will automatically redeploy.

**D. Run Migrations on Vercel**
Add a build command instruction or use the Vercel Console to run migrations.
Usually, putting `"postinstall": "prisma generate"` in `package.json` helps generate the client.
To create tables in Vercel Postgres, you can run this command locally (connecting to Vercel DB) or set up a Command in Vercel.

Simplest way:
1. Get the connection string from Vercel.
2. Run `POSTGRES_PRISMA_URL="your_vercel_db_string" npx prisma migrate deploy` locally.

### 5. Check "Kuromoji" Dictionary
This app uses `kuromoji` dictionary files located in `public/dict`.
Next.js on Vercel serves files checks `public` folder automatically, so this **should work** without changes.

---

## Summary of Operations required by You
If you want to keep it strictly as **SQLite** for a demo (understanding data will be lost on redeploy):
1. Just push to GitHub.
2. Deploy on Vercel.
3. It will work, but uploaded data will vanish eventually.

If you want **Persistence (Real App)**:
1. Create Vercel Postgres database.
2. Update `schema.prisma` provider to `postgresql`.
3. Push changes.
