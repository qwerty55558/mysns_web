import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/features/shell/AppShell";
import { ConversationList } from "@/features/messages/ConversationList";

export const metadata = {
  title: "Payflow — 메시지",
};

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell mainClassName="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">메시지</h1>
        <Link
          href="/messages/new"
          className="rounded-full border border-[color:var(--rule)] px-3 py-1.5 text-[12px] font-medium transition-colors hover:border-[color:var(--pay)]/40 hover:text-[color:var(--pay-forest)]"
        >
          + 새 메시지
        </Link>
      </div>
      <ConversationList />
    </AppShell>
  );
}
