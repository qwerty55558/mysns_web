"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import { toAbsoluteMediaUrl } from "@/lib/upload";
import { Avatar } from "@/features/messages/Avatar";

const SearchUsersQuery = graphql(`
  query SearchUsers($query: String!) {
    searchUsers(query: $query, limit: 30, offset: 0) {
      id
      username
      displayName
      avatarUrl
      followerCount
    }
  }
`);

const SearchPostsQuery = graphql(`
  query SearchPosts($query: String!) {
    searchPosts(query: $query, limit: 30, offset: 0) {
      id
      content
      imageUrls
      tag
      item
      author {
        id
        username
      }
    }
  }
`);

type Tab = "users" | "posts";

export function SearchView() {
  const [raw, setRaw] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("users");

  // 디바운스 — 입력 멈춘 뒤 250ms 후 실제 쿼리어 반영.
  useEffect(() => {
    const t = setTimeout(() => setQuery(raw.trim()), 250);
    return () => clearTimeout(t);
  }, [raw]);

  const active = query.length > 0;
  const userRes = useQuery(SearchUsersQuery, {
    variables: { query },
    skip: !active || tab !== "users",
    fetchPolicy: "cache-and-network",
  });
  const postRes = useQuery(SearchPostsQuery, {
    variables: { query },
    skip: !active || tab !== "posts",
    fetchPolicy: "cache-and-network",
  });

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const users = userRes.data?.searchUsers ?? [];
  const posts = postRes.data?.searchPosts ?? [];
  const loading = tab === "users" ? userRes.loading : postRes.loading;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-full border border-[color:var(--rule)] bg-[color:var(--paper)] px-4 py-2.5">
        <SearchIcon />
        <input
          ref={inputRef}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={tab === "users" ? "이름·아이디 검색" : "내용·해시태그 검색"}
          className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[color:var(--ink-soft)]"
        />
        {raw && (
          <button
            type="button"
            onClick={() => setRaw("")}
            aria-label="지우기"
            className="no-scale text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 rounded-full bg-[color:var(--rule)]/30 p-1 text-[12.5px] font-medium">
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          계정
        </TabButton>
        <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>
          해시태그·게시물
        </TabButton>
      </div>

      {!active && (
        <p className="py-12 text-center text-[13px] text-[color:var(--ink-soft)]">
          {tab === "users"
            ? "계정을 검색해보세요."
            : "관심 있는 소비 태그나 키워드를 검색해보세요."}
        </p>
      )}

      {active && loading && (users.length === 0 || posts.length === 0) && (
        <p className="px-1 text-[13px] text-[color:var(--ink-soft)]">검색 중…</p>
      )}

      {active && tab === "users" && (
        <ul className="flex flex-col">
          {!userRes.loading && users.length === 0 && (
            <EmptyResult />
          )}
          {users.map((u) => (
            <li key={u.id}>
              <Link
                href={`/u/${u.username}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[color:var(--rule)]/40"
              >
                <Avatar avatarUrl={u.avatarUrl} displayName={u.displayName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{u.username}</p>
                  <p className="truncate text-[12px] text-[color:var(--ink-soft)]">
                    {u.displayName} · 팔로워 {u.followerCount.toLocaleString()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {active && tab === "posts" && (
        <ul className="flex flex-col divide-y divide-[color:var(--rule)]/60">
          {!postRes.loading && posts.length === 0 && <EmptyResult />}
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/posts/${p.id}`}
                className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-[color:var(--rule)]/30"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[color:var(--rule)]">
                  {p.imageUrls?.[0] ? (
                    <Image
                      src={toAbsoluteMediaUrl(p.imageUrls[0])}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-[color:var(--ink-soft)]">
                      {p.tag ?? "글"}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  {(p.tag || p.item) && (
                    <p className="mb-0.5 flex gap-1 text-[11px] font-medium text-[color:var(--pay-forest)]">
                      {p.tag && <span>#{p.tag}</span>}
                      {p.item && <span className="text-[color:var(--ink-soft)]">{p.item}</span>}
                    </p>
                  )}
                  <p className="truncate text-[13px]">{p.content}</p>
                  <p className="truncate text-[11.5px] text-[color:var(--ink-soft)]">
                    @{p.author.username}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`no-scale flex-1 rounded-full px-3 py-1.5 transition-colors ${
        active
          ? "bg-[color:var(--paper)] text-[color:var(--foreground)] shadow-sm"
          : "text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyResult() {
  return (
    <p className="py-12 text-center text-[13px] text-[color:var(--ink-soft)]">
      검색 결과가 없어요.
    </p>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[color:var(--ink-soft)]"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
