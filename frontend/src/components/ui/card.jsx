import { cn } from "../../lib/utils";

export function Card({ className, children }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card/80 p-5 text-card-foreground backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("mb-3 flex items-start justify-between", className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn("text-lg font-semibold", className)}>{children}</h3>;
}

export function CardDescription({ className, children }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

export function CardContent({ className, children }) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}
