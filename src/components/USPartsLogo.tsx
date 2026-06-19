import Image from "next/image";

export const LOGO_PATH = "/brand/usparts-logo.png";
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
  return (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      <Image
        src={LOGO_PATH}
        alt="USParts.us"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        className={`${sizeClasses[size]} max-w-none object-contain`}
      />
    </span>
  );
}
