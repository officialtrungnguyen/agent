import { useEffect, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
  side?: "right" | "left";
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, subtitle, children, width = "640px", side = "right", footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 transition-opacity",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="absolute inset-0 bg-graphite-950/30" onClick={onClose} />
      <aside
        style={{ width }}
        className={cn(
          "absolute top-0 bottom-0 bg-white hairline flex flex-col transition-transform",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          open ? "translate-x-0" : side === "right" ? "translate-x-full" : "-translate-x-full"
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
      </aside>
    </div>
  );
}
