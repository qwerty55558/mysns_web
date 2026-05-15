import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col bg-[color:var(--background)] text-[color:var(--foreground)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:py-16">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
