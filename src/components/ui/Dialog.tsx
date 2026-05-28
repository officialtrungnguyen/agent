import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Dialog({
  open,
  onClose,
  children,
  className,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-graphite-950/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 my-8 w-full animate-slide-up rounded-lg border border-graphite-200 bg-white shadow-xl",
          widths[size],
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader({
  title,
  subtitle,
  onClose,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-graphite-200 px-5 py-4">
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-graphite-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-graphite-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {right}
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-graphite-400 transition-colors hover:bg-graphite-100 hover:text-graphite-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
