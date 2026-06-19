import Image from "next/image";

export const LOGO_SVG_PATH = "/brand/usparts-logo.svg";
export const LOGO_PNG_PATH = "/brand/usparts-logo.png";
export const LOGO_WIDTH = 697;
export const LOGO_HEIGHT = 178;

type USPartsLogoSize = "header" | "hero" | "compact";

const sizeClasses: Record<USPartsLogoSize, string> = {
  header: "h-11 w-auto sm:h-14",
  hero: "h-24 w-auto sm:h-32 md:h-36",
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
  const sizeClass = `${sizeClasses[size]} max-w-none object-contain`;

  return (
    <picture className={`inline-flex shrink-0 items-center ${className}`}>
      <source srcSet={LOGO_SVG_PATH} type="image/svg+xml" />
      <Image
        src={LOGO_PNG_PATH}
        alt="USParts.us"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        className={sizeClass}
      />
    </picture>
  );
}
