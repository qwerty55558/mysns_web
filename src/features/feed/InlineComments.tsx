"use client";

import { useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import {
  PostCommentsQuery,
  CommentRow,
  CommentComposer,
} from "./CommentSheet";

const PAGE = 20;

// 상세 페이지/모달에서 댓글을 바닥 시트가 아니라 인라인으로 펼쳐 보여준다.
// 쿼리·뮤테이션·캐시 갱신은 CommentSheet와 동일 부품을 재사용하므로
// 시트에서 단 댓글과도 자동으로 동기화된다.
export function InlineComments({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const [loadingMore, setLoadingMore] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  const { data, loading, error, fetchMore } = useQuery(PostCommentsQuery, {
    variables: { postId, limit: PAGE, offset: 0 },
    notifyOnNetworkStatusChange: true,
  });

  const comments = data?.post?.comments ?? [];
  const total = data?.post?.commentCount ?? 0;
  const hasMore = comments.length < total;

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: { offset: comments.length },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.post) return prev;
          if (!prev.post) return fetchMoreResult;
          return {
            post: {
              ...fetchMoreResult.post,
              comments: [...prev.post.comments, ...fetchMoreResult.post.comments],
            },
          };
        },
      });
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5 shadow-[0_18px_38px_-28px_rgba(20,12,30,0.45)]">
      <header className="flex items-center gap-2 border-b border-[color:var(--rule)] px-5 py-3">
        <span className="text-[14px] font-semibold">댓글</span>
        {total > 0 && (
          <span className="text-[12px] text-[color:var(--ink-soft)]">
            {total.toLocaleString()}
          </span>
        )}
      </header>

      {loading && comments.length === 0 && (
        <p className="px-5 py-8 text-center text-[13px] text-[color:var(--ink-soft)]">
          댓글 불러오는 중…
        </p>
      )}
      {error && (
        <p className="px-5 py-8 text-center text-[13px] text-[color:var(--danger)]">
          에러: {error.message}
        </p>
      )}
      {!loading && !error && comments.length === 0 && (
        <p className="px-5 py-12 text-center text-[13px] text-[color:var(--ink-soft)]">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
        </p>
      )}

      <ul className="flex flex-col">
        {comments.map((c) => (
          <CommentRow
            key={c.id}
            comment={c}
            postId={postId}
            viewerId={session?.user?.id ?? null}
          />
        ))}
      </ul>

      {hasMore && (
        <div className="flex justify-center px-5 py-4">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-[color:var(--rule)] px-4 py-1.5 text-[12.5px] text-[color:var(--ink-soft)] transition-colors hover:border-[color:var(--pay)]/40 hover:text-[color:var(--foreground)] disabled:opacity-50"
          >
            {loadingMore ? "불러오는 중…" : "댓글 더 보기"}
          </button>
        </div>
      )}

      <div ref={listEndRef} />

      <CommentComposer
        postId={postId}
        authed={!!session?.user?.id}
        afterPost={() => {
          requestAnimationFrame(() => {
            listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          });
        }}
      />
    </section>
  );
}
