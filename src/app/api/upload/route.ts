import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_ENDPOINT ??
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ??
  "http://localhost:8080/graphql";

const BASE = GRAPHQL_ENDPOINT.replace(/\/graphql\/?$/, "");

export async function POST(request: Request) {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    return new Response(null, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "multipart/form-data";

  const upstream = await fetch(`${BASE}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": contentType,
    },
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
