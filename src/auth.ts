import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:8080/graphql";

const LOGIN_QUERY = /* GraphQL */ `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        username
        displayName
      }
    }
  }
`;

class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
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

        const res = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: LOGIN_QUERY,
            variables: { input: { username, password } },
          }),
          cache: "no-store",
        });
        if (!res.ok) throw new InvalidCredentials();

        const json = (await res.json()) as {
          data?: {
            login?: {
              accessToken: string;
              user: { id: string; username: string; displayName: string };
            };
          };
          errors?: unknown;
        };
        const payload = json.data?.login;
        if (!payload?.accessToken) throw new InvalidCredentials();

        return {
          id: payload.user.id,
          name: payload.user.displayName,
          username: payload.user.username,
          accessToken: payload.accessToken,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.username = user.username;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      if (session.user) {
        const id = token.userId ?? token.sub;
        if (id) session.user.id = id;
        session.user.username = token.username;
      }
      return session;
    },
  },
});
