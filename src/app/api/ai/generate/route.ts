import { NextRequest, NextResponse } from "next/server";
import { getUser, ensureUserExists } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import { getOpenAI } from "@/lib/openai";

const FORMAT_PROMPTS = {
  tweet: "140文字以内のX（Twitter）投稿として、インパクトがあり、読者の興味を引く形式で",
  blog: "800〜1200文字程度のブログ記事として、導入・本文・まとめの構成で",
  note: "2000文字程度のnote記事として、読者に価値を提供する深い洞察を含む形式で",
};

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserExists(user.id, user.email!);

    const body = await request.json();
    const { memoIds, format = "tweet" } = body;

    if (!memoIds || !Array.isArray(memoIds) || memoIds.length === 0) {
      return NextResponse.json({ error: "No memos selected" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 選択されたメモを取得
    const { data: memos } = await supabase
      .from("Memo")
      .select("*")
      .in("id", memoIds)
      .eq("userId", user.id);

    if (!memos || memos.length === 0) {
      return NextResponse.json({ error: "No valid memos found" }, { status: 400 });
    }

    // メモの内容を結合
    const memoContents = memos.map((m) => m.content).join("\n\n");

    // OpenAI APIでコンテンツを生成
    const formatPrompt = FORMAT_PROMPTS[format as keyof typeof FORMAT_PROMPTS] || FORMAT_PROMPTS.tweet;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたは優秀なコンテンツエディターです。
ユーザーの思考メモを元に、${formatPrompt}コンテンツを作成してください。
メモの本質的なメッセージや洞察を活かしながら、読者にとって価値のある形に仕上げてください。
出力はコンテンツ本文のみとし、説明や前置きは不要です。`,
        },
        {
          role: "user",
          content: `以下のメモを元にコンテンツを作成してください：\n\n${memoContents}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedContent = completion.choices[0].message.content || "";

    // データベースに保存
    const candidate = await db.aiCandidate.create(supabase, {
      userId: user.id,
      content: generatedContent,
      format,
    });

    // メモとの関連付け（多対多テーブル）
    for (const memoId of memoIds) {
      await supabase
        .from("_MemoToCandidates")
        .insert({ A: memoId, B: candidate.id });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Failed to generate content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
