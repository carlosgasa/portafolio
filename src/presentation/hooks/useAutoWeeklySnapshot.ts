import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePortfolioHistory } from "@/presentation/hooks/usePortfolioHistory";
import { useAforePortfolio } from "@/presentation/hooks/useAforePortfolio";
import { useBolsaPortfolio } from "@/presentation/hooks/useBolsaPortfolio";
import { useCryptoPortfolio } from "@/presentation/hooks/useCryptoPortfolio";
import { useFinsusPortfolio } from "@/presentation/hooks/useFinsusPortfolio";
import { useYoTePrestoPortfolio } from "@/presentation/hooks/useYoTePrestoPortfolio";
import { useAuth } from "@/presentation/providers/AuthProvider";
import { FirestoreSnapshotRepository } from "@/infrastructure/firebase/repositories/FirestoreSnapshotRepository";
import type { PortfolioSnapshot } from "@/domain/entities/dashboard";

const repo = new FirestoreSnapshotRepository();

function todayMexicoCity(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Domingo mas reciente <= fechaISO (limite semanal, igual que el cron que
 * ya no corre en Cloud Functions). */
function mostRecentSunday(fechaISO: string): string {
  const d = new Date(`${fechaISO}T00:00:00`);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

/**
 * No hay Cloud Function corriendo el snapshot semanal (requeriria plan
 * Blaze). En su lugar, cada vez que se abre la app y ya paso el domingo
 * mas reciente sin snapshot, se toma uno con los datos que ya se cargan
 * en el Dashboard.
 */
export function useAutoWeeklySnapshot() {
  const { user } = useAuth();
  const uid = user?.uid as string | undefined;
  const queryClient = useQueryClient();
  const attempted = useRef(false);

  const history = usePortfolioHistory();
  const afore = useAforePortfolio();
  const bolsa = useBolsaPortfolio();
  const cripto = useCryptoPortfolio();
  const finsus = useFinsusPortfolio();
  const yotepresto = useYoTePrestoPortfolio();

  const allLoaded =
    !!uid &&
    history.data !== undefined &&
    afore.query.data !== undefined &&
    bolsa.query.data !== undefined &&
    cripto.query.data !== undefined &&
    finsus.query.data !== undefined &&
    yotepresto.query.data !== undefined;

  useEffect(() => {
    if (!allLoaded || attempted.current || !uid) return;
    attempted.current = true;

    const targetSunday = mostRecentSunday(todayMexicoCity());
    const latestFecha = history.data?.latest?.fecha ?? "";
    if (latestFecha >= targetSunday) return;

    const aforeValor = afore.latest?.saldo ?? 0;
    const bolsaValor = bolsa.query.data?.valorTotal ?? 0;
    const bolsaAporte = bolsa.query.data?.aporteTotal ?? 0;
    const criptoValor = cripto.query.data?.valorTotal ?? 0;
    const criptoAporte = cripto.query.data?.aporteTotal ?? 0;
    const finsusValor = finsus.query.data?.valorTotal ?? 0;
    const finsusAporte = finsus.query.data?.aporteTotal ?? 0;
    const yotepresrtoValor = yotepresto.query.data?.valorTotal ?? 0;
    const yotepresrtoAporte = yotepresto.query.data?.aporteTotal ?? 0;

    const porInstrumento = {
      Finsus: { aporte: finsusAporte, valor: finsusValor },
      Criptos: { aporte: criptoAporte, valor: criptoValor },
      Bolsa: { aporte: bolsaAporte, valor: bolsaValor },
      YoTePresto: { aporte: yotepresrtoAporte, valor: yotepresrtoValor },
      AFORE: { aporte: 0, valor: aforeValor },
    };

    const aporteTotal = finsusAporte + criptoAporte + bolsaAporte + yotepresrtoAporte;
    const valorTotal = finsusValor + criptoValor + bolsaValor + yotepresrtoValor + aforeValor;
    const rendimiento =
      aporteTotal !== 0 ? (valorTotal - aporteTotal) / Math.abs(aporteTotal) : 0;

    const snapshot: PortfolioSnapshot = {
      fecha: targetSunday,
      aporteTotal,
      valorTotal,
      rendimiento,
      porInstrumento,
    };

    repo.saveSnapshot(uid, snapshot).then(() => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-history", uid] });
    });
  }, [allLoaded, uid, history.data, afore.latest, bolsa.query.data, cripto.query.data, finsus.query.data, yotepresto.query.data, queryClient]);
}
