"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useApolloClient } from "@apollo/client/react";

const ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:8080/graphql";
const BASE = ENDPOINT.replace(/\/graphql\/?$/, "");

export function RealtimeBridge() {
  const { data, status } = useSession();
  const client = useApolloClient();
  // 토큰은 EventSource URL 쿼리에 박혀 연결 시점에 고정되므로,
  // 세션의 accessToken을 직접 deps로 두어 갱신될 때마다 재연결한다.
  // (in-memory getClientAuthToken은 비반응형이라 갱신을 놓쳤음)
  const token = data?.accessToken ?? null;

  useEffect(() => {
    if (status !== "authenticated") return;

    const url =
      `${BASE}/events/stream` +
      (token ? `?token=${encodeURIComponent(token)}` : "");

    const es = new EventSource(url);

    es.onopen = () => {
      void client.refetchQueries({
        include: [
          "Messages",
          "Conversations",
          "UnreadMessageCount",
          "UnreadNotificationCount",
          "Notifications",
        ],
      });
    };

    es.addEventListener("message", () => {
      void client.refetchQueries({
        include: ["Messages", "Conversations", "UnreadMessageCount"],
      });
    });

    es.addEventListener("notification", () => {
      void client.refetchQueries({
        include: ["UnreadNotificationCount", "Notifications"],
      });
    });

    return () => es.close();
  }, [status, client, token]);

  return null;
}
