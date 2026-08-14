import { onSchedule } from "firebase-functions/v2/scheduler";
import type { DocumentReference } from "firebase-admin/firestore";
import { db } from "../admin.js";

function todayMexicoCity(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function sumField(
  userRef: DocumentReference,
  collectionName: string,
  field: string,
): Promise<number> {
  const snap = await userRef.collection(collectionName).get();
  return snap.docs.reduce((sum, d) => sum + (Number(d.data()[field]) || 0), 0);
}

async function latestValue(
  userRef: DocumentReference,
  collectionName: string,
  dateField: string,
  valueField: string,
): Promise<number> {
  const snap = await userRef.collection(collectionName).orderBy(dateField, "desc").limit(1).get();
  if (snap.empty) return 0;
  return Number(snap.docs[0].data()[valueField]) || 0;
}

async function cryptoValor(userRef: DocumentReference): Promise<number> {
  const [holdingsSnap, pricesSnap] = await Promise.all([
    userRef.collection("criptoHoldings").get(),
    userRef.collection("criptoPrecios").get(),
  ]);
  const priceBySymbol = new Map<string, number>(
    pricesSnap.docs.map((d) => [d.id, Number(d.data().precioMxn) || 0]),
  );
  return holdingsSnap.docs.reduce((sum, d) => {
    const data = d.data();
    const precio = priceBySymbol.get(String(data.symbol).toUpperCase()) ?? 0;
    return sum + Number(data.cantidad) * precio;
  }, 0);
}

async function bolsaValor(userRef: DocumentReference): Promise<number> {
  const [holdingsSnap, pricesSnap] = await Promise.all([
    userRef.collection("bolsaHoldings").get(),
    userRef.collection("bolsaPrecios").get(),
  ]);
  const priceByTicker = new Map<string, number>(
    pricesSnap.docs.map((d) => [d.id, Number(d.data().precio) || 0]),
  );
  return holdingsSnap.docs.reduce((sum, d) => {
    const data = d.data();
    const precio = priceByTicker.get(String(data.ticker).toUpperCase()) ?? 0;
    return sum + Number(data.cantidad) * precio;
  }, 0);
}

/**
 * Corre semanal: revive el historico que antes se llevaba a mano en la
 * hoja "Totales", calculando aporte/valor/rendimiento por instrumento y
 * guardando un snapshot fechado.
 */
export const weeklySnapshot = onSchedule(
  {
    schedule: "0 23 * * 0",
    timeZone: "America/Mexico_City",
    region: "us-central1",
  },
  async () => {
    const fecha = todayMexicoCity();
    const usersSnap = await db.collection("users").get();

    for (const userDoc of usersSnap.docs) {
      const userRef = userDoc.ref;

      const [
        finsusValor,
        finsusAporte,
        criptoValorTotal,
        criptoAporte,
        bolsaValorTotal,
        bolsaAporte,
        yotePrestoValor,
        yotePrestoAporte,
        aforeValor,
      ] = await Promise.all([
        sumField(userRef, "finsusCuentas", "saldo"),
        sumField(userRef, "finsusMovimientos", "monto"),
        cryptoValor(userRef),
        sumField(userRef, "criptoMovimientos", "monto"),
        bolsaValor(userRef),
        sumField(userRef, "bolsaMovimientos", "monto"),
        latestValue(userRef, "yotePrestoValores", "fecha", "valorCuenta"),
        sumField(userRef, "yotePrestoMovimientos", "monto"),
        latestValue(userRef, "aforeValores", "fecha", "saldo"),
      ]);

      const porInstrumento = {
        Finsus: { aporte: finsusAporte, valor: finsusValor },
        Criptos: { aporte: criptoAporte, valor: criptoValorTotal },
        Bolsa: { aporte: bolsaAporte, valor: bolsaValorTotal },
        YoTePresto: { aporte: yotePrestoAporte, valor: yotePrestoValor },
        AFORE: { aporte: 0, valor: aforeValor },
      };

      const aporteTotal = finsusAporte + criptoAporte + bolsaAporte + yotePrestoAporte;
      const valorTotal =
        finsusValor + criptoValorTotal + bolsaValorTotal + yotePrestoValor + aforeValor;
      const rendimiento =
        aporteTotal !== 0 ? (valorTotal - aporteTotal) / Math.abs(aporteTotal) : 0;

      await userRef.collection("snapshots").doc(fecha).set({
        fecha,
        aporteTotal,
        valorTotal,
        rendimiento,
        porInstrumento,
      });
    }
  },
);
