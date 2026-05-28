import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-graphite-300 bg-white px-3 py-1 text-sm text-graphite-900 placeholder:text-graphite-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-graphite-500",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-md border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-graphite-500",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "font-mono text-[10px] font-medium uppercase tracking-wider text-graphite-500",
        className
      )}
    >
      {children}
    </label>
  );
}
