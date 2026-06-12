import { Feed } from "@/features/feed/Feed";
import { AppShell } from "@/features/shell/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <Feed />
    </AppShell>
  );
}
