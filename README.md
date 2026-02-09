# Interview Analyzer

Foreign Worker Interview Log Analysis Application.
Upload monthly Excel/CSV logs to visualize trends, frequent topics, and individual consultation history.

## Features

- **Excel/CSV Upload**: Supports standard formats, merged cells, and newline-separated cells.
- **Group Analysis**:
  - Consultation trends over time.
  - Frequent keywords extraction.
  - Topic modeling (LDA-based).
  - Sentiment analysis (Rule-based).
- **Individual Analysis**:
  - Personal consultation timeline.
  - Sentiment tracking.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite (via Prisma)
- **NLP**: Kuromoji (Morphological Analysis), LDA (Topic Modeling)
- **UI**: Tailwind CSS, Recharts

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Prepare Data**
   Run the following script to generate a sample Excel file with various patterns (merged cells, etc.):
   ```bash
   node scripts/create_sample_excel.js
   ```
   This creates `sample_data.xlsx` in the project root.

2. **Upload**
   - Go to the home page.
   - Drag and drop `sample_data.xlsx`.
   - Wait for the analysis to complete.

3. **View Report**
   - **Trend Chart**: See how consultation volume changes over time.
   - **Keywords**: Top merged keywords from all consultations.
   - **Person List**: Filterable list of interviewees. Click to view detailed timeline.

## Technical Details

### Parsing Logic (`src/lib/parser.ts`)
- Uses `xlsx` to read Excel files.
- Handles **merged cells** by filling values downwards.
- Normalizes "Date + Newline + Name" cells by splitting content.
- Heuristically detects header rows looking for "Date", "Name", "Problem".

### Analysis Logic (`src/lib/analyzer.ts`)
- **Tokenization**: Uses `kuromoji` to extract Nouns and Verbs.
- **Sentiment**: Matches tokens against a predefined dictionary of positive/negative words.
- **Topic Modeling**: Aggregates tokens from a batch and runs LDA to find latent topics (stored as keywords for MVP).
