import Link from "next/link";
import { UserMenu } from "@/features/auth/UserMenu";
import { NotificationsBell } from "./NotificationsBell";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-[color:var(--rule)] bg-[color:var(--background)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
        <Link href="/home" className="font-display text-2xl italic tracking-tight">
          Payflow
        </Link>
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
