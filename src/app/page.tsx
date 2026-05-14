import { PhoneStack } from "@/features/landing/PhoneStack";
import { LoginCard } from "@/features/landing/LoginCard";

export default function LandingPage() {
  return (
    <div className="relative flex flex-1 flex-col bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Header />

      <main className="relative mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16 lg:py-20">
        <section className="relative flex flex-col items-center gap-8">
          <div
            className="word-rise hidden text-center lg:block"
            style={{ animationDelay: "120ms" }}
          >
            <h2 className="font-display text-4xl italic leading-tight">
              <span className="text-pay-gradient">Share your spend.</span>
              <br />
              Find your flow.
            </h2>
            <p className="mt-3 text-[13px] text-[color:var(--ink-soft)]">
              영수증 한 컷으로 공유하고, 바로 송금까지.
            </p>
          </div>
          <PhoneStack />
        </section>

        <section className="flex w-full justify-center lg:justify-end">
          <LoginCard />
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <span className="font-display text-3xl italic tracking-tight">
        Payflow
      </span>
      <nav className="hidden gap-7 text-[13px] text-[color:var(--ink-soft)] sm:flex">
        <a href="#">서비스 소개</a>
        <a href="#">송금·지갑</a>
        <a href="#">수수료</a>
        <a href="#">고객센터</a>
        <a href="#">개발자</a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 pb-10 pt-4 text-[12px] text-[color:var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between">
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {[
          "회사 소개",
          "블로그",
          "채용",
          "고객센터",
          "송금·지갑",
          "수수료 안내",
          "개발자 API",
          "개인정보",
          "이용약관",
          "전자금융 약관",
          "보안",
          "공지",
        ].map((label) => (
          <li key={label}>
            <a href="#" className="hover:text-[color:var(--foreground)]">
              {label}
            </a>
          </li>
        ))}
      </ul>
      <p>© {new Date().getFullYear()} Payflow, Inc.</p>
    </footer>
  );
}
