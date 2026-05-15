"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import { PostCard } from "./PostCard";

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
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
