import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:8080/graphql";

const LOGIN_QUERY = /* GraphQL */ `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      accessTokenExpiresAt
      user {
        id
        username
        displayName
        role
      }
    }
  }
`;

const REFRESH_QUERY = /* GraphQL */ `
  mutation Refresh($refreshToken: String!) {
    refresh(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      accessTokenExpiresAt
      user {
        id
        username
        displayName
        role
      }
    }
  }
`;

type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: { id: string; username: string; displayName: string; role: "USER" | "ADMIN" };
};

// 만료 임박 임계 — accessTokenExpiresAt − SKEW_MS 이전에는 재사용, 이후엔 refresh
const REFRESH_SKEW_MS = 30_000;

class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
}

async function callAuthMutation(
  query: string,
  variables: Record<string, unknown>,
): Promise<AuthPayload | null> {
  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { login?: AuthPayload; refresh?: AuthPayload };
      errors?: unknown;
    };
    return json.data?.login ?? json.data?.refresh ?? null;
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username =
          typeof credentials?.username === "string" ? credentials.username : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!username || !password) throw new InvalidCredentials();

        const payload = await callAuthMutation(LOGIN_QUERY, {
          input: { username, password },
        });
        if (!payload?.accessToken) throw new InvalidCredentials();

        return {
          id: payload.user.id,
          name: payload.user.displayName,
          username: payload.user.username,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          accessTokenExpiresAt: new Date(payload.accessTokenExpiresAt).getTime(),
          role: payload.user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpiresAt = user.accessTokenExpiresAt;
        token.username = user.username;
        token.userId = user.id;
        token.role = user.role;
        token.error = undefined;
        return token;
      }

      const expiresAt = token.accessTokenExpiresAt ?? 0;
      if (Date.now() < expiresAt - REFRESH_SKEW_MS) return token;

      const refreshToken = token.refreshToken;
      if (!refreshToken) {
        token.error = "RefreshAccessTokenError";
        return token;
      }

      const refreshed = await callAuthMutation(REFRESH_QUERY, { refreshToken });
      if (!refreshed?.accessToken) {
        token.error = "RefreshAccessTokenError";
        return token;
      }

      token.accessToken = refreshed.accessToken;
      token.refreshToken = refreshed.refreshToken;
      token.accessTokenExpiresAt = new Date(
        refreshed.accessTokenExpiresAt,
      ).getTime();
      token.role = refreshed.user.role;
      token.error = undefined;
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      if (session.user) {
        const id = token.userId ?? token.sub;
        if (id) session.user.id = id;
        session.user.username = token.username;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
