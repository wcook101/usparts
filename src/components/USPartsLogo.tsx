export const LOGO_HEADER_PATH = "/brand/usparts-logo.png";
export const LOGO_HERO_PATH = "/brand/usparts-logo-full.png";
export const LOGO_HEADER_WIDTH = 782;
export const LOGO_HEADER_HEIGHT = 165;
export const LOGO_HERO_WIDTH = 888;
export const LOGO_HERO_HEIGHT = 385;

type USPartsLogoSize = "header" | "hero" | "compact";

const sizeClasses: Record<USPartsLogoSize, string> = {
  header: "h-11 w-auto sm:h-14",
  hero: "h-auto w-full max-w-2xl sm:max-w-3xl",
  compact: "h-9 w-auto sm:h-10",
};

type USPartsLogoProps = {
  size?: USPartsLogoSize;
  priority?: boolean;
  className?: string;
};

export function USPartsLogo({
  size = "header",
  priority = false,
  className = "",
}: USPartsLogoProps) {
  const isHero = size === "hero";

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand asset; direct URL avoids broken picture/svg fallback
    <img
      src={isHero ? LOGO_HERO_PATH : LOGO_HEADER_PATH}
      alt="USParts.us"
      width={isHero ? LOGO_HERO_WIDTH : LOGO_HEADER_WIDTH}
      height={isHero ? LOGO_HERO_HEIGHT : LOGO_HEADER_HEIGHT}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={`block max-w-none object-contain ${sizeClasses[size]} ${className}`}
    />
  );
}
