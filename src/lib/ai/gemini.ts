import { GoogleGenerativeAI, SchemaType, ResponseSchema } from '@google/generative-ai';
import crypto from 'crypto';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const A_SCHEMA: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        summary: {
            type: SchemaType.STRING,
            description: "面談ログの忠実な全体要約（短く簡潔に）",
        },
        key_points: {
            type: SchemaType.ARRAY,
            description: "重要なポイントのリスト。推測を含めないこと。",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    point: { type: SchemaType.STRING, description: "要点" },
                    evidence_quote: { type: SchemaType.STRING, description: "それを裏付ける面談ログからの短い直接引用" }
                },
                required: ["point", "evidence_quote"]
            }
        },
        concerns: {
            type: SchemaType.ARRAY,
            description: "懸念点・リスクのリスト。医療・法律などの断定は避けること。",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    concern: { type: SchemaType.STRING, description: "懸念点の実態" },
                    evidence_quote: { type: SchemaType.STRING, description: "それを裏付ける面談ログからの短い直接引用" },
                    requires_confirmation: { type: SchemaType.BOOLEAN, description: "断定できず、要確認事項であるか" }
                },
                required: ["concern", "evidence_quote", "requires_confirmation"]
            }
        },
        next_questions: {
            type: SchemaType.ARRAY,
            description: "次回の面談で確認すべき質問案のリスト",
            items: { type: SchemaType.STRING }
        },
        follow_up_suggestions: {
            type: SchemaType.ARRAY,
            description: "推奨される次のアクション・フォロー案のリスト",
            items: { type: SchemaType.STRING }
        }
    },
    required: ["summary", "key_points", "concerns", "next_questions", "follow_up_suggestions"],
};

export const B_SCHEMA: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        overall_summary: {
            type: SchemaType.STRING,
            description: "バッチ全体の傾向を示す要約",
        },
        hot_topics: {
            type: SchemaType.ARRAY,
            description: "頻出のトピックTop5",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    topic: { type: SchemaType.STRING, description: "トピック名" },
                    description: { type: SchemaType.STRING, description: "どのような内容で話題になっているか" },
                    representative_record_ids: {
                        type: SchemaType.ARRAY,
                        description: "代表的な面談のID",
                        items: { type: SchemaType.STRING }
                    }
                },
                required: ["topic", "description", "representative_record_ids"]
            }
        },
        deltas: {
            type: SchemaType.ARRAY,
            description: "前回バッチからの増減や変化（存在する場合のみ）",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    metric: { type: SchemaType.STRING, description: "指標名（例: ネガティブ発言割合）" },
                    change: { type: SchemaType.STRING, description: "変化の内容（例: 前月比+5%）" }
                },
                required: ["metric", "change"]
            }
        },
        priority_alerts: {
            type: SchemaType.ARRAY,
            description: "重点的に対応すべきアラート",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    alert: { type: SchemaType.STRING, description: "アラート内容" },
                    representative_record_ids: {
                        type: SchemaType.ARRAY,
                        description: "代表的な面談のID",
                        items: { type: SchemaType.STRING }
                    }
                },
                required: ["alert", "representative_record_ids"]
            }
        }
    },
    required: ["overall_summary", "hot_topics", "deltas", "priority_alerts"],
};

export const INTERVIEW_PROMPT_VERSION = "v1-interview";
export const BATCH_PROMPT_VERSION = "v1-batch";

export function generateInputHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
}

export async function generateInterviewInsightRaw(text: string) {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            temperature: 0,
            topP: 0.95,
            responseMimeType: "application/json",
            responseSchema: A_SCHEMA,
        },
        systemInstruction: `あなたは面談ログ解析アシスタントです。目的は「面談ログの忠実な要約」と「次の面談での確認質問・フォロー案」を提示することです。

厳守：
- 入力ログに“書かれていない事実”を追加しない。推測で断定しない。
- すべての要点（key_points/concerns）は evidence_quotes（入力からの短い引用）を必ず添付する。
- 医療・法律・在留などの判断を断定しない。必要なら「要確認」とする。
- 出力は指定されたJSON Schemaに必ず一致させる（余計なキーは禁止）。
- 日本語で出力する。簡潔で、現場担当がすぐ動ける表現にする。`,
    });

    const result = await model.generateContent(text);
    const responseText = result.response.text();
    return JSON.parse(responseText);
}

export async function generateBatchInsightRaw(statsText: string) {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            temperature: 0,
            topP: 0.95,
            responseMimeType: "application/json",
            responseSchema: B_SCHEMA,
        },
        systemInstruction: `あなたはInterview Analyzerに「バッチ全体のAIインサイト」を実装します。

絶対条件（論文品質）：
- 数値（件数、割合、増減）は “アプリ側集計”を唯一の真実として使う。AIに計算させない。
- AIは数字を改変・捏造しない。入力の数値をそのまま参照して文章化するだけ。
- 出力は指定されたJSON Schema固定。
- 各インサイトに representative_record_ids（代表面談ID）を付けて追跡可能にする。`,
    });

    const result = await model.generateContent(statsText);
    const responseText = result.response.text();
    return JSON.parse(responseText);
}
