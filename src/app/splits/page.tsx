import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/features/shell/AppShell";
import { SplitsView } from "@/features/splits/SplitsView";

export const metadata = {
  title: "Payflow — 1/N",
};

export default async function SplitsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell>
      <h1 className="text-lg font-semibold">1/N</h1>
      <SplitsView />
    </AppShell>
  );
}
