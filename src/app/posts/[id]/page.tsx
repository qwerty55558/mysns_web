import Link from "next/link";
import { AppShell } from "@/features/shell/AppShell";
import { PostDetail } from "@/features/feed/PostDetail";

type Props = { params: Promise<{ id: string }> };

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <AppShell
      showNav={false}
      mainClassName="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-5 py-6"
    >
      <Link
        href="/home"
        className="w-fit text-[12.5px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--foreground)]"
      >
        ← 피드로
      </Link>
      <PostDetail id={id} />
    </AppShell>
  );
}
