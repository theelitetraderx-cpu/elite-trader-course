import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { enrichSessionUser } from "@/lib/admin/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: enrichSessionUser(session) });
}
