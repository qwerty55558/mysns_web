import { AppShell } from "@/features/shell/AppShell";
import { ProfileView } from "@/features/profile/ProfileView";

type Props = { params: Promise<{ username: string }> };

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  return (
    <AppShell mainClassName="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-6">
      <ProfileView username={username} />
    </AppShell>
  );
}
