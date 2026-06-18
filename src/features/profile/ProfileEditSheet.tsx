"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import { SheetShell } from "@/features/wallet/SheetShell";
import { uploadImage, toAbsoluteMediaUrl } from "@/lib/upload";

const UpdateMeProfileMutation = graphql(`
  mutation UpdateMeProfile($input: UpdateMeInput!) {
    updateMe(input: $input) {
      id
      displayName
      bio
      avatarUrl
    }
  }
`);

type Props = {
  user: {
    id: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
  };
  onClose: () => void;
};

export function ProfileEditSheet({ user, onClose }: Props) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [updateMe, { loading: saving }] = useMutation(UpdateMeProfileMutation);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const r = await uploadImage(file);
      setAvatarUrl(r.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const name = displayName.trim();
  const canSave = name.length > 0 && !saving && !uploading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setError(null);
    try {
      await updateMe({
        variables: {
          input: { displayName: name, bio: bio.trim() || null, avatarUrl },
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    }
  };

  return (
    <SheetShell title="프로필 편집" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="bg-pay-gradient inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full p-[3px]">
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[22px] font-semibold">
              {avatarUrl ? (
                <Image
                  src={toAbsoluteMediaUrl(avatarUrl)}
                  alt=""
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                name.charAt(0).toUpperCase() || "?"
              )}
            </span>
          </span>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-full border border-[color:var(--rule)] px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:border-[color:var(--pay)]/50 disabled:opacity-50"
            >
              {uploading ? "업로드 중…" : "사진 변경"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(null)}
                className="text-left text-[11.5px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--danger)]"
              >
                사진 제거
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={onPickFile}
          />
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-[color:var(--ink-soft)]">표시 이름</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            className="rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[14px] focus:border-[color:var(--foreground)]/40 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-[color:var(--ink-soft)]">소개</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            className="resize-none rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[14px] focus:border-[color:var(--foreground)]/40 focus:outline-none"
          />
          <span className="self-end text-[11px] text-[color:var(--ink-soft)]">
            {bio.length}/160
          </span>
        </label>

        {error && (
          <p className="text-[11.5px] text-[color:var(--danger)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={!canSave}
          className="w-full rounded-full bg-pay py-3 text-[14px] font-semibold text-[color:var(--pay-on)] shadow-[0_8px_22px_-12px_rgba(3,199,90,0.8)] transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </form>
    </SheetShell>
  );
}
