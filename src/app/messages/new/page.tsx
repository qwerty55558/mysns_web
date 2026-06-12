import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/features/shell/AppShell";
import { NewMessage } from "@/features/messages/NewMessage";

export const metadata = {
  title: "Payflow — 새 메시지",
};

export default async function NewMessagePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell
      showNav={false}
      mainClassName="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-5 py-6"
    >
      <div className="flex items-center gap-3">
        <Link
          href="/messages"
          className="text-[12.5px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--foreground)]"
        >
          ← 메시지
        </Link>
        <h1 className="text-lg font-semibold">새 메시지</h1>
      </div>
      <NewMessage />
    </AppShell>
  );
}
