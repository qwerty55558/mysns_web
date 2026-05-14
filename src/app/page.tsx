import { Feed } from "@/features/feed/Feed";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 py-16 px-8 bg-white dark:bg-black">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            mySNS
          </h1>
          <p className="text-sm text-zinc-500">
            GraphQL endpoint:{" "}
            <code>
              {process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ??
                "http://localhost:8080/graphql"}
            </code>
          </p>
        </header>
        <Feed />
      </main>
    </div>
  );
}
