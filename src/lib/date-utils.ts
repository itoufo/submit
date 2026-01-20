/**
 * JST (Japan Standard Time) 日付ユーティリティ
 *
 * サーバーのタイムゾーンに依存せず、常に JST で日付計算を行う
 */

const JST_OFFSET_HOURS = 9;
const JST_OFFSET_MS = JST_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * 現在時刻を JST で取得
 */
export function nowJST(): Date {
  const now = new Date();
  return new Date(now.getTime() + JST_OFFSET_MS + now.getTimezoneOffset() * 60 * 1000);
}

/**
 * UTC Date を JST Date に変換
 */
export function toJST(date: Date): Date {
  return new Date(date.getTime() + JST_OFFSET_MS + date.getTimezoneOffset() * 60 * 1000);
}

/**
 * JST Date を UTC Date に変換（DB保存用）
 */
export function toUTC(jstDate: Date): Date {
  return new Date(jstDate.getTime() - JST_OFFSET_MS - jstDate.getTimezoneOffset() * 60 * 1000);
}

/**
 * JST での今日の 00:00:00 を取得
 */
export function todayStartJST(): Date {
  const now = nowJST();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * JST での今日の 23:59:59.999 を取得
 */
export function todayEndJST(): Date {
  const now = nowJST();
  now.setHours(23, 59, 59, 999);
  return now;
}

/**
 * JST での曜日を取得 (0=日曜, 1=月曜, ..., 6=土曜)
 */
export function getDayOfWeekJST(date?: Date): number {
  const target = date ? toJST(date) : nowJST();
  return target.getDay();
}

/**
 * 指定した曜日の次の日付を JST で計算
 * @param targetDay 曜日 (0=日曜, 1=月曜, ..., 6=土曜)
 * @param baseDate 基準日（指定しない場合は現在時刻）
 * @returns 次の targetDay の日付（JST）
 */
export function getNextDayOfWeekJST(targetDay: number, baseDate?: Date): Date {
  const base = baseDate ? toJST(baseDate) : nowJST();
  const currentDay = base.getDay();
  const daysUntilNext = (targetDay - currentDay + 7) % 7 || 7;

  const result = new Date(base);
  result.setDate(base.getDate() + daysUntilNext);
  result.setHours(23, 59, 59, 999);

  return result;
}

/**
 * JST での日付範囲を取得（判定期間用）
 * @param startDate 開始日
 * @param endDate 終了日
 * @returns { start: ISO文字列, end: ISO文字列 } (UTC)
 */
export function getJudgmentPeriodUTC(
  startDate: Date,
  endDate: Date
): { start: string; end: string } {
  const startJST = toJST(startDate);
  startJST.setHours(0, 0, 0, 0);

  const endJST = toJST(endDate);
  endJST.setHours(23, 59, 59, 999);

  return {
    start: toUTC(startJST).toISOString(),
    end: toUTC(endJST).toISOString(),
  };
}

/**
 * 次回判定日を JST ベースで計算
 * @param frequency 頻度 (daily, weekly, biweekly, monthly, custom)
 * @param judgmentDay 曜日 (0-6)
 * @param customDays カスタム日数
 * @param baseDate 基準日
 * @returns 次回判定日（UTC ISO文字列）
 */
export function calculateNextJudgmentDateJST(
  frequency: string,
  judgmentDay: number,
  customDays?: number | null,
  baseDate?: Date
): string {
  const base = baseDate ? toJST(baseDate) : nowJST();
  const result = new Date(base);

  switch (frequency) {
    case "daily":
      result.setDate(base.getDate() + 1);
      break;

    case "weekly": {
      const daysUntilNext = (judgmentDay - base.getDay() + 7) % 7 || 7;
      result.setDate(base.getDate() + daysUntilNext);
      break;
    }

    case "biweekly": {
      const daysUntilNext = (judgmentDay - base.getDay() + 7) % 7 || 7;
      result.setDate(base.getDate() + daysUntilNext + 7);
      break;
    }

    case "monthly": {
      result.setMonth(result.getMonth() + 1);
      result.setDate(1);
      // 翌月の最初の judgmentDay を見つける
      while (result.getDay() !== judgmentDay) {
        result.setDate(result.getDate() + 1);
      }
      break;
    }

    case "custom":
      if (customDays) {
        result.setDate(base.getDate() + customDays);
      }
      break;
  }

  // 判定日の終わり (23:59:59 JST)
  result.setHours(23, 59, 59, 999);

  // UTC に変換して返す
  return toUTC(result).toISOString();
}

/**
 * ISO文字列を JST 表示用にフォーマット
 */
export function formatJST(isoString: string, format: "date" | "datetime" = "date"): string {
  const date = toJST(new Date(isoString));

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (format === "date") {
    return `${year}-${month}-${day}`;
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 今日が判定日かどうかを JST でチェック
 */
export function isJudgmentDayJST(judgmentDate: string): boolean {
  const today = todayStartJST();
  const judgment = toJST(new Date(judgmentDate));

  return (
    today.getFullYear() === judgment.getFullYear() &&
    today.getMonth() === judgment.getMonth() &&
    today.getDate() === judgment.getDate()
  );
}
