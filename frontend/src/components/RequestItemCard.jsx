import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

function RequestItemCard({ equipment, onRequestClick }) {
  const canRequest = equipment.availableUnits > 0 && equipment.status === "FUNCTIONAL";

  return (
    <article className="rounded-xl border border-border/80 bg-card/80 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-medium">{equipment.name}</h4>
        <Badge variant={canRequest ? "success" : "danger"}>
          {canRequest ? "Ready" : equipment.status === "REPAIR" ? "Repair" : equipment.status === "MISSING" ? "Missing" : "Out"}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{equipment.category}</p>
      <p className="mt-1 text-xs text-muted-foreground">Lab: {equipment.lab?.name || "N/A"}</p>
      <p className="mt-2 text-sm">
        {equipment.availableUnits} / {equipment.totalUnits} units available
      </p>
      <Button
        className="mt-3 w-full"
        disabled={!canRequest}
        onClick={() => onRequestClick(equipment)}
      >
        Request Item
      </Button>
    </article>
  );
}

export default RequestItemCard;
