import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { COLOR_PRESETS } from "@/shared/colorPresets";
import { navItems } from "./nav-items";
import { cn } from "@/lib/utils";

interface SectionColorsEditorProps {
  colors: Record<string, string>;
  setColor: (sectionTo: string, color: string) => void;
  clearColor: (sectionTo: string) => void;
}

/** Deja elegir un color de acento por seccion del menu (preferencia local,
 * no se guarda en Firestore). Clic de nuevo en el color activo lo quita.
 * Recibe el estado de useSectionColors por props para compartir la misma
 * instancia que pinta el menu (si cada uno llamara al hook por su cuenta,
 * el menu no se enteraria del cambio hasta recargar la pagina).
 * Usa Dialog en vez de Popover: en movil, un Popover reposicionado por
 * colision (cerca del borde de un Sheet) es propenso a que el scroll
 * tactil interno no funcione; un Dialog centrado con overflow-y-auto es el
 * mismo patron que ya usan el resto de dialogos largos de la app. */
export function SectionColorsEditor({ colors, setColor, clearColor }: SectionColorsEditorProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Personalizar colores de secciones">
          <Palette className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Color por sección</DialogTitle>
        </DialogHeader>
        <ul className="flex flex-col divide-y divide-border/60">
          {navItems.map((item) => {
            const current = colors[item.to];
            return (
              <li key={item.to} className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <item.icon className="size-4" style={current ? { color: current } : undefined} />
                  {item.label}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Color ${c} para ${item.label}`}
                      onClick={() => (current === c ? clearColor(item.to) : setColor(item.to, c))}
                      className={cn(
                        "size-5 rounded-full border-2 transition-transform",
                        current === c ? "scale-110 border-foreground" : "border-border/50",
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
