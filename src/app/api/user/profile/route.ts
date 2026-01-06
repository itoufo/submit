import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const profile = await db.user.findUnique(supabase, user.id);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to get profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, notifyMorning, notifyEvening, notifyUrgent } = body;

    const supabase = createServiceClient();

    // 更新するフィールドのみを含むオブジェクトを作成
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (notifyMorning !== undefined) updates.notifyMorning = notifyMorning;
    if (notifyEvening !== undefined) updates.notifyEvening = notifyEvening;
    if (notifyUrgent !== undefined) updates.notifyUrgent = notifyUrgent;

    const updated = await db.user.update(supabase, user.id, updates);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
