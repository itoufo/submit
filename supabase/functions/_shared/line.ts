const LINE_API_BASE = "https://api.line.me/v2/bot";

/**
 * LINE Messaging APIでメッセージを送信
 */
export async function sendLineMessage(
  lineUserId: string,
  message: string
): Promise<boolean> {
  const accessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");

  if (!accessToken) {
    console.warn("LINE_CHANNEL_ACCESS_TOKEN is not set");
    return false;
  }

  try {
    const response = await fetch(`${LINE_API_BASE}/message/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text: message }],
      }),
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

// ============================================
// 通知メッセージテンプレート（事実ベース）
// ============================================

/**
 * 朝リマインド（9:00 JST）
 */
export function createMorningReminder(projects: { name: string }[]): string {
  if (projects.length === 0) return "";
  const names = projects.map((p) => `・${p.name}`).join("\n");
  return `【SUBMIT】本日が提出期限です\n\n${names}`;
}

/**
 * 夜リマインド（21:00 JST）
 */
export function createEveningReminder(
  projects: { name: string; penaltyAmount: number }[]
): string {
  if (projects.length === 0) return "";
  const items = projects
    .map((p) => `・${p.name}（¥${p.penaltyAmount.toLocaleString()}）`)
    .join("\n");
  return `【SUBMIT】本日24時が期限です\n\n${items}`;
}

/**
 * 期限超過通知
 */
export function createUrgentReminder(
  projects: { name: string; penaltyAmount: number }[]
): string {
  if (projects.length === 0) return "";
  const total = projects.reduce((sum, p) => sum + p.penaltyAmount, 0);
  const items = projects
    .map((p) => `・${p.name}: ¥${p.penaltyAmount.toLocaleString()}`)
    .join("\n");
  return `【SUBMIT】未提出\n\n${items}\n\n合計: ¥${total.toLocaleString()}`;
}

/**
 * 判定結果通知（提出済み）
 */
export function createJudgmentSuccess(projectName: string): string {
  return `【SUBMIT】${projectName}: 提出確認`;
}

/**
 * 判定結果通知（未提出）
 */
export function createJudgmentFailed(
  projectName: string,
  penaltyAmount: number
): string {
  return `【SUBMIT】${projectName}: 未提出\nペナルティ: ¥${penaltyAmount.toLocaleString()}`;
}
