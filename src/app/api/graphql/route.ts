import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_ENDPOINT ??
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ??
  "http://localhost:8080/graphql";

export async function POST(request: Request) {
  const session = await auth();
  const token = session?.accessToken;

  const contentType = request.headers.get("content-type") ?? "application/json";

  const upstreamHeaders: HeadersInit = {
    "content-type": contentType,
  };
  if (token) {
    upstreamHeaders["Authorization"] = `Bearer ${token}`;
  }

  const upstream = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: upstreamHeaders,
    body: request.body,
    // @ts-expect-error — Node 18+ fetch requires duplex for streaming request bodies
    duplex: "half",
  });

  const responseContentType = upstream.headers.get("content-type") ?? "application/json";

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": responseContentType,
    },
  });
}
