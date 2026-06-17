"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import { PostCard } from "./PostCard";

const PAGE_SIZE = 6;

const BookmarksQuery = graphql(`
  query Bookmarks($limit: Int!, $offset: Int!) {
    bookmarks(limit: $limit, offset: $offset) {
      id
      content
      createdAt
      imageUrls
      tag
      item
      amount
      place {
        latitude
        longitude
        name
        address
        externalId
        categoryName
        categoryCode
      }
      likeCount
      commentCount
      shareCount
      viewerHasLiked
      viewerHasBookmarked
      theme
      author {
        id
        username
        displayName
        avatarUrl
        activeTheme
        activeEmphasis
        activeFont
        isSubscriber
      }
      previewComment {
        id
        content
        author {
          id
          username
        }
      }
    }
  }
`);

export function Bookmarks() {
  const { data, loading, error, fetchMore } = useQuery(BookmarksQuery, {
    variables: { limit: PAGE_SIZE, offset: 0 },
    notifyOnNetworkStatusChange: true,
  });

  const posts = data?.bookmarks ?? [];
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loadingRef.current) return;
        if (posts.length === 0) return;

        loadingRef.current = true;
        setLoadingMore(true);
        fetchMore({
          variables: { limit: PAGE_SIZE, offset: posts.length },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult?.bookmarks?.length) {
              setHasMore(false);
              return prev;
            }
            if (fetchMoreResult.bookmarks.length < PAGE_SIZE) {
              setHasMore(false);
            }
            const known = new Set(prev.bookmarks.map((p) => p.id));
            const next = fetchMoreResult.bookmarks.filter((p) => !known.has(p.id));
            return { bookmarks: [...prev.bookmarks, ...next] };
          },
        }).finally(() => {
          loadingRef.current = false;
          setLoadingMore(false);
        });
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [posts.length, hasMore, fetchMore]);

  return (
    <div className="flex flex-col gap-6">
      {loading && posts.length === 0 && (
        <p className="text-sm text-[color:var(--ink-soft)]">북마크 불러오는 중…</p>
      )}
      {error && (
        <p className="text-sm text-[color:var(--danger)]">에러: {error.message}</p>
      )}
      {!loading && !error && posts.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm text-[color:var(--ink-soft)]">
            아직 북마크한 게시물이 없습니다.
          </p>
          <p className="text-[12px] text-[color:var(--ink-soft)]/70">
            마음에 드는 게시글은 북마크해서 다시 꺼내볼 수 있어요.
          </p>
        </div>
      )}

      {posts.length > 0 && (
        <ul className="flex flex-col gap-6">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}

      {hasMore && posts.length > 0 && (
        <div
          ref={sentinelRef}
          className="flex h-12 items-center justify-center text-[12px] text-[color:var(--ink-soft)]"
        >
          {loadingMore ? "더 불러오는 중…" : ""}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="pb-2 text-center text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          끝까지 봤어요
        </p>
      )}
    </div>
  );
}
