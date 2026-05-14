"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";

const FeedQuery = graphql(`
  query Feed($limit: Int!, $offset: Int!) {
    feed(limit: $limit, offset: $offset) {
      id
      content
      createdAt
      likeCount
      commentCount
      author {
        id
        username
        displayName
      }
    }
  }
`);

export function Feed() {
  const { data, loading, error } = useQuery(FeedQuery, {
    variables: { limit: 10, offset: 0 },
  });

  if (loading) return <p className="text-zinc-500">Loading feed…</p>;
  if (error)
    return (
      <p className="text-red-600">
        Error: {error.message}
      </p>
    );

  const posts = data?.feed ?? [];
  if (posts.length === 0)
    return <p className="text-zinc-500">No posts yet.</p>;

  return (
    <ul className="flex flex-col gap-3 w-full">
      {posts.map((post) => (
        <li
          key={post.id}
          className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="text-sm text-zinc-500">
            @{post.author.username} · {post.author.displayName}
          </div>
          <p className="mt-1 text-zinc-900 dark:text-zinc-100">{post.content}</p>
          <div className="mt-2 text-xs text-zinc-500">
            ♥ {post.likeCount} · 💬 {post.commentCount}
          </div>
        </li>
      ))}
    </ul>
  );
}
