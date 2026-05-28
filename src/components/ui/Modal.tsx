import { useEffect, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl" | "full";
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, subtitle, children, size = "lg", footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const sizes: Record<string, string> = {
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
    full: "max-w-[95vw]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-graphite-950/40 p-6 backdrop-blur-[2px]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full bg-white border border-graphite-200 rounded-sharp mt-12 flex flex-col max-h-[90vh]",
          sizes[size]
        )}
      >
        {(title || subtitle) && (
          <div className="px-5 py-4 hairline-b flex items-start justify-between gap-4">
            <div>
              {title && <div className="text-sm font-semibold text-graphite-900">{title}</div>}
              {subtitle && <div className="text-xs text-graphite-500 mt-0.5">{subtitle}</div>}
            </div>
            <button onClick={onClose} className="text-graphite-500 hover:text-graphite-900">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-5 flex-1 scroll-thin">{children}</div>
        {footer && <div className="px-5 py-3 hairline-t bg-graphite-50/70 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
