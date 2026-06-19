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
  const isHero = size === "hero";

  return (
    <span
      className={`inline-flex items-center rounded-xl bg-black shadow-md shadow-slate-900/20 ring-1 ring-slate-900/10 ${
        isHero ? "rounded-2xl px-5 py-3 sm:px-6 sm:py-4" : "px-2.5 py-1.5 sm:px-3 sm:py-2"
      } ${className}`}
    >
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
