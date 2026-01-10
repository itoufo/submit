// LINE Messaging API Service
// https://developers.line.biz/ja/docs/messaging-api/

const LINE_API_BASE = "https://api.line.me/v2/bot";

type LineMessage = {
  type: "text";
  text: string;
};

type LinePushRequest = {
  to: string;
  messages: LineMessage[];
};

type LineReplyRequest = {
  replyToken: string;
  messages: LineMessage[];
};

/**
 * LINE Reply APIでメッセージを返信
 */
export async function replyLineMessage(
  replyToken: string,
  message: string
): Promise<boolean> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn("LINE_CHANNEL_ACCESS_TOKEN is not set");
    return false;
  }

  const body: LineReplyRequest = {
    replyToken,
    messages: [{ type: "text", text: message }],
  };

  try {
    const response = await fetch(`${LINE_API_BASE}/message/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("LINE Reply API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("LINE reply failed:", error);
    return false;
  }
}

/**
 * LINE Messaging APIでメッセージを送信
 */
export async function sendLineMessage(
  lineUserId: string,
  message: string
): Promise<boolean> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn("LINE_CHANNEL_ACCESS_TOKEN is not set");
    return false;
  }

  const body: LinePushRequest = {
    to: lineUserId,
    messages: [{ type: "text", text: message }],
  };

  try {
    const response = await fetch(`${LINE_API_BASE}/message/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("LINE API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("LINE message send failed:", error);
    return false;
  }
}

/**
 * 複数ユーザーに一斉送信
 */
export async function sendLineMessages(
  messages: { lineUserId: string; message: string }[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const { lineUserId, message } of messages) {
    const result = await sendLineMessage(lineUserId, message);
    if (result) {
      success++;
    } else {
      failed++;
    }
    // Rate limit対策: 100ms待機
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { success, failed };
}

// ============================================
// 通知メッセージテンプレート（事実ベース、励ましなし）
// ============================================

/**
 * 朝リマインド（9:00 JST）
 * 当日が期限のプロジェクトがある場合のみ
 */
export function createMorningReminder(projects: { name: string }[]): string {
  if (projects.length === 0) return "";

  const names = projects.map((p) => `・${p.name}`).join("\n");
  return `【SUBMIT】本日が提出期限です\n\n${names}\n\n提出: https://submit.app/submit`;
}

/**
 * 夜リマインド（21:00 JST）
 * 当日が期限で未提出のプロジェクトがある場合
 */
export function createEveningReminder(
  projects: { name: string; penaltyAmount: number }[]
): string {
  if (projects.length === 0) return "";

  const items = projects
    .map((p) => `・${p.name}（未提出: ¥${p.penaltyAmount.toLocaleString()}）`)
    .join("\n");
  return `【SUBMIT】本日24時が期限です\n\n${items}\n\n提出: https://submit.app/submit`;
}

/**
 * 期限超過通知（判定後）
 */
export function createUrgentReminder(
  projects: { name: string; penaltyAmount: number }[]
): string {
  if (projects.length === 0) return "";

  const total = projects.reduce((sum, p) => sum + p.penaltyAmount, 0);
  const items = projects
    .map((p) => `・${p.name}: ¥${p.penaltyAmount.toLocaleString()}`)
    .join("\n");

  return `【SUBMIT】未提出によりペナルティが発生しました\n\n${items}\n\n合計: ¥${total.toLocaleString()}`;
}

/**
 * 提出確認通知
 */
export function createSubmissionConfirmation(
  projectName: string,
  sequenceNum: number
): string {
  return `【SUBMIT】提出を受領しました\n\n${projectName} #${String(sequenceNum).padStart(3, "0")}`;
}

/**
 * 判定結果通知（提出済み）
 */
export function createJudgmentSuccess(projectName: string): string {
  return `【SUBMIT】判定完了\n\n${projectName}: 提出確認`;
}

/**
 * 判定結果通知（未提出）
 */
export function createJudgmentFailed(
  projectName: string,
  penaltyAmount: number
): string {
  return `【SUBMIT】判定完了\n\n${projectName}: 未提出\nペナルティ: ¥${penaltyAmount.toLocaleString()}`;
}

// ============================================
// Webhook署名検証
// ============================================

import crypto from "crypto";

/**
 * LINE Webhook署名を検証（タイミングセーフ）
 */
export function verifyLineSignature(
  body: string,
  signature: string
): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    console.warn("LINE_CHANNEL_SECRET is not set");
    return false;
  }

  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");

  // タイミング攻撃対策: 固定時間で比較
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    // 長さが異なる場合は例外が発生するが、falseを返す
    return false;
  }
}

/**
 * Webhook イベントタイプ
 */
export type LineWebhookEvent = {
  type: "follow" | "unfollow" | "message" | "postback";
  source: {
    type: "user";
    userId: string;
  };
  replyToken?: string;
  message?: {
    type: string;
    text?: string;
  };
};

export type LineWebhookBody = {
  events: LineWebhookEvent[];
};
