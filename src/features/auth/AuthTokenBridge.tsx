"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { setClientAuthToken } from "@/lib/auth-token";

export function AuthTokenBridge() {
  const { data } = useSession();
  useEffect(() => {
    setClientAuthToken(data?.accessToken ?? null);
  }, [data?.accessToken]);

  useEffect(() => {
    if (data?.error === "RefreshAccessTokenError") {
      setClientAuthToken(null);
      void signOut({ redirectTo: "/login" });
    }
  }, [data?.error]);

  return null;
}
