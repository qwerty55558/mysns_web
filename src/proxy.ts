import { auth } from "@/auth";
import { NextResponse } from "next/server";

const GUEST_ONLY = new Set(["/", "/login", "/signup"]);
const PUBLIC = new Set(["/about", "/support", "/notices"]);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isAuthed = !!req.auth;

  if (GUEST_ONLY.has(path)) {
    if (isAuthed) return NextResponse.redirect(new URL("/home", req.nextUrl));
    return;
  }

  if (PUBLIC.has(path)) return;

  if (!isAuthed) return NextResponse.redirect(new URL("/", req.nextUrl));
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
