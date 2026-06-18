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
  // 확장자가 있는 정적 파일(.jpg/.svg/.ico 등)은 제외 — 미들웨어가 가로채면
  // /public 의 이미지가 게스트에게 "/"로 307 리다이렉트되어 안 보인다.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.).*)"],
};
