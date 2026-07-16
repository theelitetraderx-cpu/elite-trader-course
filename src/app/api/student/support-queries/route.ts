import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import {
  createSupportQuery,
  listQueriesForUser,
} from "@/lib/data/support-query-store";

const createSchema = z.object({
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Please describe your issue in more detail"),
  category: z.enum(["general", "billing", "technical", "course", "account"]),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureAppDataLoaded();
  return NextResponse.json({ queries: listQueriesForUser(session.id) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await ensureAppDataLoaded();
    const query = createSupportQuery({
      ...parsed.data,
      user_id: session.id,
      user_name: session.full_name,
      user_email: session.email,
    });

    return NextResponse.json({ query });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit query";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
