"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { graphql } from "@/gql";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";

const PAGE_SIZE = 3;

const FeedQuery = graphql(`
  query Feed($limit: Int!, $offset: Int!) {
    feed(limit: $limit, offset: $offset) {
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
      author {
        id
        username
        displayName
        avatarUrl
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

export function Feed() {
  const { status } = useSession();
  const { data, loading, error, fetchMore } = useQuery(FeedQuery, {
    variables: { limit: PAGE_SIZE, offset: 0 },
    notifyOnNetworkStatusChange: true,
  });

  const posts = data?.feed ?? [];
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
            if (!fetchMoreResult?.feed?.length) {
              setHasMore(false);
              return prev;
            }
            if (fetchMoreResult.feed.length < PAGE_SIZE) {
              setHasMore(false);
            }
            const known = new Set(prev.feed.map((p) => p.id));
            const next = fetchMoreResult.feed.filter((p) => !known.has(p.id));
            return { feed: [...prev.feed, ...next] };
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
      {status === "authenticated" && <PostComposer />}

      {loading && posts.length === 0 && (
        <p className="text-sm text-[color:var(--ink-soft)]">피드 불러오는 중…</p>
      )}
      {error && (
        <p className="text-sm text-[color:var(--danger)]">에러: {error.message}</p>
      )}
      {!loading && !error && posts.length === 0 && (
        <p className="text-sm text-[color:var(--ink-soft)]">
          아직 게시물이 없습니다.
        </p>
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
