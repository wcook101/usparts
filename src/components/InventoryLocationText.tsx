import {
  formatInventoryLocation,
  isUnitedStatesLocation,
  type InventoryLocationLike,
} from "@/lib/format";

type InventoryLocationTextProps = {
  location: InventoryLocationLike;
  className?: string;
  emphasize?: boolean;
};

export function InventoryLocationText({
  location,
  className = "",
  emphasize = false,
}: InventoryLocationTextProps) {
  const isUs = isUnitedStatesLocation(location);
  const sizeClass = emphasize ? "text-lg font-semibold" : "text-sm";
  const colorClass = isUs
    ? emphasize
      ? "text-slate-900"
      : "text-slate-600"
    : "font-medium text-red-600";

  return (
    <span className={`${sizeClass} ${colorClass} ${className}`.trim()}>
      {formatInventoryLocation(location)}
    </span>
  );
}
