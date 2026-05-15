import { PhoneStack } from "@/features/landing/PhoneStack";
import { LoginCard } from "@/features/landing/LoginCard";
import { SiteHeader } from "@/features/landing/SiteHeader";
import { SiteFooter } from "@/features/landing/SiteFooter";

export default function LandingPage() {
  return (
    <div className="relative flex flex-1 flex-col bg-[color:var(--background)] text-[color:var(--foreground)]">
      <SiteHeader />

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

      <SiteFooter />
    </div>
  );
}
