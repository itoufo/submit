import { NextRequest, NextResponse } from "next/server";
import { getUser, ensureUserExists } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import { getOpenAI } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserExists(user.id, user.email!);

    const supabase = createServiceClient();

    // ユーザーのメモを取得
    const { data: memos } = await supabase
      .from("Memo")
      .select("*")
      .eq("userId", user.id)
      .order("createdAt", { ascending: false })
      .limit(50);

    if (!memos || memos.length < 3) {
      return NextResponse.json(
        { error: "プロジェクト提案には3つ以上のメモが必要です" },
        { status: 400 }
      );
    }

    // メモの内容を結合
    const memoContents = memos
      .map((m, i) => `[${i + 1}] ${m.content}`)
      .join("\n\n");

    // OpenAI APIでプロジェクトを提案
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたは思考を資産化するコーチです。
ユーザーの観測ログ（思考メモ）を分析し、継続的なコンテンツプロジェクトを提案してください。

以下の観点で分析してください：
1. 繰り返し出現するテーマや関心事
2. ユーザーの独自の視点や洞察
3. 発展させると価値のある思考の種
4. 継続的にコンテンツを作れそうなテーマ

出力は以下のJSON形式で返してください：
{
  "title": "プロジェクトタイトル（20文字以内）",
  "description": "プロジェクトの説明（200文字程度）",
  "reasoning": "この提案をした理由（どのメモからどんな傾向を見出したか）"
}`,
        },
        {
          role: "user",
          content: `以下のメモを分析し、プロジェクトを提案してください：\n\n${memoContents}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    if (!result.title || !result.description || !result.reasoning) {
      throw new Error("Invalid AI response");
    }

    // データベースに保存
    const suggestion = await db.projectSuggestion.create(supabase, {
      userId: user.id,
      title: result.title,
      description: result.description,
      reasoning: result.reasoning,
      memoIds: JSON.stringify(memos.map((m) => m.id)),
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("Failed to suggest project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
