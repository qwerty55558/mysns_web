import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Payflow — Share your spend, find your flow",
  description:
    "친구들과 소비의 흐름을 공유하고, 같은 앱에서 바로 송금까지. 한 컷, 한 영수증, 한 번의 탭.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col paper-grid">
        <SessionProvider>
          <AuthTokenBridge />
          <ApolloProvider>{children}</ApolloProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
