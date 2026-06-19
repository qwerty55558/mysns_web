import { NextResponse } from "next/server";
import { auth } from "@/auth";

// nginx auth_request 게이트.
// ADMIN 세션만 200을 받아 Grafana(/grafana/) 프록시를 통과한다.
// 인가된 username을 X-WEBAUTH-USER 응답 헤더로 돌려주면, nginx가 이를
// Grafana auth.proxy 로 전달해 자동 로그인시킨다. (클라이언트가 보낸 동일 헤더는
// nginx 단에서 이 값으로 덮어써 위조를 막는다.)
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new NextResponse(null, { status: 401 });
  }
  const res = new NextResponse(null, { status: 200 });
  res.headers.set(
    "X-WEBAUTH-USER",
    session.user.username ?? session.user.id ?? "admin",
  );
  return res;
}
