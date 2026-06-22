import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_ENDPOINT ??
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ??
  "http://localhost:8080/graphql";

const BASE = GRAPHQL_ENDPOINT.replace(/\/graphql\/?$/, "");

export async function GET(request: Request) {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    return new Response(null, { status: 401 });
  }

  const upstream = await fetch(`${BASE}/events/stream`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal: request.signal,
  });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
