"use client";

import Image from "next/image";
import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import { Bookmark, Bubble, Dots, Heart, Send } from "@/components/insta-icons";

const FeedQuery = graphql(`
  query Feed($limit: Int!, $offset: Int!) {
    feed(limit: $limit, offset: $offset) {
      id
      content
      createdAt
      imageUrls
      tag
      likeCount
      commentCount
      shareCount
      viewerHasLiked
      viewerHasBookmarked
      author {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`);

function formatAge(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffMs = Math.max(0, Date.now() - t);
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

export function Feed() {
  const { data, loading, error } = useQuery(FeedQuery, {
    variables: { limit: 10, offset: 0 },
  });

  if (loading)
    return (
      <p className="text-sm text-[color:var(--ink-soft)]">피드 불러오는 중…</p>
    );
  if (error)
    return (
      <p className="text-sm text-[color:var(--danger)]">에러: {error.message}</p>
    );

  const posts = data?.feed ?? [];
  if (posts.length === 0)
    return (
      <p className="text-sm text-[color:var(--ink-soft)]">
        아직 게시물이 없습니다.
      </p>
    );

  return (
    <ul className="flex flex-col gap-6">
      {posts.map((post) => {
        const cover = post.imageUrls[0];
        const hasCover = Boolean(cover);
        return (
          <li key={post.id}>
            <article className="overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5 shadow-[0_18px_38px_-28px_rgba(20,12,30,0.45)]">
              <header className="flex items-center gap-2.5 px-4 py-3">
                <span className="bg-pay-gradient inline-flex h-9 w-9 items-center justify-center rounded-full p-[2px]">
                  <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[12px] font-semibold tracking-wide">
                    {post.author.avatarUrl ? (
                      <Image
                        src={post.author.avatarUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      post.author.displayName.charAt(0).toUpperCase()
                    )}
                  </span>
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-[13px] font-semibold">
                    {post.author.username}
                  </span>
                  <span className="text-[11px] text-[color:var(--ink-soft)]">
                    {post.author.displayName}
                  </span>
                </div>
                <span className="ml-auto text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                  {formatAge(post.createdAt)}
                </span>
                <Dots className="ml-2 h-4 w-4 text-[color:var(--ink-soft)]" />
              </header>

              {hasCover && (
                <div className="relative aspect-square w-full">
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
                  />
                  {post.tag && (
                    <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--pay-forest)] ring-1 ring-[color:var(--pay)]/25 backdrop-blur-sm">
                      {post.tag}
                    </span>
                  )}
                  {post.imageUrls.length > 1 && (
                    <span className="absolute right-3 top-3 rounded-full bg-black/65 px-2 py-0.5 font-mono text-[10.5px] tabular-nums text-white">
                      1 / {post.imageUrls.length}
                    </span>
                  )}
                </div>
              )}

              <footer className="flex flex-col gap-2 px-4 pb-4 pt-3">
                <div className="flex items-center gap-4">
                  <Heart
                    filled={post.viewerHasLiked}
                    className={`h-[22px] w-[22px] ${
                      post.viewerHasLiked
                        ? "text-[color:var(--pay)]"
                        : "text-[color:var(--foreground)]"
                    }`}
                  />
                  <Bubble className="h-[22px] w-[22px] text-[color:var(--foreground)]" />
                  <Send className="h-[22px] w-[22px] text-[color:var(--foreground)]" />
                  <Bookmark
                    filled={post.viewerHasBookmarked}
                    className={`ml-auto h-[22px] w-[22px] ${
                      post.viewerHasBookmarked
                        ? "text-[color:var(--pay)]"
                        : "text-[color:var(--foreground)]"
                    }`}
                  />
                </div>
                {!hasCover && post.tag && (
                  <span className="inline-flex w-fit items-center rounded-full bg-[color:var(--pay)]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--pay-forest)]">
                    {post.tag}
                  </span>
                )}
                <p className="text-[13px] font-semibold">
                  좋아요 {post.likeCount.toLocaleString()}개
                </p>
                <p className="text-[13.5px] leading-snug">
                  <span className="font-semibold">{post.author.username}</span>{" "}
                  <span className="text-[color:var(--foreground)]/85">
                    {post.content}
                  </span>
                </p>
                <div className="flex items-center gap-3 text-[12px] text-[color:var(--ink-soft)]">
                  {post.commentCount > 0 && (
                    <button type="button" className="hover:text-[color:var(--foreground)]">
                      댓글 {post.commentCount}개 모두 보기
                    </button>
                  )}
                  {post.shareCount > 0 && (
                    <span className="font-mono tabular-nums">
                      ↗ {post.shareCount.toLocaleString()}
                    </span>
                  )}
                </div>
              </footer>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
