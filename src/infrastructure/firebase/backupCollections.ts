export interface BackupCollectionMeta {
  name: string;
  label: string;
}

/** Todas las colecciones bajo users/{uid}/{name} que existen en la app,
 * para que el backup/restore no dependa de mantener sincronizados varios
 * repositorios tipados: lee/escribe estas colecciones tal cual, como
 * documentos genericos. */
export const BACKUP_COLLECTIONS: BackupCollectionMeta[] = [
  { name: "aforeValores", label: "AFORE — saldos" },
  { name: "bolsaHoldings", label: "Bolsa — holdings" },
  { name: "bolsaMovimientos", label: "Bolsa — movimientos" },
  { name: "bolsaPrecios", label: "Bolsa — precios" },
  { name: "casaGastos", label: "Casa — gastos" },
  { name: "criptoHoldings", label: "Cripto — holdings" },
  { name: "criptoMovimientos", label: "Cripto — movimientos" },
  { name: "criptoPrecios", label: "Cripto — precios" },
  { name: "tarjetas", label: "Cuentas — tarjetas" },
  { name: "tarjetaPagos", label: "Cuentas — pagos de tarjeta" },
  { name: "personas", label: "Cuentas — personas" },
  { name: "deudas", label: "Cuentas — deudas" },
  { name: "cuotas", label: "Cuentas — cuotas" },
  { name: "liquidez", label: "Cuentas — liquidez" },
  { name: "cuentasSnapshots", label: "Cuentas — snapshots" },
  { name: "finsusCuentas", label: "Finsus — inversiones" },
  { name: "finsusMovimientos", label: "Finsus — movimientos" },
  { name: "yotePrestoValores", label: "YoTePresto — valores" },
  { name: "yotePrestoMovimientos", label: "YoTePresto — movimientos" },
  { name: "snapshots", label: "Dashboard — snapshots semanales" },
];
