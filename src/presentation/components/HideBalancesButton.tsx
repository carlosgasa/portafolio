import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHiddenBalances } from "@/presentation/hooks/useHiddenBalances";

export function HideBalancesButton() {
  const { isHidden, toggle } = useHiddenBalances();
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={isHidden ? "Mostrar saldos" : "Ocultar saldos"}
      title={isHidden ? "Mostrar saldos" : "Ocultar saldos"}
      onClick={toggle}
    >
      {isHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  );
}
