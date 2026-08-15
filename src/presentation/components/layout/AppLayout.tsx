import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navItems } from "./nav-items";
import { SectionColorsEditor } from "./SectionColorsEditor";
import { ThemeToggle } from "@/presentation/components/ThemeToggle";
import { BackupDialog } from "@/presentation/components/BackupDialog";
import { BrandMark } from "@/presentation/components/BrandMark";
import { useAuth } from "@/presentation/providers/AuthProvider";
import { useAutoWeeklySnapshot } from "@/presentation/hooks/useAutoWeeklySnapshot";
import { useSectionColors } from "@/presentation/hooks/useSectionColors";

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <BrandMark className="size-6" />
      <span className="text-lg font-semibold tracking-wide text-foreground">
        Portafolio
      </span>
    </div>
  );
}

function NavLinks({
  onNavigate,
  colors,
}: {
  onNavigate?: () => void;
  colors: Record<string, string>;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon }) => {
        const color = colors[to];
        return (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onNavigate}
            style={({ isActive }) =>
              isActive && color
                ? {
                    backgroundColor: `${color}26`,
                    color,
                    boxShadow: `0 0 12px 0 ${color}8c`,
                  }
                : undefined
            }
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? color
                    ? ""
                    : "bg-primary/15 text-primary glow-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppLayout() {
  const { user, signOutUser } = useAuth();
  const [open, setOpen] = useState(false);
  const { colors, setColor, clearColor } = useSectionColors();
  useAutoWeeklySnapshot();

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar de escritorio */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 p-4 md:flex">
        <Brand />
        <div className="mt-6 flex-1">
          <NavLinks colors={colors} />
        </div>
        <UserFooter
          userLabel={user?.displayName ?? user?.email}
          onSignOut={signOutUser}
          colors={colors}
          setColor={setColor}
          clearColor={clearColor}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar de móvil */}
        <header className="flex items-center gap-2 border-b border-border bg-card/40 px-4 py-3 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-card">
              <SheetTitle className="px-4 pt-4">
                <Brand />
              </SheetTitle>
              <div className="flex h-full flex-col p-4 pt-2">
                <div className="flex-1">
                  <NavLinks colors={colors} onNavigate={() => setOpen(false)} />
                </div>
                <UserFooter
                  userLabel={user?.displayName ?? user?.email}
                  onSignOut={signOutUser}
                  colors={colors}
                  setColor={setColor}
                  clearColor={clearColor}
                />
              </div>
            </SheetContent>
          </Sheet>
          <Brand />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function UserFooter({
  userLabel,
  onSignOut,
  colors,
  setColor,
  clearColor,
}: {
  userLabel?: string | null;
  onSignOut: () => void;
  colors: Record<string, string>;
  setColor: (sectionTo: string, color: string) => void;
  clearColor: (sectionTo: string) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-1 border-t border-border pt-4">
      <span className="truncate text-xs text-muted-foreground">{userLabel}</span>
      <div className="flex shrink-0 items-center">
        <SectionColorsEditor colors={colors} setColor={setColor} clearColor={clearColor} />
        <BackupDialog />
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Cerrar sesión" onClick={onSignOut}>
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}
