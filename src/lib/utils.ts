import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const titleCase = (value: string) =>
  value
    .split(" ")
    .map((chunk) => chunk.slice(0, 1).toUpperCase() + chunk.slice(1))
    .join(" ");

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const toIsoDate = (date = new Date()) => date.toISOString();

export const daysSince = (isoDate?: string) => {
  if (!isoDate) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  const now = Date.now();
  const ms = now - parsed.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

export const initials = (firstName: string, lastName: string) =>
  `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
