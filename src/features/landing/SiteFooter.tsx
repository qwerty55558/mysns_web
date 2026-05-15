export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl px-6 pb-10 pt-4 text-[12px] text-[color:var(--ink-soft)]">
      <p>© {new Date().getFullYear()} Payflow, Inc.</p>
    </footer>
  );
}
