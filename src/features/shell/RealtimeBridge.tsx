"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useApolloClient } from "@apollo/client/react";
import { getClientAuthToken } from "@/lib/auth-token";

const ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:8080/graphql";
const BASE = ENDPOINT.replace(/\/graphql\/?$/, "");

export function RealtimeBridge() {
  const { status } = useSession();
  const client = useApolloClient();

  useEffect(() => {
    if (status !== "authenticated") return;

    const token = getClientAuthToken();
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
  }, [status, client]);

  return null;
}
