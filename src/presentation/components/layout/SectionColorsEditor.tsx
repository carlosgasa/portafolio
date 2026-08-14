import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLOR_PRESETS } from "@/shared/colorPresets";
import { navItems } from "./nav-items";
import { useSectionColors } from "@/presentation/hooks/useSectionColors";
import { cn } from "@/lib/utils";

/** Deja elegir un color de acento por seccion del menu (preferencia local,
 * no se guarda en Firestore). Clic de nuevo en el color activo lo quita. */
export function SectionColorsEditor() {
  const { colors, setColor, clearColor } = useSectionColors();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Personalizar colores de secciones">
          <Palette className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <p className="mb-1 text-sm font-medium text-foreground">Color por sección</p>
        <ul className="flex max-h-96 flex-col divide-y divide-border/60 overflow-y-auto">
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
      </PopoverContent>
    </Popover>
  );
}
