"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import { clearToken, getToken, onAuthChanged } from "@/lib/auth";

const MeQuery = graphql(`
  query Me {
    me {
      id
      username
      displayName
    }
  }
`);

export function MeBadge() {
  const client = useApolloClient();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getToken()));
    return onAuthChanged(() => setHasToken(Boolean(getToken())));
  }, []);

  const { data, loading } = useQuery(MeQuery, { skip: !hasToken });

  const onSignOut = async () => {
    clearToken();
    await client.resetStore();
  };

  if (!hasToken) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center rounded-full bg-pay px-4 py-1.5 text-[12.5px] font-semibold text-[color:var(--pay-on)] shadow-[0_6px_18px_-10px_rgba(3,199,90,0.7)] transition-[transform,filter] hover:brightness-105 active:scale-[0.98]"
      >
        Sign in
      </Link>
    );
  }

  if (loading) {
    return (
      <span className="text-[12px] text-[color:var(--ink-soft)]">…</span>
    );
  }

  const me = data?.me;
  if (!me) {
    return (
      <button
        onClick={onSignOut}
        className="rounded-full border border-[color:var(--rule)] px-4 py-1.5 text-[12.5px] text-[color:var(--foreground)] transition-colors hover:border-[color:var(--pay)]/40"
      >
        Sign out
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-[12.5px]">
      <span className="flex items-center gap-2">
        <span className="bg-pay-gradient inline-flex h-7 w-7 items-center justify-center rounded-full p-[2px]">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[color:var(--paper)] text-[10.5px] font-semibold">
            {me.displayName.charAt(0).toUpperCase()}
          </span>
        </span>
        <span>
          <span className="font-medium">{me.displayName}</span>{" "}
          <span className="text-[color:var(--ink-soft)]">@{me.username}</span>
        </span>
      </span>
      <button
        onClick={onSignOut}
        className="rounded-full border border-[color:var(--rule)] px-3 py-1 text-[11.5px] text-[color:var(--ink-soft)] transition-colors hover:border-[color:var(--pay)]/40 hover:text-[color:var(--foreground)]"
      >
        Sign out
      </button>
    </div>
  );
}
