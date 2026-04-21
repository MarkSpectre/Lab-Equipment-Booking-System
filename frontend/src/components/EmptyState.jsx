import { PackageSearch } from "lucide-react";

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <PackageSearch size={22} />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default EmptyState;
