import Image from "next/image";

export const LOGO_PATH = "/brand/usparts-logo.png";
export const LOGO_WIDTH = 1024;
export const LOGO_HEIGHT = 682;

type USPartsLogoSize = "header" | "hero" | "compact";

const sizeClasses: Record<USPartsLogoSize, string> = {
  header: "h-9 w-auto sm:h-11",
  hero: "h-24 w-auto sm:h-36",
  compact: "h-7 w-auto sm:h-8",
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
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src={LOGO_PATH}
        alt="USParts.us"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        className={`${sizeClasses[size]} object-contain`}
      />
    </span>
  );
}
