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
    const cheers = await db.cheer.findMany(supabase, user.id);

    // Get supporter user details
    const cheersWithDetails = await Promise.all(
      cheers.map(async (c) => {
        const supporterUser = await db.user.findUnique(supabase, c.supporterUserId);
        return {
          ...c,
          supporter: supporterUser
            ? {
                name: supporterUser.name,
                email: supporterUser.email,
              }
            : null,
        };
      })
    );

    return NextResponse.json(cheersWithDetails);
  } catch (error) {
    console.error("Failed to fetch cheers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
