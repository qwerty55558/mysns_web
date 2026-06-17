import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/features/shell/AppShell";
import { SubscriptionView } from "@/features/subscription/SubscriptionView";

export const metadata = {
  title: "Payflow — 프리미엄 구독",
};

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell>
      <h1 className="text-lg font-semibold">프리미엄 구독</h1>
      <SubscriptionView />
    </AppShell>
  );
}
