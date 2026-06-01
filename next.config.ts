import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost", port: "8080", pathname: "/uploads/**" },
    ],
    // Next 16에서 추가된 SSRF 방어 — 호스트네임이 private IP(127.0.0.1 포함)로 해석되면
    // 옵티마이저가 fetch 자체를 거부한다(400 "url parameter is not allowed").
    // localhost:8080 BE에서 이미지를 받으려면 이 dev 한정 예외가 필수.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
