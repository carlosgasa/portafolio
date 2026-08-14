/**
 * Importa el JSON de scripts/import-data/ (generado por extract_ods.py) a Firestore.
 *
 * Uso:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/import-to-firestore.mjs
 *   (solo imprime un resumen, no escribe nada)
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/import-to-firestore.mjs --commit
 *   (escribe de verdad en Firestore)
 *
 * Requiere una llave de cuenta de servicio: Firebase Console > Configuracion
 * del proyecto > Cuentas de servicio > Generar nueva clave privada.
 * NUNCA subir ese archivo al repo (ya deberia estar fuera del control de git).
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const ALLOWED_EMAIL = process.env.VITE_ALLOWED_EMAIL ?? "gscarlos1010@gmail.com";
const DATA_DIR = new URL("./import-data/", import.meta.url);
const COMMIT = process.argv.includes("--commit");

const COLLECTIONS = [
  { file: "snapshots.json", collection: "snapshots", docId: (item) => item.fecha },
  { file: "casaGastos.json", collection: "casaGastos" },
  { file: "aforeValores.json", collection: "aforeValores" },
  { file: "yotePrestoValores.json", collection: "yotePrestoValores" },
  { file: "yotePrestoMovimientos.json", collection: "yotePrestoMovimientos" },
  { file: "finsusCuentas.json", collection: "finsusCuentas" },
  { file: "finsusMovimientos.json", collection: "finsusMovimientos" },
  { file: "criptoHoldings.json", collection: "criptoHoldings" },
  { file: "criptoMovimientos.json", collection: "criptoMovimientos" },
  { file: "bolsaHoldings.json", collection: "bolsaHoldings" },
  { file: "bolsaMovimientos.json", collection: "bolsaMovimientos" },
];

async function main() {
  const files = await readdir(DATA_DIR);
  if (files.length === 0) {
    console.error("No hay JSON en scripts/import-data/. Corre primero extract_ods.py");
    process.exit(1);
  }

  initializeApp({ credential: applicationDefault() });
  const auth = getAuth();
  const db = getFirestore();

  const user = await auth.getUserByEmail(ALLOWED_EMAIL);
  const uid = user.uid;
  console.log(`Usuario encontrado: ${ALLOWED_EMAIL} -> uid ${uid}`);
  console.log(COMMIT ? "MODO: escribiendo en Firestore de verdad" : "MODO: dry-run (nada se escribe, usa --commit para aplicar)");
  console.log("");

  const userRef = db.collection("users").doc(uid);

  for (const { file, collection, docId } of COLLECTIONS) {
    const filePath = path.join(DATA_DIR.pathname, file);
    const raw = await readFile(filePath, "utf-8");
    const items = JSON.parse(raw);

    console.log(`${collection}: ${items.length} registros (${file})`);
    if (items.length > 0) {
      console.log("  ejemplo:", JSON.stringify(items[0]));
    }

    if (!COMMIT) continue;

    const colRef = userRef.collection(collection);
    let batch = db.batch();
    let count = 0;
    for (const item of items) {
      const ref = docId ? colRef.doc(String(docId(item))) : colRef.doc();
      batch.set(ref, item);
      count++;
      if (count % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    if (count % 400 !== 0) await batch.commit();
  }

  console.log("");
  console.log(COMMIT ? "Importacion completa." : "Dry-run completo. Revisa los ejemplos de arriba y vuelve a correr con --commit para aplicar.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
