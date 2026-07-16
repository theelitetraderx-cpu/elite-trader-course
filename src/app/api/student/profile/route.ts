import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  getStoredUserById,
  updateUser,
} from "@/lib/data/user-store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = getStoredUserById(session.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      expiry_date: user.expiry_date,
      last_login: user.last_login,
      created_at: user.created_at,
    },
  });
}

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const user = updateUser(session.id, {
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        expiry_date: user.expiry_date,
        last_login: user.last_login,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

