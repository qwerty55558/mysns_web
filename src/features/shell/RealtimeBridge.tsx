"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useApolloClient } from "@apollo/client/react";

export function RealtimeBridge() {
  const { status } = useSession();
  const client = useApolloClient();

  useEffect(() => {
    if (status !== "authenticated") return;

    const es = new EventSource("/api/stream");

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
