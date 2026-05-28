import * as React from "react";
import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  className?: string;
}

export function Avatar({ name, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-graphite-200 bg-graphite-100 text-[11px] font-semibold uppercase tracking-wider text-graphite-700",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
