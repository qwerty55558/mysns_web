let token: string | null = null;

export function setClientAuthToken(value: string | null): void {
  token = value;
}

export function getClientAuthToken(): string | null {
  return token;
}
