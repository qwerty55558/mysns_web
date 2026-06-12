import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Bookmarks } from "@/features/feed/Bookmarks";
import { AppShell } from "@/features/shell/AppShell";

export const metadata = {
  title: "Payflow — 북마크",
};

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell>
      <h1 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
        북마크
      </h1>
      <Bookmarks />
    </AppShell>
  );
}
