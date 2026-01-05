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
    const supporters = await db.supporter.findMany(supabase, user.id);

    // Get supporter user details
    const supportersWithDetails = await Promise.all(
      supporters.map(async (s) => {
        const supporterUser = await db.user.findUnique(supabase, s.supporterUserId);
        return {
          ...s,
          supporter: supporterUser
            ? {
                id: supporterUser.id,
                name: supporterUser.name,
                email: supporterUser.email,
              }
            : null,
        };
      })
    );

    return NextResponse.json(supportersWithDetails);
  } catch (error) {
    console.error("Failed to fetch supporters:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
