import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function createSupabaseClient() {
  const schema = Deno.env.get("SUBMIT_SCHEMA") ?? "submit";
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      db: { schema },
    }
  );
}

export type User = {
  id: string;
  email: string;
  name: string | null;
  lineUserId: string | null;
  notifyMorning: boolean;
  notifyEvening: boolean;
  notifyUrgent: boolean;
};

export type Project = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  frequency: string;
  judgmentDay: number;
  customDays: number | null;
  penaltyAmount: number;
  status: string;
  nextJudgmentDate: string | null;
  submissionCount: number;
  missedCount: number;
  totalPenaltyAmount: number;
  createdAt: string;
};

// 次の判定日を計算
export function calculateNextJudgmentDate(
  frequency: string,
  judgmentDay: number,
  customDays?: number | null
): Date {
  const now = new Date();
  const result = new Date(now);

  switch (frequency) {
    case "daily":
      // 翌日
      result.setDate(now.getDate() + 1);
      break;
    case "weekly":
      const daysUntilNext = (judgmentDay - now.getDay() + 7) % 7 || 7;
      result.setDate(now.getDate() + daysUntilNext);
      break;
    case "biweekly":
      const daysUntilNextBi = (judgmentDay - now.getDay() + 7) % 7 || 7;
      result.setDate(now.getDate() + daysUntilNextBi + 7);
      break;
    case "monthly":
      result.setMonth(result.getMonth() + 1);
      result.setDate(1);
      while (result.getDay() !== judgmentDay) {
        result.setDate(result.getDate() + 1);
      }
      break;
    case "custom":
      if (customDays) {
        result.setDate(now.getDate() + customDays);
      }
      break;
  }

  result.setHours(23, 59, 59, 999);
  return result;
}
