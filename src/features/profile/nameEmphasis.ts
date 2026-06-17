import type { NameEmphasis, NameFont } from "@/gql/graphql";

export const NAME_FONT_VARS: Record<NameFont, string | null> = {
  DEFAULT: null,
  UNBOUNDED: "var(--font-unbounded)",
  SYNE: "var(--font-syne)",
  BLACK_HAN_SANS: "var(--font-black-han-sans)",
  SPACE_GROTESK: "var(--font-space-grotesk)",
};

export const NAME_FONT_LABELS: Record<NameFont, string> = {
  DEFAULT: "기본",
  UNBOUNDED: "Unbounded",
  SYNE: "Syne",
  BLACK_HAN_SANS: "Black Han Sans",
  SPACE_GROTESK: "Space Grotesk",
};

export const NAME_EMPHASIS_LABELS: Record<NameEmphasis, string> = {
  NONE: "없음",
  GRADIENT: "그라데이션",
  GLOW: "글로우",
  NEON: "네온",
  SPARKLE: "스파클",
};

export const FONT_OPTIONS: NameFont[] = [
  "DEFAULT", "UNBOUNDED", "SYNE", "BLACK_HAN_SANS", "SPACE_GROTESK",
];
export const EMPHASIS_OPTIONS: NameEmphasis[] = [
  "NONE", "GRADIENT", "GLOW", "NEON", "SPARKLE",
];
