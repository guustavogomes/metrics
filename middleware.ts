import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isTestPage = req.nextUrl.pathname.startsWith("/test");
  const isPublicPage = req.nextUrl.pathname === "/" || isAuthPage || isTestPage;

  // Bloquear acesso à rota de registro
  if (req.nextUrl.pathname.startsWith("/register")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
