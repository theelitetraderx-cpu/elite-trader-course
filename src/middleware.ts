import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth-session";
import { isPortalStaff } from "@/lib/admin/roles";

const LOGIN_PATH = "/login";
const ADMIN_PREFIX = "/admin";
const DASHBOARD_PREFIX = "/dashboard";

/** Old marketing URLs — always send visitors to login / portal */
const MARKETING_PATHS = new Set([
  "/",
  "/courses",
  "/pricing",
  "/contact",
  "/about",
  "/community",
  "/signals",
]);

const STUDENT_ALLOWED_PATHS = new Set([
  "/dashboard",
  "/dashboard/notes",
  "/dashboard/profile",
  "/dashboard/meetings",
]);

function isStudentAllowedPath(pathname: string) {
  return STUDENT_ALLOWED_PATHS.has(pathname);
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL(LOGIN_PATH, request.url);
  if (pathname !== "/" && pathname !== LOGIN_PATH && !MARKETING_PATHS.has(pathname)) {
    loginUrl.searchParams.set("redirect", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

function redirectByRole(request: NextRequest, role: string) {
  const dest = isPortalStaff(role) ? "/admin" : "/dashboard";
  return NextResponse.redirect(new URL(dest, request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    if (pathname === LOGIN_PATH) {
      return NextResponse.next();
    }
    if (MARKETING_PATHS.has(pathname)) {
      return redirectToLogin(request, pathname);
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return redirectToLogin(request, pathname);
  }

  const legacyUpload = pathname.match(/^\/uploads\/(videos|ppt|notes)\/(.+)$/);
  if (legacyUpload) {
    const [, category, fileName] = legacyUpload;
    const contentUrl = new URL(
      `/api/content/${category}/${encodeURIComponent(decodeURIComponent(fileName))}`,
      request.url
    );
    return NextResponse.redirect(contentUrl);
  }

  if (pathname === LOGIN_PATH || MARKETING_PATHS.has(pathname)) {
    return redirectByRole(request, session.role);
  }

  if (pathname.startsWith(ADMIN_PREFIX) && !isPortalStaff(session.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    session.role === "student" &&
    pathname.startsWith(DASHBOARD_PREFIX) &&
    !isStudentAllowedPath(pathname)
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPortalStaff(session.role) && pathname.startsWith(DASHBOARD_PREFIX)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("x-user-role", session.role);
  response.headers.set("x-user-id", session.id);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/uploads/:path*",
  ],
};
