import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/features/shell/AppShell";
import { WalletView } from "@/features/wallet/WalletView";

export const metadata = {
  title: "Payflow — 지갑",
};

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell>
      <h1 className="text-lg font-semibold">지갑</h1>
      <WalletView />
    </AppShell>
  );
}
