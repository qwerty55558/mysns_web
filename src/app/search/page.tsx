import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/features/shell/AppShell";
import { SearchView } from "@/features/search/SearchView";

export const metadata = {
  title: "Payflow — 검색",
};

export default async function SearchPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell>
      <h1 className="sr-only">검색</h1>
      <SearchView />
    </AppShell>
  );
}
