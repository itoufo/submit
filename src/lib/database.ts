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
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type Memo = {
  id: string;
  userId: string;
  content: string;
  type: string;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiCandidate = {
  id: string;
  userId: string;
  content: string;
  format: string;
  persona: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSuggestion = {
  id: string;
  userId: string;
  title: string;
  description: string;
  reasoning: string;
  memoIds: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  userId: string;
  suggestionId: string | null;
  title: string;
  description: string | null;
  rule: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Article = {
  id: string;
  projectId: string;
  candidateId: string | null;
  content: string;
  publishedAt: string | null;
  platform: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Supporter = {
  id: string;
  userId: string;
  supporterUserId: string;
  status: string;
  inviteToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
};

export type Cheer = {
  id: string;
  userId: string;
  supporterUserId: string;
  message: string;
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
          role: data.role || "user",
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
  },

  // Memo operations
  memo: {
    async findMany(supabase: AnySupabaseClient, userId: string) {
      const { data, error } = await supabase
        .from("Memo")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });
      if (error) throw error;
      return data as Memo[];
    },
    async findUnique(supabase: AnySupabaseClient, id: string) {
      const { data, error } = await supabase
        .from("Memo")
        .select("*")
        .eq("id", id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as Memo | null;
    },
    async create(supabase: AnySupabaseClient, data: { userId: string; content: string; type?: string; tags?: string | null }) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const { data: memo, error } = await supabase
        .from("Memo")
        .insert({
          id,
          userId: data.userId,
          content: data.content,
          type: data.type || "text",
          tags: data.tags || null,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();
      if (error) throw error;
      return memo as Memo;
    },
    async update(supabase: AnySupabaseClient, id: string, data: Partial<Memo>) {
      const { data: memo, error } = await supabase
        .from("Memo")
        .update({ ...data, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return memo as Memo;
    },
    async delete(supabase: AnySupabaseClient, id: string) {
      const { error } = await supabase
        .from("Memo")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    async count(supabase: AnySupabaseClient, userId: string) {
      const { count, error } = await supabase
        .from("Memo")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId);
      if (error) throw error;
      return count || 0;
    },
  },

  // AiCandidate operations
  aiCandidate: {
    async findMany(supabase: AnySupabaseClient, userId: string, status?: string) {
      let query = supabase
        .from("AiCandidate")
        .select("*")
        .eq("userId", userId);
      if (status) query = query.eq("status", status);
      const { data, error } = await query.order("createdAt", { ascending: false });
      if (error) throw error;
      return data as AiCandidate[];
    },
    async findUnique(supabase: AnySupabaseClient, id: string) {
      const { data, error } = await supabase
        .from("AiCandidate")
        .select("*")
        .eq("id", id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as AiCandidate | null;
    },
    async create(supabase: AnySupabaseClient, data: { userId: string; content: string; format?: string; persona?: string | null }) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const { data: candidate, error } = await supabase
        .from("AiCandidate")
        .insert({
          id,
          userId: data.userId,
          content: data.content,
          format: data.format || "tweet",
          persona: data.persona || null,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();
      if (error) throw error;
      return candidate as AiCandidate;
    },
    async update(supabase: AnySupabaseClient, id: string, data: Partial<AiCandidate>) {
      const { data: candidate, error } = await supabase
        .from("AiCandidate")
        .update({ ...data, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return candidate as AiCandidate;
    },
    async delete(supabase: AnySupabaseClient, id: string) {
      const { error } = await supabase
        .from("AiCandidate")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    async count(supabase: AnySupabaseClient, userId: string) {
      const { count, error } = await supabase
        .from("AiCandidate")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId);
      if (error) throw error;
      return count || 0;
    },
  },

  // ProjectSuggestion operations
  projectSuggestion: {
    async findMany(supabase: AnySupabaseClient, userId: string, status?: string) {
      let query = supabase
        .from("ProjectSuggestion")
        .select("*")
        .eq("userId", userId);
      if (status) query = query.eq("status", status);
      const { data, error } = await query.order("createdAt", { ascending: false });
      if (error) throw error;
      return data as ProjectSuggestion[];
    },
    async findUnique(supabase: AnySupabaseClient, id: string) {
      const { data, error } = await supabase
        .from("ProjectSuggestion")
        .select("*")
        .eq("id", id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as ProjectSuggestion | null;
    },
    async create(supabase: AnySupabaseClient, data: { userId: string; title: string; description: string; reasoning: string; memoIds: string }) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const { data: suggestion, error } = await supabase
        .from("ProjectSuggestion")
        .insert({
          id,
          userId: data.userId,
          title: data.title,
          description: data.description,
          reasoning: data.reasoning,
          memoIds: data.memoIds,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();
      if (error) throw error;
      return suggestion as ProjectSuggestion;
    },
    async update(supabase: AnySupabaseClient, id: string, data: Partial<ProjectSuggestion>) {
      const { data: suggestion, error } = await supabase
        .from("ProjectSuggestion")
        .update({ ...data, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return suggestion as ProjectSuggestion;
    },
  },

  // Project operations
  project: {
    async findMany(supabase: AnySupabaseClient, userId: string) {
      const { data, error } = await supabase
        .from("Project")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });
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
    async create(supabase: AnySupabaseClient, data: { userId: string; title: string; description?: string | null; rule?: string | null; suggestionId?: string | null }) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const { data: project, error } = await supabase
        .from("Project")
        .insert({
          id,
          userId: data.userId,
          title: data.title,
          description: data.description || null,
          rule: data.rule || null,
          suggestionId: data.suggestionId || null,
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
  },

  // Supporter operations
  supporter: {
    async findMany(supabase: AnySupabaseClient, userId: string) {
      const { data, error } = await supabase
        .from("Supporter")
        .select("*")
        .eq("userId", userId);
      if (error) throw error;
      return data as Supporter[];
    },
    async findByToken(supabase: AnySupabaseClient, token: string) {
      const { data, error } = await supabase
        .from("Supporter")
        .select("*")
        .eq("inviteToken", token)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as Supporter | null;
    },
    async create(supabase: AnySupabaseClient, data: { userId: string; supporterUserId: string; inviteToken?: string | null }) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const { data: supporter, error } = await supabase
        .from("Supporter")
        .insert({
          id,
          userId: data.userId,
          supporterUserId: data.supporterUserId,
          status: "pending",
          inviteToken: data.inviteToken || null,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();
      if (error) throw error;
      return supporter as Supporter;
    },
    async update(supabase: AnySupabaseClient, id: string, data: Partial<Supporter>) {
      const { data: supporter, error } = await supabase
        .from("Supporter")
        .update({ ...data, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return supporter as Supporter;
    },
  },

  // Cheer operations
  cheer: {
    async findMany(supabase: AnySupabaseClient, userId: string) {
      const { data, error } = await supabase
        .from("Cheer")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });
      if (error) throw error;
      return data as Cheer[];
    },
    async create(supabase: AnySupabaseClient, data: { userId: string; supporterUserId: string; message: string }) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const { data: cheer, error } = await supabase
        .from("Cheer")
        .insert({
          id,
          userId: data.userId,
          supporterUserId: data.supporterUserId,
          message: data.message,
          createdAt: now,
        })
        .select()
        .single();
      if (error) throw error;
      return cheer as Cheer;
    },
  },

  // Notification operations
  notification: {
    async findMany(supabase: AnySupabaseClient, userId: string, unreadOnly = false) {
      let query = supabase
        .from("Notification")
        .select("*")
        .eq("userId", userId);
      if (unreadOnly) query = query.eq("read", false);
      const { data, error } = await query.order("createdAt", { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
    async create(supabase: AnySupabaseClient, data: { userId: string; type: string; content: string }) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const { data: notification, error } = await supabase
        .from("Notification")
        .insert({
          id,
          userId: data.userId,
          type: data.type,
          content: data.content,
          read: false,
          createdAt: now,
        })
        .select()
        .single();
      if (error) throw error;
      return notification as Notification;
    },
    async markAsRead(supabase: AnySupabaseClient, id: string) {
      const { error } = await supabase
        .from("Notification")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
  },
};
