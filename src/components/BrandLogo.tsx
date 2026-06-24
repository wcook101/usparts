import Image from "next/image";

const sizeClasses = {
  sm: "size-10",
  md: "size-40 sm:size-48 md:size-56",
  lg: "size-52 sm:size-64 md:size-72",
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
        sizes={size === "sm" ? "40px" : size === "lg" ? "288px" : "224px"}
        className="object-cover object-center"
      />
    </div>
  );
}
