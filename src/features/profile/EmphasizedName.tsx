import type { CSSProperties } from "react";
import type { NameEmphasis, NameFont, ThemePreset } from "@/gql/graphql";
import { THEME_BY_KEY } from "@/features/subscription/themes";
import { NAME_FONT_VARS } from "./nameEmphasis";

const FALLBACK_ACCENT = "#03c75a";
const FALLBACK_GRADIENT = "var(--gradient-pay)";

export function EmphasizedName({
  name,
  font,
  emphasis,
  theme,
  className,
}: {
  name: string;
  font?: NameFont | null;
  emphasis?: NameEmphasis | null;
  theme?: ThemePreset | null;
  className?: string;
}) {
  const themeStyle = theme ? THEME_BY_KEY[theme] : null;
  const accent = themeStyle?.accent ?? FALLBACK_ACCENT;
  const gradient = themeStyle?.gradient ?? FALLBACK_GRADIENT;

  const hasFont = !!font && font !== "DEFAULT";
  const hasEmphasis = !!emphasis && emphasis !== "NONE";

  if (!hasFont && !hasEmphasis) {
    return <span className={className}>{name}</span>;
  }

  const style: CSSProperties = {};
  if (hasFont) {
    style.fontFamily = NAME_FONT_VARS[font] ?? undefined;
    style.fontWeight = 800;
    style.letterSpacing = "0.01em";
  }

  let sparkle = false;
  switch (emphasis) {
    case "GRADIENT":
      style.backgroundImage = gradient;
      style.WebkitBackgroundClip = "text";
      style.backgroundClip = "text";
      style.color = "transparent";
      break;
    case "GLOW":
      style.color = accent;
      style.textShadow = `0 0 8px ${accent}66`;
      break;
    case "NEON":
      style.color = accent;
      if (!hasFont) style.fontWeight = 700;
      style.textShadow = `0 0 3px ${accent}, 0 0 9px ${accent}cc, 0 0 16px ${accent}88`;
      break;
    case "SPARKLE":
      style.color = accent;
      sparkle = true;
      break;
    default:
      break;
  }

  return (
    <span className={className} style={style}>
      {sparkle && <span aria-hidden style={{ marginRight: "0.15em" }}>✦</span>}
      {name}
      {sparkle && <span aria-hidden style={{ marginLeft: "0.15em" }}>✦</span>}
    </span>
  );
}
