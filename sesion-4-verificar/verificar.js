// Sesión 4: verifica un pago preguntándole directo a la red (RPC de Stellar) por su hash.
// No confía en lo que diga la API ni el agente: revisa qué se movió de verdad.
// Uso: npm run verificar -- <hash de 64 caracteres>
//      MONTO=0.05 npm run verificar -- <hash>     para ver cómo rechaza un monto distinto
import { rpc } from "@stellar/stellar-sdk";
import { fileURLToPath } from "node:url";
import { PASSPHRASE, PRECIO, RPC_URL, USDC, enlaceTx } from "../comun.js";

const server = new rpc.Server(RPC_URL);
// El contrato de USDC en testnet (el mismo USDC de las sesiones 1 a 3)
const USDC_CONTRATO = USDC.contractId(PASSPHRASE);
const UNIDADES = 1e7; // USDC en Stellar usa 7 decimales: 0.01 USDC = 100000 unidades

// Revisa en la red que el pago sea el que esperas. Devuelve { ok, motivos }.
// La RPC pública de testnet solo guarda unos 7 días de historia.
export async function verificar(hash, { destino, monto }) {
  const motivos = [];
  const tx = await server.getTransaction(hash);
  if (tx.status !== "SUCCESS") {
    return { ok: false, motivos: [`la transacción no está confirmada (${tx.status})`] };
  }

  // Los eventos dicen lo que de verdad se movió: "transfer" de USDC, de quién, a quién y cuánto
  const eventos = JSON.parse(JSON.stringify(tx.events.contractEventsXdr)).flat();
  const pago = eventos.find((e) => e.body.v0.topics[0].symbol === "transfer");
  if (!pago) return { ok: false, motivos: ["no hay ninguna transferencia en esta transacción"] };

  const [, de, a] = pago.body.v0.topics.map((t) => t.address);
  const pagado = BigInt(pago.body.v0.data.i128);
  const esperado = BigInt(Math.round(Number(monto) * UNIDADES));

  if (pago.contract_id !== USDC_CONTRATO) motivos.push(`no es USDC: el contrato es ${pago.contract_id}`);
  if (a !== destino) motivos.push(`el destinatario es ${a}, no ${destino}`);
  if (pagado !== esperado) motivos.push(`el monto es ${Number(pagado) / UNIDADES} USDC, no ${monto}`);
  return { ok: motivos.length === 0, motivos, de, a, monto: Number(pagado) / UNIDADES };
}

// Si lo corres desde la terminal: npm run verificar -- <hash>
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hash = process.argv[2];
  if (!/^[0-9a-f]{64}$/.test(hash || "")) {
    console.log("Uso: npm run verificar -- <hash de 64 caracteres>");
    process.exit(1);
  }
  const destino = process.env.DESTINO || process.env.COBRADOR_PUBLIC; // por defecto: la cuenta de la API
  const monto = process.env.MONTO || PRECIO.replace("$", ""); // lo que cobra tu API
  console.log(`🔎 ${hash}\nEsperado: ${monto} USDC a ${destino}`);
  const r = await verificar(hash, { destino, monto });
  if (r.ok) {
    console.log(`✅ ACEPTADO: ${r.monto} USDC de ${r.de} a ${r.a}`);
    console.log(`Verlo: ${enlaceTx(hash)}`);
  } else {
    console.log(`❌ RECHAZADO: ${r.motivos.join("; ")}`);
    process.exit(1);
  }
}
