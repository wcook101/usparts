import Image from "next/image";

export const LOGO_SVG_PATH = "/brand/usparts-logo.svg";
export const LOGO_HEADER_PATH = "/brand/usparts-logo.png";
export const LOGO_HERO_PATH = "/brand/usparts-logo-full.png";
export const LOGO_HEADER_WIDTH = 782;
export const LOGO_HEADER_HEIGHT = 165;
export const LOGO_HERO_WIDTH = 888;
export const LOGO_HERO_HEIGHT = 385;

type USPartsLogoSize = "header" | "hero" | "compact";

const sizeClasses: Record<USPartsLogoSize, string> = {
  header: "h-10 w-auto sm:h-12",
  hero: "h-auto w-full max-w-xl sm:max-w-2xl",
  compact: "h-8 w-auto sm:h-9",
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
  const pngSrc = isHero ? LOGO_HERO_PATH : LOGO_HEADER_PATH;
  const width = isHero ? LOGO_HERO_WIDTH : LOGO_HEADER_WIDTH;
  const height = isHero ? LOGO_HERO_HEIGHT : LOGO_HEADER_HEIGHT;
  const sizeClass = `${sizeClasses[size]} max-w-none object-contain`;

  return (
    <picture className={`inline-flex shrink-0 items-center ${className}`}>
      <source srcSet={LOGO_SVG_PATH} type="image/svg+xml" />
      <Image
        src={pngSrc}
        alt="USParts.us — vetted, secure, American"
        width={width}
        height={height}
        priority={priority}
        className={sizeClass}
      />
    </picture>
  );
}
