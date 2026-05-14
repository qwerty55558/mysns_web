import { Feed } from "@/features/feed/Feed";
import { MeBadge } from "@/features/auth/MeBadge";

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1 items-center bg-[color:var(--background)] text-[color:var(--foreground)]">
      <header className="sticky top-0 z-20 w-full border-b border-[color:var(--rule)] bg-[color:var(--background)]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <span className="font-display text-2xl italic tracking-tight">
            Payflow
          </span>
          <MeBadge />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-6">
        <Feed />
      </main>
    </div>
  );
}
