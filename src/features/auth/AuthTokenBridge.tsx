"use client";

import { useEffect } from "react";
import { getSession, signOut, useSession } from "next-auth/react";

export function AuthTokenBridge() {
  const { data } = useSession();

  useEffect(() => {
    if (data?.error === "RefreshAccessTokenError") {
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
