import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["adopted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 自分のものか確認
    const candidate = await db.aiCandidate.findUnique(supabase, id);

    if (!candidate || candidate.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await db.aiCandidate.update(supabase, id, { status });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update candidate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
