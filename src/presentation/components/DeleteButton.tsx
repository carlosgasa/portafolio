import { useState } from "react";
import { Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DeleteButtonProps {
  onConfirm: () => void;
  ariaLabel?: string;
  className?: string;
}

/** Boton de borrar con confirmacion inline: un clic cambia el icono a
 * aceptar/cancelar en vez de abrir un dialogo. */
export function DeleteButton({ onConfirm, ariaLabel = "Eliminar", className }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-7 text-positive hover:text-positive", className)}
          aria-label="Confirmar eliminar"
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
        >
          <Check className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-7", className)}
          aria-label="Cancelar"
          onClick={() => setConfirming(false)}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      aria-label={ariaLabel}
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
