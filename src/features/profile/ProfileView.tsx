"use client";

import Image from "next/image";
import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";

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
      viewerIsFollowing
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

export function ProfileView({ username }: { username: string }) {
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
          <div>
            <h1 className="text-lg font-semibold">{user.displayName}</h1>
            <p className="text-[12.5px] text-[color:var(--ink-soft)]">
              @{user.username}
            </p>
          </div>
          {user.bio && <p className="text-[13.5px] leading-snug">{user.bio}</p>}
          <dl className="mt-1 flex items-center gap-5 text-[12.5px]">
            <Stat label="게시물" value={user.postCount} />
            <Stat label="팔로워" value={user.followerCount} />
            <Stat label="팔로잉" value={user.followingCount} />
          </dl>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          최근 게시물
        </h2>
        {user.posts.length === 0 ? (
          <p className="text-sm text-[color:var(--ink-soft)]">
            아직 게시물이 없습니다.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-1">
            {user.posts.map((p) => (
              <li key={p.id} className="relative aspect-square overflow-hidden bg-[color:var(--rule)]/30">
                {p.imageUrls[0] ? (
                  <Image
                    src={p.imageUrls[0]}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 33vw, 200px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-[color:var(--ink-soft)]">
                    {p.item || "게시물"}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-[14px] font-semibold tabular-nums">
        {value.toLocaleString()}
      </span>
      <span className="text-[color:var(--ink-soft)]">{label}</span>
    </div>
  );
}
