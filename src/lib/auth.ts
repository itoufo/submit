import { createClient, createServiceClient } from "@/lib/supabase/server";
import { db, User } from "./database";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export type UserWithProfile = {
  id: string;
  email?: string;
  pledgedAt: string | null;
  profile: User | null;
};

export async function getUserWithProfile(): Promise<UserWithProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // サービスクライアントでsubmitスキーマにアクセス
  const serviceClient = createServiceClient();
  let profile = await db.user.findUnique(serviceClient, user.id);

  if (!profile) {
    profile = await db.user.create(serviceClient, {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || null,
      image: user.user_metadata?.avatar_url || null,
    });
  }

  return {
    id: user.id,
    email: user.email,
    pledgedAt: profile?.pledgedAt || null,
    profile,
  };
}

export async function ensureUserExists(userId: string, email: string) {
  const serviceClient = createServiceClient();
  const existing = await db.user.findUnique(serviceClient, userId);

  if (!existing) {
    return await db.user.create(serviceClient, {
      id: userId,
      email: email,
    });
  }

  return existing;
}
