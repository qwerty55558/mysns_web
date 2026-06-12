import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/features/shell/AppShell";
import { FollowRequestsList } from "@/features/auth/FollowRequestsList";

export const metadata = {
  title: "Payflow — 알림",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell>
      <h1 className="text-lg font-semibold">알림</h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          팔로우 요청
        </h2>
        <FollowRequestsList />
      </section>
    </AppShell>
  );
}
