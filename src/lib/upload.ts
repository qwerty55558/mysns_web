import { getClientAuthToken } from "./auth-token";

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:8080/graphql";

export function getBackendOrigin(): string {
  return new URL(GRAPHQL_ENDPOINT).origin;
}

export function toAbsoluteMediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${getBackendOrigin()}${url}`;
  return url;
}

export type UploadResponse = {
  url: string;
  size: number;
  contentType: string;
};

export async function uploadImage(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const token = getClientAuthToken();
  const res = await fetch(`${getBackendOrigin()}/upload`, {
    method: "POST",
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `업로드 실패 (${res.status})`);
  }
  return (await res.json()) as UploadResponse;
}
