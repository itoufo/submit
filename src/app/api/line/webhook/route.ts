import { NextResponse } from "next/server";
import { createServiceClient, getSubmitSchema } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import {
  verifyLineSignature,
  LineWebhookBody,
  LineWebhookEvent,
  replyLineMessage,
} from "@/lib/line";
import {
  rateLimit,
  getClientIP,
  rateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/rate-limit";

/**
 * LINE Webhook エンドポイント
 * 友だち追加/ブロック時のイベントを処理
 */
export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIP(request);
  const rateLimitResult = await rateLimit(`line-webhook:${ip}`, RATE_LIMITS.lineWebhook);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: rateLimitHeaders(rateLimitResult),
      }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  // 署名検証（タイミングセーフ）
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
        .schema(getSubmitSchema())
        .from("User")
        .select("id")
        .eq("lineUserId", lineUserId);

      if (users && users.length > 0) {
        await db.user.update(supabase, users[0].id, { lineUserId: null });
        console.log(`LINE unfollow: cleared lineUserId for user ${users[0].id}`);
      }
      break;

    case "message":
      // メッセージ受信: 提出処理
      if (event.message?.type === "text" && event.message.text) {
        await handleSubmissionMessage(
          supabase,
          lineUserId,
          event.message.text,
          event.replyToken,
          event.message.id
        );
      }
      break;

    default:
      console.log(`Unhandled LINE event type: ${event.type}`);
  }
}

/**
 * 提出メッセージを処理
 */
async function handleSubmissionMessage(
  supabase: ReturnType<typeof createServiceClient>,
  lineUserId: string,
  messageText: string,
  replyToken?: string,
  lineMessageId?: string
) {
  try {
    // LINE連携済みユーザーを検索
    const { data: users } = await supabase
      .schema(getSubmitSchema())
      .from("User")
      .select("id")
      .eq("lineUserId", lineUserId);

    if (!users || users.length === 0) {
      // 未連携ユーザー
      if (replyToken) {
        await replyLineMessage(
          replyToken,
          "アカウント連携が必要です。\nWebアプリの設定画面からLINE連携を完了してください。"
        );
      }
      return;
    }

    const userId = users[0].id;

    // ユーザーのアクティブなプロジェクトを取得
    const projects = await db.project.findMany(supabase, userId, "active");

    if (projects.length === 0) {
      if (replyToken) {
        await replyLineMessage(
          replyToken,
          "アクティブなプロジェクトがありません。\nWebアプリからプロジェクトを作成してください。"
        );
      }
      return;
    }

    // メッセージからプロジェクトを特定
    // 簡易マッチング: プロジェクト名が含まれているか
    const matchedProject = projects.find((p) =>
      messageText.includes(p.name)
    );

    let targetProject = matchedProject;

    // マッチしない場合は最初のプロジェクト（1つしかない場合を想定）
    if (!targetProject && projects.length === 1) {
      targetProject = projects[0];
    }

    if (!targetProject) {
      // 複数プロジェクトがあり特定できない
      const projectList = projects.map((p) => `・${p.name}`).join("\n");
      if (replyToken) {
        await replyLineMessage(
          replyToken,
          `プロジェクト名を含めて送信してください。\n\nアクティブなプロジェクト:\n${projectList}`
        );
      }
      return;
    }

    if (lineMessageId) {
      const existing = await db.submission.findByLineMessageId(
        supabase,
        lineMessageId
      );
      if (existing) {
        console.log(
          `[LINE Submission] Duplicate message skipped: ${lineMessageId}`
        );
        return;
      }
    }

    // 提出を作成
    const submission = await db.submission.create(supabase, {
      userId,
      projectId: targetProject.id,
      content: messageText,
      lineMessageId,
    });

    console.log(
      `[LINE Submission] Created submission #${submission.sequenceNum} for project ${targetProject.name}`
    );

    // 確認メッセージを返信
    if (replyToken) {
      await replyLineMessage(
        replyToken,
        `【SUBMIT】提出を受領しました\n\n${targetProject.name} #${String(submission.sequenceNum).padStart(3, "0")}`
      );
    }
  } catch (error) {
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? (error as { code?: string }).code
        : undefined;
    if (lineMessageId && errorCode === "23505") {
      console.log(
        `[LINE Submission] Duplicate message rejected by DB: ${lineMessageId}`
      );
      return;
    }
    console.error("[LINE Submission] Error:", error);
    if (replyToken) {
      await replyLineMessage(
        replyToken,
        "提出の処理中にエラーが発生しました。しばらくしてから再度お試しください。"
      );
    }
  }
}

// LINE Developers コンソールからの疎通確認用
export async function GET() {
  return NextResponse.json({ status: "LINE webhook is ready" });
}
