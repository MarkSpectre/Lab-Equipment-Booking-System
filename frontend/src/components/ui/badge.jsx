import { cn } from "../../lib/utils";

export function Badge({ className, variant = "default", children }) {
  const variants = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-500/20 text-emerald-500",
    warning: "bg-amber-500/20 text-amber-500",
    danger: "bg-rose-500/20 text-rose-500",
  };

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}
