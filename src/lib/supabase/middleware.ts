/**
 * Middleware helper para refresh de sessão Supabase em cada request.
 * Separa admin (área /dashboard…) de cliente (área /portal).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/api/integrations",
];
const ADMIN_PREFIXES = [
  "/dashboard",
  "/clients",
  "/projects",
  "/schedule",
  "/services",
  "/finance",
  "/settings",
];
const PORTAL_PREFIX = "/portal";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAdminRoute =
    pathname === "/" ||
    ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isPortalRoute =
    pathname === PORTAL_PREFIX || pathname.startsWith(PORTAL_PREFIX + "/");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  let isClient = false;
  if (user) {
    const { data: clientRow } = await supabase
      .from("clients")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    isClient = !!clientRow;
  }

  const isPasswordResetPage = pathname.startsWith("/login/redefinir-senha");

  if (user && pathname.startsWith("/login") && !isPasswordResetPage) {
    const url = request.nextUrl.clone();
    url.pathname = isClient ? "/portal" : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isClient && isAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  if (user && !isClient && isPortalRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = isClient ? "/portal" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
