import Link from "next/link";
import { MeBadge } from "@/features/auth/MeBadge";

const NAV = [
  { href: "/about", label: "서비스 소개" },
  { href: "/support", label: "고객센터" },
  { href: "/notices", label: "공지사항" },
];

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="font-display text-3xl italic tracking-tight">
        Payflow
      </Link>
      <div className="flex items-center gap-6">
        <nav className="hidden gap-7 text-[13px] text-[color:var(--ink-soft)] sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[color:var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <MeBadge />
      </div>
    </header>
  );
}
