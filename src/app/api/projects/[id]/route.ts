import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();

    const project = await db.project.findUnique(supabase, id);

    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get articles for this project
    const { data: articles } = await supabase
      .from("Article")
      .select("*")
      .eq("projectId", id)
      .order("createdAt", { ascending: false });

    const { count } = await supabase
      .from("Article")
      .select("*", { count: "exact", head: true })
      .eq("projectId", id);

    return NextResponse.json({
      ...project,
      articles: articles || [],
      _count: { articles: count || 0 },
    });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
