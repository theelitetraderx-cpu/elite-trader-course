import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/supabase/auth";
import { createSession, setSessionCookie } from "@/lib/auth";
import { isPortalStaff } from "@/lib/admin/roles";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, password, rememberMe } = parsed.data;
    const user = await authenticateUser(username.trim(), password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email/username or password" },
        { status: 401 }
      );
    }

    const token = await createSession(user);
    await setSessionCookie(token, rememberMe);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
      redirect: isPortalStaff(user.role) ? "/admin" : "/dashboard",
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
