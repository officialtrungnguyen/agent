import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

type ToastTone = "success" | "error" | "info";
interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastCtx {
  push: (message: string, tone?: ToastTone) => void;
}

const Ctx = React.createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) return { push: () => undefined };
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((message: string, tone: ToastTone = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, tone, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex animate-slide-up items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg",
              t.tone === "success" && "border-emerald-200",
              t.tone === "error" && "border-red-200",
              t.tone === "info" && "border-graphite-200",
            )}
          >
            {t.tone === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
            {t.tone === "error" && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
            {t.tone === "info" && <Info className="mt-0.5 h-4 w-4 shrink-0 text-graphite-500" />}
            <p className="flex-1 text-sm text-graphite-800">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-graphite-400 hover:text-graphite-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
