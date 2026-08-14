import { ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps<K extends string> {
  label: string;
  sortKey: K;
  currentKey: K;
  direction: "asc" | "desc";
  onSort: (key: K) => void;
  className?: string;
}

export function SortableTableHead<K extends string>({
  label,
  sortKey,
  currentKey,
  direction,
  onSort,
  className,
}: SortableTableHeadProps<K>) {
  const active = currentKey === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          active && "text-foreground",
        )}
      >
        {label}
        {active &&
          (direction === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          ))}
      </button>
    </TableHead>
  );
}
