/** Admin-facing timestamps use US Eastern (handles EST/EDT). */
export const EASTERN_TIME_ZONE = "America/New_York";

type FormatWhenOptions = {
  /** Include hour:minute. Default true. */
  time?: boolean;
};

export function formatWhen(
  value: string | Date | null | undefined,
  options: FormatWhenOptions = {},
): string {
  if (!value) {
    return "—";
  }

  const includeTime = options.time !== false;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime
      ? { hour: "numeric" as const, minute: "2-digit" as const }
      : {}),
  }).format(new Date(value));
}

/** Midnight today in America/New_York, as a UTC Date. */
export function startOfTodayEastern(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const msSinceMidnight =
    ((get("hour") * 60 + get("minute")) * 60 + get("second")) * 1000 +
    now.getMilliseconds();

  return new Date(now.getTime() - msSinceMidnight);
}
