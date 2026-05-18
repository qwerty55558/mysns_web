import Link from "next/link";
import { UserMenu } from "@/features/auth/UserMenu";
import { ProfileView } from "@/features/profile/ProfileView";

type Props = { params: Promise<{ username: string }> };

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  return (
    <div className="flex min-h-dvh flex-col items-center bg-[color:var(--background)] text-[color:var(--foreground)]">
      <header className="sticky top-0 z-20 w-full border-b border-[color:var(--rule)] bg-[color:var(--background)]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/home" className="font-display text-2xl italic tracking-tight">
            Payflow
          </Link>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-6">
        <ProfileView username={username} />
      </main>
    </div>
  );
}
