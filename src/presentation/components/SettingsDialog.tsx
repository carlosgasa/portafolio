import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { navItems } from "@/presentation/components/layout/nav-items";
import { useStartPage } from "@/presentation/hooks/useStartPage";

export function SettingsDialog() {
  const { page, setPage } = useStartPage();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Configuración" title="Configuración">
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="start-page">Pantalla de inicio</Label>
          <Select value={page} onValueChange={setPage}>
            <SelectTrigger id="start-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {navItems.map((item) => (
                <SelectItem key={item.to} value={item.to}>
                  <item.icon className="size-4" />
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Qué pantalla se abre al entrar a la app.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
