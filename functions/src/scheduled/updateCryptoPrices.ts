import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { db } from "../admin.js";

function todayMexicoCity(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function fetchUsdMxnRate(): Promise<number> {
  const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=MXN");
  if (!res.ok) throw new Error(`frankfurter.dev respondio ${res.status}`);
  const data = (await res.json()) as { rates: { MXN: number } };
  return data.rates.MXN;
}

async function fetchCryptoPriceUsd(symbol: string): Promise<number | null> {
  const res = await fetch(`https://cryptoprices.cc/${symbol}/`);
  if (!res.ok) return null;
  const text = (await res.text()).trim();
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * Corre diario: replica lo que antes se hacia a mano con
 * IMPORTDATA("cryptoprices.cc/{symbol}") * GOOGLEFINANCE("CURRENCY:USDMXN").
 * Si un simbolo no es soportado por cryptoprices.cc, se omite y ese holding
 * se queda esperando captura manual (no rompe el resto).
 */
export const updateCryptoPrices = onSchedule(
  {
    schedule: "0 8 * * *",
    timeZone: "America/Mexico_City",
    region: "us-central1",
  },
  async () => {
    const fecha = todayMexicoCity();
    const usdMxn = await fetchUsdMxnRate();

    const usersSnap = await db.collection("users").get();

    for (const userDoc of usersSnap.docs) {
      const holdingsSnap = await userDoc.ref.collection("criptoHoldings").get();
      const symbols = [...new Set(holdingsSnap.docs.map((d) => (d.data().symbol as string).toUpperCase()))];

      for (const symbol of symbols) {
        try {
          const precioUsd = await fetchCryptoPriceUsd(symbol);
          if (precioUsd === null) {
            logger.warn(`Sin precio automatico para ${symbol}, se omite`);
            continue;
          }
          await userDoc.ref.collection("criptoPrecios").doc(symbol).set({
            symbol,
            precioUsd,
            precioMxn: precioUsd * usdMxn,
            fecha,
          });
        } catch (err) {
          logger.error(`Error actualizando precio de ${symbol}`, err);
        }
      }
    }
  },
);
