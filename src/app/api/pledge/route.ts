import { NextRequest, NextResponse } from "next/server";
import { getUserWithProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";

// POST: 誓約を作成
export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 既に誓約済みの場合はエラー
    if (user.pledgedAt) {
      return NextResponse.json(
        { error: "Already pledged" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { pledgeText, agreedToTerms, agreedToPenalty, agreedToLine } = body;

    // 必須チェック
    if (!pledgeText || !agreedToTerms || !agreedToPenalty || !agreedToLine) {
      return NextResponse.json(
        { error: "All agreements are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 既存の誓約をチェック
    const existingPledge = await db.pledge.findByUser(supabase, user.id);

    if (existingPledge) {
      // 既に誓約がある場合は pledgedAt を更新するだけ
      await db.user.setPledged(supabase, user.id);
      return NextResponse.json(existingPledge, { status: 200 });
    }

    // 誓約を作成
    const pledge = await db.pledge.create(supabase, {
      userId: user.id,
      pledgeText,
    });

    // ユーザーの誓約完了フラグを更新
    await db.user.setPledged(supabase, user.id);

    return NextResponse.json(pledge, { status: 201 });
  } catch (error) {
    console.error("Failed to create pledge:", error);
    return NextResponse.json(
      { error: "Failed to create pledge" },
      { status: 500 }
    );
  }
}

// GET: 誓約状態を取得
export async function GET() {
  try {
    const user = await getUserWithProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const pledge = await db.pledge.findByUser(supabase, user.id);

    return NextResponse.json({
      pledged: !!user.pledgedAt,
      pledge,
    });
  } catch (error) {
    console.error("Failed to get pledge:", error);
    return NextResponse.json(
      { error: "Failed to get pledge" },
      { status: 500 }
    );
  }
}
