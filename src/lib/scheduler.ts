/** Optimal send windows by seniority (user timezone). */
export function getOptimalSendTime(
  title: string,
  timezone: string,
  baseDate: Date = new Date()
): Date {
  const lower = title.toLowerCase();
  let startHour = 9;
  let endHour = 11;

  if (lower.includes("analyst") || lower.includes("associate")) {
    startHour = 7;
    endHour = 9;
  } else if (lower.includes("vp") || lower.includes("vice president")) {
    startHour = 8;
    endHour = 10;
  } else if (
    lower.includes("md") ||
    lower.includes("managing director") ||
    lower.includes("partner")
  ) {
    startHour = 9;
    endHour = 11;
  }

  const target = new Date(baseDate);
  const hour =
    startHour + Math.floor(Math.random() * Math.max(1, endHour - startHour));
  const minute = [0, 15, 30][Math.floor(Math.random() * 3)] ?? 0;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  let candidate = new Date(target);
  candidate.setDate(candidate.getDate() + (candidate.getDay() === 0 || candidate.getDay() === 6 ? 1 : 0));
  if (candidate.getHours() >= endHour) {
    candidate.setDate(candidate.getDate() + 1);
  }

  const parts = formatter.formatToParts(candidate);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";

  const y = parseInt(get("year"), 10);
  const m = parseInt(get("month"), 10) - 1;
  const d = parseInt(get("day"), 10);

  return new Date(Date.UTC(y, m, d, hour, minute, 0));
}

export function formatScheduledTime(iso: string, timezone: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
