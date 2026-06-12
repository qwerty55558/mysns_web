"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { useSession } from "next-auth/react";
import { graphql } from "@/gql";
import { Heart } from "@/components/insta-icons";

const PAGE = 20;

export const PostCommentsQuery = graphql(`
  query PostComments($postId: ID!, $limit: Int!, $offset: Int!) {
    post(id: $postId) {
      id
      commentCount
      comments(limit: $limit, offset: $offset) {
        id
        content
        createdAt
        likeCount
        viewerHasLiked
        author {
          id
          username
          displayName
          avatarUrl
        }
      }
    }
  }
`);

const AddCommentMutation = graphql(`
  mutation AddComment($input: CreateCommentInput!) {
    addComment(input: $input) {
      id
      content
      createdAt
      likeCount
      viewerHasLiked
      author {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`);

const LikeCommentMutation = graphql(`
  mutation LikeComment($id: ID!) {
    likeComment(id: $id) {
      id
      likeCount
      viewerHasLiked
    }
  }
`);

const UnlikeCommentMutation = graphql(`
  mutation UnlikeComment($id: ID!) {
    unlikeComment(id: $id) {
      id
      likeCount
      viewerHasLiked
    }
  }
`);

const DeleteCommentMutation = graphql(`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`);

type Props = {
  postId: string;
  open: boolean;
  onClose: () => void;
};

export function CommentSheet({ postId, open, onClose }: Props) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Staged mount → paint → animate-in / animate-out → unmount lifecycle
  // requires successive setState calls inside an effect; the standard rule
  // doesn't model this animation pattern.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
    if (mounted) {
      setShown(false);
      const t = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!shown) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [shown]);

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shown, onClose]);

  const { data, loading, error, fetchMore } = useQuery(PostCommentsQuery, {
    variables: { postId, limit: PAGE, offset: 0 },
    skip: !mounted,
    notifyOnNetworkStatusChange: true,
  });

  if (!mounted) return null;

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
              comments: [
                ...prev.post.comments,
                ...fetchMoreResult.post.comments,
              ],
            },
          };
        },
      });
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="댓글"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/45 transition-opacity duration-200 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-[color:var(--paper)] shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out sm:rounded-2xl sm:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] ${
          shown
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-full opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
        style={{ height: "min(80vh, 720px)" }}
      >
        <header className="flex items-center justify-between border-b border-[color:var(--rule)] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold">댓글</span>
            {total > 0 && (
              <span className="text-[12px] text-[color:var(--ink-soft)]">
                {total.toLocaleString()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition-colors hover:bg-[color:var(--rule)]/50 hover:text-[color:var(--foreground)]"
          >
            <CloseIcon />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
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
              아직 댓글이 없습니다.
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
                {loadingMore ? "불러오는 중…" : "더 보기"}
              </button>
            </div>
          )}
        </div>

        <CommentComposer
          postId={postId}
          authed={!!session?.user?.id}
          afterPost={() => {
            requestAnimationFrame(() => {
              const el = scrollRef.current;
              if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            });
          }}
        />
      </div>
    </div>
  );
}

type CommentRowData = {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  viewerHasLiked: boolean;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
};

export function CommentRow({
  comment,
  postId,
  viewerId,
}: {
  comment: CommentRowData;
  postId: string;
  viewerId: string | null;
}) {
  const isMine = viewerId != null && viewerId === comment.author.id;
  const [likeComment] = useMutation(LikeCommentMutation);
  const [unlikeComment] = useMutation(UnlikeCommentMutation);
  const [deleteComment, { loading: deleting }] = useMutation(
    DeleteCommentMutation,
  );

  const toggleLike = () => {
    if (!viewerId) return;
    if (comment.viewerHasLiked) {
      void unlikeComment({
        variables: { id: comment.id },
        optimisticResponse: {
          unlikeComment: {
            id: comment.id,
            likeCount: Math.max(0, comment.likeCount - 1),
            viewerHasLiked: false,
          },
        },
      });
    } else {
      void likeComment({
        variables: { id: comment.id },
        optimisticResponse: {
          likeComment: {
            id: comment.id,
            likeCount: comment.likeCount + 1,
            viewerHasLiked: true,
          },
        },
      });
    }
  };

  const onDelete = async () => {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    await deleteComment({
      variables: { id: comment.id },
      update: (cache) => {
        const postCacheId = cache.identify({ __typename: "Post", id: postId });
        if (postCacheId) {
          cache.modify({
            id: postCacheId,
            fields: {
              commentCount(existing) {
                return Math.max(0, (typeof existing === "number" ? existing : 0) - 1);
              },
              comments(existing: ReadonlyArray<{ __ref: string }> = [], { readField }) {
                return existing.filter(
                  (ref) => readField("id", ref) !== comment.id,
                );
              },
              previewComment(existing, { readField }) {
                if (existing && readField("id", existing) === comment.id) return null;
                return existing;
              },
            },
          });
        }
        const id = cache.identify({ __typename: "Comment", id: comment.id });
        if (id) cache.evict({ id });
        cache.gc();
      },
    });
  };

  return (
    <li className="flex items-start gap-3 border-b border-[color:var(--rule)]/60 px-5 py-3 last:border-b-0">
      <span className="bg-pay-gradient inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-[2px]">
        <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[10.5px] font-semibold">
          {comment.author.avatarUrl ? (
            <Image
              src={comment.author.avatarUrl}
              alt=""
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          ) : (
            comment.author.displayName.charAt(0).toUpperCase()
          )}
        </span>
      </span>
      <div className="flex-1">
        <p className="text-[13px] leading-snug">
          <span className="font-semibold">{comment.author.username}</span>{" "}
          <span className="text-[color:var(--foreground)]/85">
            {comment.content}
          </span>
        </p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-[color:var(--ink-soft)]">
          <time dateTime={comment.createdAt}>{formatAge(comment.createdAt)}</time>
          {comment.likeCount > 0 && (
            <span>좋아요 {comment.likeCount.toLocaleString()}</span>
          )}
          {isMine && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="transition-colors hover:text-[color:var(--danger)] disabled:opacity-50"
            >
              {deleting ? "삭제 중…" : "삭제"}
            </button>
          )}
        </div>
      </div>
      {viewerId && (
        <button
          type="button"
          onClick={toggleLike}
          aria-label={comment.viewerHasLiked ? "댓글 좋아요 취소" : "댓글 좋아요"}
          className="mt-1 shrink-0 transition-transform active:scale-90"
        >
          <Heart
            filled={comment.viewerHasLiked}
            className={`h-[14px] w-[14px] ${
              comment.viewerHasLiked
                ? "text-[color:var(--pay)]"
                : "text-[color:var(--ink-soft)]"
            }`}
          />
        </button>
      )}
    </li>
  );
}

export function CommentComposer({
  postId,
  authed,
  afterPost,
}: {
  postId: string;
  authed: boolean;
  afterPost: () => void;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addComment, { loading }] = useMutation(AddCommentMutation);

  if (!authed) {
    return (
      <div className="border-t border-[color:var(--rule)] px-5 py-4 text-center text-[12.5px] text-[color:var(--ink-soft)]">
        댓글을 작성하려면 로그인해 주세요.
      </div>
    );
  }

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && !loading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      await addComment({
        variables: { input: { postId, content: trimmed } },
        update: (cache, { data }) => {
          const created = data?.addComment;
          if (!created) return;
          const ref = cache.writeFragment({
            data: created,
            fragment: graphql(`
              fragment NewComment on Comment {
                id
                content
                createdAt
                likeCount
                viewerHasLiked
                author {
                  id
                  username
                  displayName
                  avatarUrl
                }
              }
            `),
          });
          const postCacheId = cache.identify({ __typename: "Post", id: postId });
          if (!postCacheId) return;
          cache.modify({
            id: postCacheId,
            fields: {
              commentCount(existing) {
                return (typeof existing === "number" ? existing : 0) + 1;
              },
              comments(existing) {
                if (!ref) return existing;
                return Array.isArray(existing) ? [...existing, ref] : [ref];
              },
            },
          });
        },
      });
      setContent("");
      afterPost();
    } catch (err) {
      if (CombinedGraphQLErrors.is(err) && err.errors.length > 0) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("댓글 작성에 실패했습니다.");
      }
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-1 border-t border-[color:var(--rule)] px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <input
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError(null);
          }}
          placeholder="댓글 달기…"
          maxLength={500}
          disabled={loading}
          className="flex-1 rounded-full border border-[color:var(--rule)] bg-[color:var(--background)] px-4 py-2 text-[13.5px] outline-none transition-colors focus:border-[color:var(--foreground)]/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center rounded-full bg-pay px-4 py-2 text-[12.5px] font-semibold text-[color:var(--pay-on)] shadow-[0_6px_18px_-10px_rgba(3,199,90,0.7)] transition-[filter,transform] hover:brightness-105 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {loading ? "…" : "등록"}
        </button>
      </div>
      {error && (
        <p role="alert" className="px-1 text-[11.5px] text-[color:var(--danger)]">
          {error}
        </p>
      )}
    </form>
  );
}

function formatAge(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const m = Math.floor(Math.max(0, Date.now() - t) / 60_000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(t).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
