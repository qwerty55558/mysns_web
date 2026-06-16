import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/features/shell/AppShell";
import { ConversationThread } from "@/features/messages/ConversationThread";

export const metadata = {
  title: "Payflow — 대화",
};

type Props = { params: Promise<{ id: string }> };

export default async function ConversationPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  return (
    <AppShell
      mainClassName="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-5 pt-4"
    >
      <Link
        href="/messages"
        className="w-fit text-[12.5px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--foreground)]"
      >
        ← 메시지
      </Link>
      <ConversationThread id={id} />
    </AppShell>
  );
}
