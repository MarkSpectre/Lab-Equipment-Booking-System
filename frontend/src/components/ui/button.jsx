import { cn } from "../../lib/utils";

export function Button({ className, variant = "default", children, ...props }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:opacity-90",
    ghost: "bg-transparent hover:bg-muted text-foreground",
    outline: "border border-border bg-background hover:bg-muted",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
