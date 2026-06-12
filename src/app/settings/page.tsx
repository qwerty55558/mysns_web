import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/features/shell/AppShell";
import { PrivacyToggle } from "@/features/auth/PrivacyToggle";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell mainClassName="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-5 py-6">
      <h1 className="text-lg font-semibold">설정</h1>
      <p className="text-[13px] text-[color:var(--ink-soft)]">
        @{session.user.username}
      </p>
      <section className="overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5">
        <SettingsRow label="프로필 편집" href="/me" />
        <div className="border-b border-[color:var(--rule)]">
          <PrivacyToggle />
        </div>
        <SettingsRow label="알림" href="/notifications" />
        <SettingsRow label="개인정보 처리방침" href="/about" />
      </section>
    </AppShell>
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
