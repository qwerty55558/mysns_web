"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { graphql } from "@/gql";
import { toAbsoluteMediaUrl } from "@/lib/upload";
import { UserListModal, type ConnTab } from "./UserListModal";

const ProfileQuery = graphql(`
  query Profile($username: String!) {
    userByUsername(username: $username) {
      id
      username
      displayName
      bio
      avatarUrl
      postCount
      followerCount
      followingCount
      privateAccount
      viewerIsFollowing
      viewerHasRequestedFollow
      posts(limit: 30, offset: 0) {
        id
        imageUrls
        item
        amount
        likeCount
        commentCount
      }
    }
  }
`);

const FollowMutation = graphql(`
  mutation FollowUser($id: ID!) {
    followUser(id: $id) {
      id
      followerCount
      viewerIsFollowing
      viewerHasRequestedFollow
    }
  }
`);

const UnfollowMutation = graphql(`
  mutation UnfollowUser($id: ID!) {
    unfollowUser(id: $id) {
      id
      followerCount
      viewerIsFollowing
    }
  }
`);

export function ProfileView({ username }: { username: string }) {
  const { data: session } = useSession();
  const [connTab, setConnTab] = useState<ConnTab | null>(null);
  const { data, loading, error } = useQuery(ProfileQuery, {
    variables: { username },
  });

  if (loading)
    return (
      <p className="text-sm text-[color:var(--ink-soft)]">프로필 불러오는 중…</p>
    );
  if (error)
    return (
      <p className="text-sm text-[color:var(--danger)]">에러: {error.message}</p>
    );
  const user = data?.userByUsername;
  if (!user)
    return (
      <p className="text-sm text-[color:var(--ink-soft)]">
        사용자를 찾을 수 없습니다.
      </p>
    );

  const viewerId = session?.user?.id;
  const isMe = viewerId != null && viewerId === user.id;
  const canInteract = !!viewerId && !isMe;
  // 비공개 + 비팔로워이면 BE가 posts를 빈 배열로 줌. 사용자에겐 명확한 안내 노출.
  const postsHidden =
    user.privateAccount && !isMe && !user.viewerIsFollowing;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-start gap-5 rounded-2xl bg-[color:var(--paper)] p-5 ring-1 ring-black/5">
        <span className="bg-pay-gradient inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full p-[3px]">
          <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[22px] font-semibold">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              user.displayName.charAt(0).toUpperCase()
            )}
          </span>
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{user.displayName}</h1>
                {user.privateAccount && (
                  <span
                    title="비공개 계정"
                    className="inline-flex items-center rounded-full bg-[color:var(--rule)]/60 px-2 py-0.5 text-[10px] font-medium text-[color:var(--ink-soft)]"
                  >
                    🔒 비공개
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-[color:var(--ink-soft)]">
                @{user.username}
              </p>
            </div>
            {canInteract && (
              <FollowButton
                userId={user.id}
                isFollowing={user.viewerIsFollowing}
                hasRequested={user.viewerHasRequestedFollow}
                isTargetPrivate={user.privateAccount}
                followerCount={user.followerCount}
              />
            )}
          </div>
          {user.bio && <p className="text-[13.5px] leading-snug">{user.bio}</p>}
          <dl className="mt-1 flex items-center gap-5 text-[12.5px]">
            <Stat label="게시물" value={user.postCount} />
            <Stat
              label="팔로워"
              value={user.followerCount}
              onClick={() => setConnTab("followers")}
            />
            <Stat
              label="팔로잉"
              value={user.followingCount}
              onClick={() => setConnTab("following")}
            />
          </dl>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          최근 게시물
        </h2>
        {postsHidden ? (
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-[color:var(--rule)] py-10 text-center">
            <p className="text-[13.5px] font-medium">🔒 비공개 계정입니다</p>
            <p className="text-[12px] text-[color:var(--ink-soft)]">
              게시물을 보려면 팔로우 승낙을 받아야 해요.
            </p>
          </div>
        ) : user.posts.length === 0 ? (
          <p className="text-sm text-[color:var(--ink-soft)]">
            아직 게시물이 없습니다.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-1">
            {user.posts.map((p) => (
              <li key={p.id} className="relative aspect-square overflow-hidden bg-[color:var(--rule)]/30">
                <Link
                  href={`/posts/${p.id}`}
                  className="relative block h-full w-full"
                  aria-label="게시물 상세 보기"
                >
                  {p.imageUrls[0] ? (
                    <Image
                      src={toAbsoluteMediaUrl(p.imageUrls[0])}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 33vw, 200px"
                      className="object-cover transition-opacity hover:opacity-90"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-[color:var(--ink-soft)]">
                      {p.item || "게시물"}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {connTab && (
        <UserListModal
          username={user.username}
          tab={connTab}
          onTabChange={setConnTab}
          onClose={() => setConnTab(null)}
        />
      )}
    </div>
  );
}

type FollowButtonProps = {
  userId: string;
  isFollowing: boolean;
  hasRequested: boolean;
  isTargetPrivate: boolean;
  followerCount: number;
};

function FollowButton({
  userId,
  isFollowing,
  hasRequested,
  isTargetPrivate,
  followerCount,
}: FollowButtonProps) {
  const [follow, { loading: following }] = useMutation(FollowMutation);
  const [unfollow, { loading: unfollowing }] = useMutation(UnfollowMutation);
  const busy = following || unfollowing;

  const onClick = () => {
    if (busy) return;
    if (isFollowing) {
      void unfollow({
        variables: { id: userId },
        optimisticResponse: {
          unfollowUser: {
            id: userId,
            followerCount: Math.max(0, followerCount - 1),
            viewerIsFollowing: false,
          },
        },
      });
    } else if (hasRequested) {
      // 요청 보낸 상태에서 한 번 더 누르면 unfollow로 취소처럼 동작 — pending request도 같이 제거
      // (BE: unfollowUser는 Follow row만 지움. cancelFollowRequest는 별도 mutation이라 여기선
      //  단순화 위해 그냥 unfollowUser만 호출하고 viewerHasRequestedFollow는 server 응답에 맡김)
      void unfollow({
        variables: { id: userId },
        optimisticResponse: {
          unfollowUser: {
            id: userId,
            followerCount,
            viewerIsFollowing: false,
          },
        },
      });
    } else {
      // public이면 즉시 follow, private이면 BE가 request 생성 → viewerHasRequestedFollow=true 반환
      void follow({
        variables: { id: userId },
        optimisticResponse: {
          followUser: {
            id: userId,
            followerCount: isTargetPrivate ? followerCount : followerCount + 1,
            viewerIsFollowing: !isTargetPrivate,
            viewerHasRequestedFollow: isTargetPrivate,
          },
        },
      });
    }
  };

  const label = busy
    ? "…"
    : isFollowing
      ? "팔로잉"
      : hasRequested
        ? "요청됨"
        : "팔로우";

  const variant =
    isFollowing || hasRequested
      ? "rounded-full border border-[color:var(--rule)] px-4 py-1.5 text-[12.5px] font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--danger)]/50 hover:text-[color:var(--danger)] disabled:opacity-50"
      : "rounded-full bg-pay px-4 py-1.5 text-[12.5px] font-semibold text-[color:var(--pay-on)] shadow-[0_6px_18px_-10px_rgba(3,199,90,0.7)] transition-[filter] hover:brightness-105 disabled:opacity-50";

  return (
    <button type="button" onClick={onClick} disabled={busy} className={variant}>
      {label}
    </button>
  );
}

function Stat({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="font-mono text-[14px] font-semibold tabular-nums">
        {value.toLocaleString()}
      </span>
      <span className="text-[color:var(--ink-soft)]">{label}</span>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-baseline gap-1.5 transition-colors hover:text-[color:var(--pay-forest)]"
      >
        {inner}
      </button>
    );
  }
  return <div className="flex items-baseline gap-1.5">{inner}</div>;
}
