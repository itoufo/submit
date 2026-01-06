import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import {
  verifyLineSignature,
  LineWebhookBody,
  LineWebhookEvent,
} from "@/lib/line";

/**
 * LINE Webhook エンドポイント
 * 友だち追加/ブロック時のイベントを処理
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  // 署名検証
  if (!signature || !verifyLineSignature(body, signature)) {
    console.error("LINE webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const webhookBody: LineWebhookBody = JSON.parse(body);
  const supabase = createServiceClient();

  const results = {
    processed: 0,
    errors: [] as string[],
  };

  for (const event of webhookBody.events) {
    try {
      await handleLineEvent(supabase, event);
      results.processed++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      results.errors.push(errorMsg);
      console.error("LINE webhook event error:", err);
    }
  }

  return NextResponse.json(results);
}

async function handleLineEvent(
  supabase: ReturnType<typeof createServiceClient>,
  event: LineWebhookEvent
) {
  const lineUserId = event.source.userId;

  switch (event.type) {
    case "follow":
      // 友だち追加時
      // Note: この時点ではどのユーザーか特定できないため、
      // 連携用のリンクをリプライするか、別途連携フローが必要
      console.log(`LINE follow event: ${lineUserId}`);
      break;

    case "unfollow":
      // ブロック時: lineUserIdをnullに
      const { data: users } = await supabase
        .schema("submit")
        .from("User")
        .select("id")
        .eq("lineUserId", lineUserId);

      if (users && users.length > 0) {
        await db.user.update(supabase, users[0].id, { lineUserId: null });
        console.log(`LINE unfollow: cleared lineUserId for user ${users[0].id}`);
      }
      break;

    case "message":
      // メッセージ受信（必要に応じて実装）
      console.log(`LINE message from ${lineUserId}:`, event.message?.text);
      break;

    default:
      console.log(`Unhandled LINE event type: ${event.type}`);
  }
}

// LINE Developers コンソールからの疎通確認用
export async function GET() {
  return NextResponse.json({ status: "LINE webhook is ready" });
}
