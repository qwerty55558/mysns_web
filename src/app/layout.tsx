import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Unbounded,
  Syne,
  Space_Grotesk,
  Black_Han_Sans,
} from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ApolloProvider } from "@/lib/apollo-provider";
import { AuthTokenBridge } from "@/features/auth/AuthTokenBridge";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const blackHanSans = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-black-han-sans",
});

export const metadata: Metadata = {
  title: "Payflow — Share your spend, find your flow",
  description:
    "친구들과 소비의 흐름을 공유하고, 같은 앱에서 바로 송금까지. 한 컷, 한 영수증, 한 번의 탭.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${unbounded.variable} ${syne.variable} ${spaceGrotesk.variable} ${blackHanSans.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col paper-grid">
        {/* refetchInterval: accessToken TTL(15분)보다 짧은 10분마다 세션 재조회로
            jwt 콜백이 만료 전 refresh를 돌게 한다. 폴링이 없으면 탭을 켜둔 채
            15분이 지났을 때 인메모리 토큰이 만료된 채 고정돼 updateMe/SSE가 거부된다. */}
        <SessionProvider refetchInterval={600} refetchOnWindowFocus>
          <AuthTokenBridge />
          <ApolloProvider>
            {children}
            {modal}
          </ApolloProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
