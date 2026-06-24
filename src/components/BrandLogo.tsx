import Image from "next/image";

const sizeClasses = {
  sm: "size-9",
  md: "size-36 sm:size-44 md:size-52",
  lg: "size-44 sm:size-52 md:size-60",
} as const;

type BrandLogoProps = {
  size?: keyof typeof sizeClasses;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  size = "md",
  className = "",
  priority = false,
}: BrandLogoProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-white shadow-md ring-2 ring-slate-200/80 ${sizeClasses[size]} ${className}`}
    >
      <Image
        src="/brand/usparts-logo.png"
        alt="USParts.US — Built to Perform"
        fill
        priority={priority}
        sizes={size === "sm" ? "36px" : size === "lg" ? "240px" : "208px"}
        className="scale-[1.18] object-cover object-center"
      />
    </div>
  );
}
