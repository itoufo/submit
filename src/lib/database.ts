import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

// Helper to get database client with submit schema
export function getDb() {
  return createServiceClient();
}

// Type definitions for submit schema tables
export type User = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  lineUserId: string | null;
  pledgedAt: string | null;
  notifyMorning: boolean;
  notifyEvening: boolean;
  notifyUrgent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Pledge = {
  id: string;
  userId: string;
  agreedToTerms: boolean;
  agreedToPenalty: boolean;
  agreedToLine: boolean;
  pledgeText: string;
  createdAt: string;
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
  updatedAt: string;
};

export type Submission = {
  id: string;
  userId: string;
  projectId: string;
  sequenceNum: number;
  content: string;
  lineMessageId: string | null;
  createdAt: string;
};

export type JudgmentLog = {
  id: string;
  userId: string;
  projectId: string;
  judgmentDate: string;
  submitted: boolean;
  penaltyExecuted: boolean;
  penaltyAmount: number | null;
  createdAt: string;
};

export type PenaltyLog = {
  id: string;
  userId: string;
  amount: number;
  stripePaymentId: string | null;
  status: string;
  reason: string | null;
  createdAt: string;
};

// Database helper functions
export const db = {
  // User operations
  user: {
    async findUnique(supabase: AnySupabaseClient, id: string) {
      const { data, error } = await supabase
        .from("User")
        .select("*")
        .eq("id", id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as User | null;
    },
    async create(supabase: AnySupabaseClient, data: Partial<User> & { id: string; email: string }) {
      const now = new Date().toISOString();
      const { data: user, error } = await supabase
        .from("User")
        .insert({
          id: data.id,
          email: data.email,
          name: data.name || null,
          image: data.image || null,
          lineUserId: data.lineUserId || null,
          pledgedAt: data.pledgedAt || null,
          notifyMorning: data.notifyMorning ?? true,
          notifyEvening: data.notifyEvening ?? true,
          notifyUrgent: data.notifyUrgent ?? true,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();
      if (error) throw error;
      return user as User;
    },
    async update(supabase: AnySupabaseClient, id: string, data: Partial<User>) {
      const { data: user, error } = await supabase
        .from("User")
        .update({ ...data, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return user as User;
    },
    async setPledged(supabase: AnySupabaseClient, id: string) {
      return this.update(supabase, id, { pledgedAt: new Date().toISOString() });
    },
    async findWithLineConnected(supabase: AnySupabaseClient) {
      const { data, error } = await supabase
        .from("User")
        .select("*")
        .not("lineUserId", "is", null);
      if (error) throw error;
      return data as User[];
    },
    async setLineUserId(supabase: AnySupabaseClient, id: string, lineUserId: string) {
      return this.update(supabase, id, { lineUserId });
    },
  },

  // Pledge operations
  pledge: {
    async findByUser(supabase: AnySupabaseClient, userId: string) {
      const { data, error } = await supabase
        .from("Pledge")
        .select("*")
        .eq("userId", userId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as Pledge | null;
    },
    async create(supabase: AnySupabaseClient, data: { userId: string; pledgeText: string }) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const { data: pledge, error } = await supabase
        .from("Pledge")
        .insert({
          id,
          userId: data.userId,
          agreedToTerms: true,
          agreedToPenalty: true,
          agreedToLine: true,
          pledgeText: data.pledgeText,
          createdAt: now,
        })
        .select()
        .single();
      if (error) throw error;
      return pledge as Pledge;
    },
  },

  // Project operations
  project: {
    async findMany(supabase: AnySupabaseClient, userId: string, status?: string) {
      let query = supabase
        .from("Project")
        .select("*")
        .eq("userId", userId);
      if (status) query = query.eq("status", status);
      const { data, error } = await query.order("createdAt", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    async findUnique(supabase: AnySupabaseClient, id: string) {
      const { data, error } = await supabase
        .from("Project")
        .select("*")
        .eq("id", id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as Project | null;
    },
    async findActiveForJudgment(supabase: AnySupabaseClient, beforeDate: string) {
      const { data, error } = await supabase
        .from("Project")
        .select("*")
        .eq("status", "active")
        .lte("nextJudgmentDate", beforeDate);
      if (error) throw error;
      return data as Project[];
    },
    async create(supabase: AnySupabaseClient, data: {
      userId: string;
      name: string;
      description?: string | null;
      frequency?: string;
      judgmentDay?: number;
      customDays?: number | null;
      penaltyAmount?: number;
    }) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const nextJudgmentDate = calculateNextJudgmentDate(
        data.frequency || "weekly",
        data.judgmentDay || 0,
        data.customDays
      );
      const { data: project, error } = await supabase
        .from("Project")
        .insert({
          id,
          userId: data.userId,
          name: data.name,
          description: data.description || null,
          frequency: data.frequency || "weekly",
          judgmentDay: data.judgmentDay ?? 0,
          customDays: data.customDays || null,
          penaltyAmount: data.penaltyAmount ?? 1000,
          status: "active",
          nextJudgmentDate: nextJudgmentDate.toISOString(),
          submissionCount: 0,
          missedCount: 0,
          totalPenaltyAmount: 0,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();
      if (error) throw error;
      return project as Project;
    },
    async update(supabase: AnySupabaseClient, id: string, data: Partial<Project>) {
      const { data: project, error } = await supabase
        .from("Project")
        .update({ ...data, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return project as Project;
    },
    async delete(supabase: AnySupabaseClient, id: string) {
      const { error } = await supabase
        .from("Project")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    async count(supabase: AnySupabaseClient, userId: string) {
      const { count, error } = await supabase
        .from("Project")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId);
      if (error) throw error;
      return count || 0;
    },
    async incrementSubmissionCount(supabase: AnySupabaseClient, id: string) {
      const project = await this.findUnique(supabase, id);
      if (!project) throw new Error("Project not found");
      return this.update(supabase, id, {
        submissionCount: project.submissionCount + 1,
      });
    },
    async incrementMissedCount(supabase: AnySupabaseClient, id: string, penaltyAmount: number) {
      const project = await this.findUnique(supabase, id);
      if (!project) throw new Error("Project not found");
      return this.update(supabase, id, {
        missedCount: project.missedCount + 1,
        totalPenaltyAmount: project.totalPenaltyAmount + penaltyAmount,
      });
    },
    async updateNextJudgmentDate(supabase: AnySupabaseClient, id: string) {
      const project = await this.findUnique(supabase, id);
      if (!project) throw new Error("Project not found");
      const nextDate = calculateNextJudgmentDate(
        project.frequency,
        project.judgmentDay,
        project.customDays,
        project.nextJudgmentDate ? new Date(project.nextJudgmentDate) : undefined
      );
      return this.update(supabase, id, {
        nextJudgmentDate: nextDate.toISOString(),
      });
    },
  },

  // Submission operations
  submission: {
    async findMany(supabase: AnySupabaseClient, projectId: string) {
      const { data, error } = await supabase
        .from("Submission")
        .select("*")
        .eq("projectId", projectId)
        .order("sequenceNum", { ascending: false });
      if (error) throw error;
      return data as Submission[];
    },
    async findByUser(supabase: AnySupabaseClient, userId: string, limit?: number) {
      let query = supabase
        .from("Submission")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data as Submission[];
    },
    async findInPeriod(supabase: AnySupabaseClient, projectId: string, startDate: string, endDate: string) {
      const { data, error } = await supabase
        .from("Submission")
        .select("*")
        .eq("projectId", projectId)
        .gte("createdAt", startDate)
        .lt("createdAt", endDate);
      if (error) throw error;
      return data as Submission[];
    },
    async create(
      supabase: AnySupabaseClient,
      data: {
        userId: string;
        projectId: string;
        content: string;
        lineMessageId?: string | null;
      }
    ) {
      // Get next sequence number
      const { data: lastSubmission } = await supabase
        .from("Submission")
        .select("sequenceNum")
        .eq("projectId", data.projectId)
        .order("sequenceNum", { ascending: false })
        .limit(1)
        .single();

      const sequenceNum = (lastSubmission?.sequenceNum || 0) + 1;
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const { data: submission, error } = await supabase
        .from("Submission")
        .insert({
          id,
          userId: data.userId,
          projectId: data.projectId,
          sequenceNum,
          content: data.content,
          lineMessageId: data.lineMessageId || null,
          createdAt: now,
        })
        .select()
        .single();
      if (error) throw error;

      // Increment project submission count
      await db.project.incrementSubmissionCount(supabase, data.projectId);

      return submission as Submission;
    },
    async count(supabase: AnySupabaseClient, userId: string) {
      const { count, error } = await supabase
        .from("Submission")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId);
      if (error) throw error;
      return count || 0;
    },
    async countByProject(supabase: AnySupabaseClient, projectId: string) {
      const { count, error } = await supabase
        .from("Submission")
        .select("*", { count: "exact", head: true })
        .eq("projectId", projectId);
      if (error) throw error;
      return count || 0;
    },
    async findByLineMessageId(supabase: AnySupabaseClient, lineMessageId: string) {
      const { data, error } = await supabase
        .from("Submission")
        .select("*")
        .eq("lineMessageId", lineMessageId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as Submission | null;
    },
  },

  // JudgmentLog operations
  judgmentLog: {
    async findMany(supabase: AnySupabaseClient, userId: string, limit?: number) {
      let query = supabase
        .from("JudgmentLog")
        .select("*")
        .eq("userId", userId)
        .order("judgmentDate", { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data as JudgmentLog[];
    },
    async findByProject(supabase: AnySupabaseClient, projectId: string) {
      const { data, error } = await supabase
        .from("JudgmentLog")
        .select("*")
        .eq("projectId", projectId)
        .order("judgmentDate", { ascending: false });
      if (error) throw error;
      return data as JudgmentLog[];
    },
    async findLatestByProject(supabase: AnySupabaseClient, projectId: string) {
      const { data, error } = await supabase
        .from("JudgmentLog")
        .select("*")
        .eq("projectId", projectId)
        .order("judgmentDate", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as JudgmentLog | null;
    },
    async create(supabase: AnySupabaseClient, data: {
      userId: string;
      projectId: string;
      judgmentDate: string;
      submitted: boolean;
      penaltyExecuted?: boolean;
      penaltyAmount?: number | null;
    }) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const { data: log, error } = await supabase
        .from("JudgmentLog")
        .insert({
          id,
          userId: data.userId,
          projectId: data.projectId,
          judgmentDate: data.judgmentDate,
          submitted: data.submitted,
          penaltyExecuted: data.penaltyExecuted ?? false,
          penaltyAmount: data.penaltyAmount ?? null,
          createdAt: now,
        })
        .select()
        .single();
      if (error) throw error;
      return log as JudgmentLog;
    },
    async countMissed(supabase: AnySupabaseClient, userId: string) {
      const { count, error } = await supabase
        .from("JudgmentLog")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId)
        .eq("submitted", false);
      if (error) throw error;
      return count || 0;
    },
  },

  // PenaltyLog operations
  penaltyLog: {
    async findMany(supabase: AnySupabaseClient, userId: string) {
      const { data, error } = await supabase
        .from("PenaltyLog")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });
      if (error) throw error;
      return data as PenaltyLog[];
    },
    async create(supabase: AnySupabaseClient, data: {
      userId: string;
      amount: number;
      reason?: string | null;
    }) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const { data: log, error } = await supabase
        .from("PenaltyLog")
        .insert({
          id,
          userId: data.userId,
          amount: data.amount,
          stripePaymentId: null,
          status: "pending",
          reason: data.reason || null,
          createdAt: now,
        })
        .select()
        .single();
      if (error) throw error;
      return log as PenaltyLog;
    },
    async updateStatus(supabase: AnySupabaseClient, id: string, status: string, stripePaymentId?: string) {
      const { data: log, error } = await supabase
        .from("PenaltyLog")
        .update({
          status,
          stripePaymentId: stripePaymentId || null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return log as PenaltyLog;
    },
    async getTotalAmount(supabase: AnySupabaseClient, userId: string) {
      const { data, error } = await supabase
        .from("PenaltyLog")
        .select("amount")
        .eq("userId", userId)
        .eq("status", "completed");
      if (error) throw error;
      return (data || []).reduce((sum: number, log: { amount: number }) => sum + log.amount, 0);
    },
  },
};

// Helper function to calculate next judgment date
export function calculateNextJudgmentDate(
  frequency: string,
  judgmentDay: number,
  customDays?: number | null,
  baseDate?: Date
): Date {
  const reference = baseDate ? new Date(baseDate) : new Date();
  const result = new Date(reference);

  switch (frequency) {
    case "daily":
      // 翌日
      result.setDate(reference.getDate() + 1);
      break;
    case "weekly":
      // Find next occurrence of judgmentDay (0=Sunday, 1=Monday, etc.)
      const daysUntilNext = (judgmentDay - reference.getDay() + 7) % 7 || 7;
      result.setDate(reference.getDate() + daysUntilNext);
      break;
    case "biweekly":
      const daysUntilNextBi = (judgmentDay - reference.getDay() + 7) % 7 || 7;
      result.setDate(reference.getDate() + daysUntilNextBi + 7);
      break;
    case "monthly":
      result.setMonth(result.getMonth() + 1);
      result.setDate(1);
      // Find first occurrence of judgmentDay in next month
      while (result.getDay() !== judgmentDay) {
        result.setDate(result.getDate() + 1);
      }
      break;
    case "custom":
      if (customDays) {
        result.setDate(reference.getDate() + customDays);
      }
      break;
  }

  // Set time to end of day (23:59:59)
  result.setHours(23, 59, 59, 999);

  return result;
}
