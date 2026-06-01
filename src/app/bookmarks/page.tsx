import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Bookmarks } from "@/features/feed/Bookmarks";
import { UserMenu } from "@/features/auth/UserMenu";

export const metadata = {
  title: "Payflow — 북마크",
};

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-col flex-1 items-center bg-[color:var(--background)] text-[color:var(--foreground)]">
      <header className="sticky top-0 z-20 w-full border-b border-[color:var(--rule)] bg-[color:var(--background)]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/home" className="font-display text-2xl italic tracking-tight">
            Payflow
          </Link>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-6">
        <h1 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          북마크
        </h1>
        <Bookmarks />
      </main>
    </div>
  );
}
