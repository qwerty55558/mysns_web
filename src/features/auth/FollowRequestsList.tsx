"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import { toAbsoluteMediaUrl } from "@/lib/upload";

const IncomingFollowRequestsQuery = graphql(`
  query IncomingFollowRequests {
    incomingFollowRequests(limit: 50, offset: 0) {
      id
      createdAt
      requester {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`);

const AcceptFollowRequestMutation = graphql(`
  mutation AcceptFollowRequest($id: ID!) {
    acceptFollowRequest(id: $id) {
      id
      viewerIsFollowing
      followerCount
    }
  }
`);

const RejectFollowRequestMutation = graphql(`
  mutation RejectFollowRequest($id: ID!) {
    rejectFollowRequest(id: $id)
  }
`);

export function FollowRequestsList() {
  const { data, loading, error } = useQuery(IncomingFollowRequestsQuery, {
    fetchPolicy: "cache-and-network",
  });
  const [accept] = useMutation(AcceptFollowRequestMutation);
  const [reject] = useMutation(RejectFollowRequestMutation);

  const removeFromCache = (id: string) => ({
    update(cache: import("@apollo/client").ApolloCache) {
      cache.modify({
        fields: {
          incomingFollowRequests(
            existing: ReadonlyArray<{ __ref: string }> = [],
            { readField },
          ) {
            return existing.filter((ref) => readField("id", ref) !== id);
          },
          incomingFollowRequestCount(existing) {
            return Math.max(0, (typeof existing === "number" ? existing : 0) - 1);
          },
        },
      });
    },
  });

  const onAccept = (id: string) =>
    accept({ variables: { id }, ...removeFromCache(id) });
  const onReject = (id: string) =>
    reject({ variables: { id }, ...removeFromCache(id) });

  if (loading && !data)
    return (
      <p className="text-sm text-[color:var(--ink-soft)]">불러오는 중…</p>
    );
  if (error)
    return (
      <p className="text-sm text-[color:var(--danger)]">에러: {error.message}</p>
    );

  const items = data?.incomingFollowRequests ?? [];
  if (items.length === 0)
    return (
      <p className="text-sm text-[color:var(--ink-soft)]">
        새로운 팔로우 요청이 없습니다.
      </p>
    );

  return (
    <ul className="flex flex-col divide-y divide-[color:var(--rule)] overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5">
      {items.map((req) => (
        <li key={req.id} className="flex items-center gap-3 px-4 py-3">
          <Link
            href={`/u/${req.requester.username}`}
            className="bg-pay-gradient inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-[2px]"
          >
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[12.5px] font-semibold">
              {req.requester.avatarUrl ? (
                <Image
                  src={toAbsoluteMediaUrl(req.requester.avatarUrl)}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                req.requester.displayName.charAt(0).toUpperCase()
              )}
            </span>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/u/${req.requester.username}`}
              className="block truncate text-[13.5px] font-semibold hover:text-[color:var(--pay-forest)]"
            >
              {req.requester.username}
            </Link>
            <p className="truncate text-[12px] text-[color:var(--ink-soft)]">
              {req.requester.displayName} 님이 팔로우를 요청했어요
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAccept(req.id)}
              className="rounded-full bg-pay px-3 py-1 text-[11.5px] font-semibold text-[color:var(--pay-on)] shadow-[0_4px_14px_-8px_rgba(3,199,90,0.7)] transition-[filter] hover:brightness-105"
            >
              승낙
            </button>
            <button
              type="button"
              onClick={() => onReject(req.id)}
              className="rounded-full border border-[color:var(--rule)] px-3 py-1 text-[11.5px] text-[color:var(--ink-soft)] transition-colors hover:border-[color:var(--danger)]/50 hover:text-[color:var(--danger)]"
            >
              거절
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
