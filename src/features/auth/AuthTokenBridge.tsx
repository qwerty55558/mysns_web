"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { setClientAuthToken } from "@/lib/auth-token";

export function AuthTokenBridge() {
  const { data } = useSession();
  useEffect(() => {
    setClientAuthToken(data?.accessToken ?? null);
  }, [data?.accessToken]);
  return null;
}
