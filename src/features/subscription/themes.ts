import type { ThemePreset } from "@/gql/graphql";

export type ThemeStyle = {
  key: ThemePreset;
  label: string;
  blurb: string;
  gradient: string;
  accent: string;
  on: string;
  tint: string;
};

export const THEME_PRESETS: readonly ThemeStyle[] = [
  {
    key: "OCEAN",
    label: "오션",
    blurb: "깊은 바다 블루",
    gradient: "linear-gradient(135deg,#38bdf8 0%,#2563eb 55%,#1e3a8a 100%)",
    accent: "#2563eb",
    on: "#ffffff",
    tint: "rgba(37,99,235,0.06)",
  },
  {
    key: "SUNSET",
    label: "선셋",
    blurb: "노을빛 그라데이션",
    gradient: "linear-gradient(135deg,#fbbf24 0%,#fb7185 55%,#c026d3 100%)",
    accent: "#fb7185",
    on: "#ffffff",
    tint: "rgba(251,113,133,0.06)",
  },
  {
    key: "FOREST",
    label: "포레스트",
    blurb: "Payflow 시그니처 그린",
    gradient: "linear-gradient(135deg,#6deda0 0%,#03c75a 55%,#006a32 100%)",
    accent: "#03c75a",
    on: "#ffffff",
    tint: "rgba(3,199,90,0.06)",
  },
  {
    key: "AURORA",
    label: "오로라",
    blurb: "오로라빛 퍼플",
    gradient: "linear-gradient(135deg,#6ee7b7 0%,#818cf8 50%,#c084fc 100%)",
    accent: "#818cf8",
    on: "#ffffff",
    tint: "rgba(129,140,248,0.07)",
  },
  {
    key: "MONO",
    label: "모노",
    blurb: "미니멀 모노톤",
    gradient: "linear-gradient(135deg,#9ca3af 0%,#4b5563 55%,#111827 100%)",
    accent: "#374151",
    on: "#ffffff",
    tint: "rgba(55,65,81,0.06)",
  },
  {
    key: "ROSE",
    label: "로즈",
    blurb: "로즈 핑크",
    gradient: "linear-gradient(135deg,#fda4af 0%,#fb7185 50%,#e11d48 100%)",
    accent: "#e11d48",
    on: "#ffffff",
    tint: "rgba(225,29,72,0.06)",
  },
] as const;

export const THEME_BY_KEY: Record<ThemePreset, ThemeStyle> = Object.fromEntries(
  THEME_PRESETS.map((t) => [t.key, t]),
) as Record<ThemePreset, ThemeStyle>;
