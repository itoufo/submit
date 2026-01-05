import { NextResponse } from "next/server";
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
    const projects = await db.project.findMany(supabase, user.id);

    // Get article counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const { count } = await supabase
          .from("Article")
          .select("*", { count: "exact", head: true })
          .eq("projectId", project.id);
        return {
          ...project,
          _count: { articles: count || 0 },
        };
      })
    );

    return NextResponse.json(projectsWithCounts);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
