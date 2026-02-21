// ===== Parsed Data Types =====
export interface ParsedRow {
    date: string | null;
    name: string | null;
    staff: string | null;
    content: string | null;
    action: string | null;
    sheetName: string;
    rowIndex: number;
}

export interface ParsedSheet {
    sheetName: string;
    isGroup: boolean;
    rows: ParsedRow[];
}

export interface ParseResult {
    sheets: ParsedSheet[];
    errors: ParseError[];
    groupName: string | null;
}

export interface ParseError {
    sheet: string;
    row: number;
    column?: string;
    message: string;
}

// ===== Column Mapping =====
export interface ColumnMapping {
    date?: number;
    name?: number;
    staff?: number;
    content?: number;
    action?: number;
}

// ===== Analysis Types =====
export type CategoryKey =
    | 'procedure'
    | 'relationship'
    | 'work'
    | 'health'
    | 'life'
    | 'language_culture'
    | 'other';

export interface CategoryFlags {
    procedure: boolean;
    relationship: boolean;
    work: boolean;
    health: boolean;
    life: boolean;
    language_culture: boolean;
    other: boolean;
}

export interface SentimentResult {
    score: number;
    confidence: number;
    evidence: SentimentEvidence;
}

export interface SentimentEvidence {
    positiveHits: string[];
    negativeHits: string[];
    negations: string[];
    intensifiers: string[];
}

export type UrgencyLevel = 'Low' | 'Medium' | 'High';

export interface AnalysisResult {
    textAll: string;
    categoryMain: CategoryKey;
    categoryFlags: CategoryFlags;
    keywords: string[];
    sentiment: SentimentResult;
    urgency: UrgencyLevel;
}

// ===== Risk Types =====
export type RiskTier = 'Green' | 'Yellow' | 'Red';

export interface RiskResult {
    score: number;
    tier: RiskTier;
    factors: RiskFactor[];
}

export interface RiskFactor {
    name: string;
    value: number;
    weight: number;
    description: string;
}

// ===== Settings Types =====
export interface CategoryDict {
    [category: string]: string[];
}

export interface SentimentDict {
    positive: string[];
    negative: string[];
    negation: string[];
    intensifier: string[];
}

export interface ThresholdSettings {
    riskTier: {
        yellow: number;
        red: number;
    };
    urgency: {
        highKeywords: string[];
        mediumKeywords: string[];
    };
    riskWeights: {
        volumeIncrease: number;
        sentimentDecline: number;
        highRiskCategory: number;
        openCases: number;
        unresolvedExpressions: number;
    };
}

export interface NotificationSettings {
    enabled: boolean;
    email: string;
    triggerOnRed: boolean;
    triggerOnHighUrgency: boolean;
}

export interface AppSettings {
    dict: CategoryDict;
    sentimentDict: SentimentDict;
    thresholds: ThresholdSettings;
    notifications: NotificationSettings;
}

// ===== Aggregation Types =====
export interface GroupStats {
    totalRecords: number;
    totalPersons: number;
    avgSentiment: number;
    redAlertCount: number;
    yellowAlertCount: number;
    trendData: TrendDataPoint[];
    categoryTrend: CategoryTrendPoint[];
    categoryDistribution: { category: string; count: number; percentage: number }[];
    topKeywords: { word: string; count: number }[];
    insights: string[];
}

export interface TrendDataPoint {
    date: string;
    count: number;
}

export interface CategoryTrendPoint {
    date: string;
    [category: string]: string | number;
}

export interface PersonStats {
    sentimentTrend: { date: string; score: number }[];
    categoryTimeline: { date: string; category: string }[];
    topCategories: { category: string; count: number }[];
    openCases: number;
    recentChange: string;
}

// ===== Case Types =====
export type CaseStatus = 'Open' | 'InProgress' | 'Pending' | 'Resolved';

// ===== Phase Analysis =====
export interface PhaseData {
    phase: string;
    range: string;
    count: number;
    avgSentiment: number;
    topCategory: string;
}
