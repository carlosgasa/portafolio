/**
 * Importa el JSON de scripts/import-data/ (generado por extract_ods.py) a Firestore
 * usando el SDK cliente de Firebase, autenticado como el usuario autorizado
 * (mismo mecanismo de login que usa la app). No requiere cuenta de servicio.
 *
 * Uso:
 *   node scripts/import-to-firestore-client.mjs
 *   (dry-run: solo imprime un resumen, no escribe nada)
 *
 *   node scripts/import-to-firestore-client.mjs --commit
 *   (escribe de verdad en Firestore)
 *
 * Pide el password por stdin de forma interactiva, nunca por argumento/env.
 */
import { readFile, readdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  writeBatch,
} from "firebase/firestore";

const DATA_DIR = new URL("./import-data/", import.meta.url);
const COMMIT = process.argv.includes("--commit");

const BACKSPACE = "";
const CTRL_C = "";

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let input = "";
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (char) => {
      if (char === "\n" || char === "\r") {
        stdin.setRawMode(false);
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(input);
      } else if (char === CTRL_C) {
        process.exit(1);
      } else if (char === BACKSPACE) {
        input = input.slice(0, -1);
      } else {
        input += char;
      }
    };
    stdin.on("data", onData);
  });
}

function loadEnv() {
  const envPath = path.join(new URL("../", import.meta.url).pathname, ".env");
  const raw = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

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
  { file: "bolsaMovimientos.json", collection: "bolsaMovimientos" },
];

async function main() {
  const env = loadEnv();

  const files = await readdir(DATA_DIR);
  if (files.length === 0) {
    console.error("No hay JSON en scripts/import-data/. Corre primero extract_ods.py");
    process.exit(1);
  }

  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = env.VITE_ALLOWED_EMAIL;
  const password = await askHidden(`Password para ${email}: `);

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  console.log(`Autenticado: ${email} -> uid ${uid}`);
  console.log(COMMIT ? "MODO: escribiendo en Firestore de verdad" : "MODO: dry-run (nada se escribe, usa --commit para aplicar)");
  console.log("");

  const userRef = doc(db, "users", uid);

  for (const { file, collection: colName, docId } of COLLECTIONS) {
    const filePath = path.join(DATA_DIR.pathname, file);
    const rawJson = await readFile(filePath, "utf-8");
    const items = JSON.parse(rawJson);

    console.log(`${colName}: ${items.length} registros (${file})`);
    if (items.length > 0) {
      console.log("  ejemplo:", JSON.stringify(items[0]));
    }

    if (!COMMIT) continue;

    const colRef = collection(userRef, colName);
    let batch = writeBatch(db);
    let count = 0;
    for (const item of items) {
      const ref = docId ? doc(colRef, String(docId(item))) : doc(colRef);
      batch.set(ref, item);
      count++;
      if (count % 400 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    if (count % 400 !== 0) await batch.commit();
  }

  console.log("");
  console.log(COMMIT ? "Importacion completa." : "Dry-run completo. Revisa los ejemplos de arriba y vuelve a correr con --commit para aplicar.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
