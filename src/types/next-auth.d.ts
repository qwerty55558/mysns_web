import "next-auth";
import "next-auth/jwt";

type RefreshError = "RefreshAccessTokenError";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: RefreshError;
  }

  interface User {
    username?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    username?: string;
    userId?: string;
    error?: RefreshError;
  }
}
