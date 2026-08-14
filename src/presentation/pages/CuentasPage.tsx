import { Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { HideBalancesButton } from "@/presentation/components/HideBalancesButton";
import { useCuentas } from "@/presentation/hooks/useCuentas";
import { TarjetasTab } from "@/presentation/pages/cuentas/TarjetasTab";
import { PersonasTab } from "@/presentation/pages/cuentas/PersonasTab";
import { LiquidezTab } from "@/presentation/pages/cuentas/LiquidezTab";

export function CuentasPage() {
  const api = useCuentas();
  const data = api.query.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Wallet className="size-6 text-primary" />
            Cuentas
          </h1>
          <p className="text-sm text-muted-foreground">
            Tarjetas, personas que te deben y liquidez de corto plazo
          </p>
        </div>
        <HideBalancesButton />
      </div>

      {api.query.isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Tabs defaultValue="tarjetas">
          <TabsList>
            <TabsTrigger value="tarjetas">Tarjetas</TabsTrigger>
            <TabsTrigger value="personas">Personas</TabsTrigger>
            <TabsTrigger value="liquidez">Liquidez</TabsTrigger>
          </TabsList>
          <TabsContent value="tarjetas" className="mt-4">
            <TarjetasTab
              api={api}
              cards={data.cards}
              totalPendiente={data.totalTarjetasPendiente}
              snapshots={data.snapshots}
            />
          </TabsContent>
          <TabsContent value="personas" className="mt-4">
            <PersonasTab
              api={api}
              persons={data.persons}
              totalMeDeben={data.totalMeDeben}
              snapshots={data.snapshots}
            />
          </TabsContent>
          <TabsContent value="liquidez" className="mt-4">
            <LiquidezTab
              api={api}
              balances={data.liquidBalances}
              total={data.totalLiquidez}
              snapshots={data.snapshots}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
