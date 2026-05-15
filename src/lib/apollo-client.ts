import { HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import { getClientAuthToken } from "./auth-token";

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:8080/graphql";

export function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: GRAPHQL_ENDPOINT,
      fetchOptions: { cache: "no-store" },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        const token = getClientAuthToken();
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    }),
  });
}
