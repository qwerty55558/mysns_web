import { CrowdfundingList } from "@/features/crowdfunding/CrowdfundingList";
import { AppShell } from "@/features/shell/AppShell";

export default function CrowdfundingPage() {
  return (
    <AppShell>
      <CrowdfundingList />
    </AppShell>
  );
}
