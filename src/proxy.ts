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

  // 인증 보호 라우트는 bfcache(뒤로가기 스냅샷)에 남기지 않는다.
  // no-store가 없으면 로그아웃 후 뒤로가기 시 로그인 상태 화면이 그대로
  // 복원되어 가드(위 redirect)가 새 요청 없이 우회된다.
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
});

export const config = {
  // 확장자가 있는 정적 파일(.jpg/.svg/.ico 등)은 제외 — 미들웨어가 가로채면
  // /public 의 이미지가 게스트에게 "/"로 307 리다이렉트되어 안 보인다.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.).*)"],
};
