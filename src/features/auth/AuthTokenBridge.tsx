"use client";

import { useEffect } from "react";
import { getSession, signOut, useSession } from "next-auth/react";
import { setClientAuthToken } from "@/lib/auth-token";

export function AuthTokenBridge() {
  const { data } = useSession();
  // 토큰을 effect가 아닌 render 시점에 동기 반영한다. effect는 자식→부모 순으로
  // 실행돼 하위 컴포넌트의 useQuery가 토큰보다 먼저 요청을 쏠 수 있다(미인증 →
  // 비공개 글 빈 배열 캐시). render는 부모(이 컴포넌트는 layout 상위)가 먼저
  // 실행되므로 하위 쿼리보다 앞서 토큰이 준비된다. 서버 모듈 전역은 요청 간
  // 공유되므로 클라이언트에서만 set한다(다른 사용자에게 토큰 누수 방지).
  if (typeof window !== "undefined") {
    setClientAuthToken(data?.accessToken ?? null);
  }

  useEffect(() => {
    if (data?.error === "RefreshAccessTokenError") {
      setClientAuthToken(null);
      void signOut({ redirectTo: "/login" });
    }
  }, [data?.error]);

  // bfcache 복원(뒤로가기) 시 useSession 상태는 캐시된 스냅샷 그대로라
  // 로그아웃이 반영되지 않는다. 서버 세션을 새로 조회해 비어 있으면 내보낸다.
  // (Safari 등 no-store로도 bfcache를 유지하는 브라우저 보강)
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      void getSession().then((session) => {
        if (!session) window.location.replace("/");
      });
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return null;
}
