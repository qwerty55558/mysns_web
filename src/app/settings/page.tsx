import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserMenu } from "@/features/auth/UserMenu";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col items-center bg-[color:var(--background)] text-[color:var(--foreground)]">
      <header className="sticky top-0 z-20 w-full border-b border-[color:var(--rule)] bg-[color:var(--background)]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/home" className="font-display text-2xl italic tracking-tight">
            Payflow
          </Link>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-5 py-6">
        <h1 className="text-lg font-semibold">설정</h1>
        <p className="text-[13px] text-[color:var(--ink-soft)]">
          @{session.user.username}
        </p>
        <section className="overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5">
          <SettingsRow label="프로필 편집" href="/me" />
          <SettingsRow label="계정" hint="준비 중" disabled />
          <SettingsRow label="알림" hint="준비 중" disabled />
          <SettingsRow label="개인정보 처리방침" href="/about" />
        </section>
      </main>
    </div>
  );
}

function SettingsRow({
  label,
  hint,
  href,
  disabled,
}: {
  label: string;
  hint?: string;
  href?: string;
  disabled?: boolean;
}) {
  const inner = (
    <div className="flex items-center justify-between border-b border-[color:var(--rule)] px-4 py-3 last:border-b-0">
      <span className="text-[13.5px]">{label}</span>
      <span className="text-[11.5px] text-[color:var(--ink-soft)]">{hint ?? "›"}</span>
    </div>
  );
  if (disabled || !href) {
    return <div className="opacity-60">{inner}</div>;
  }
  return (
    <Link href={href} className="block transition-colors hover:bg-[color:var(--rule)]/30">
      {inner}
    </Link>
  );
}
