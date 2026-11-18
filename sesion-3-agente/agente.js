// Sesión 3: el agente paga solo la API de la sesión 2, con un tope por pago y sin
// pagar a ciegas. Antes de firmar pregunta el precio y revisa su saldo; si la API no
// responde, reintenta la petición (no el pago); y paga una sola vez.
// Uso: npm run agente           (con la API prendida en otra terminal: npm run api)
//      TOPE='$0.005' npm run agente   para ver cómo rechaza un cobro mayor al tope
import { x402Client, x402HTTPClient, wrapFetchWithPayment } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { API_URL, RED, RPC_URL, RUTA_DE_PAGO, enlaceTx, requerida, saldos } from "../comun.js";

const API = new URL(RUTA_DE_PAGO, API_URL).toString();
const TOPE = process.env.TOPE || "$0.02"; // lo máximo que el agente paga por una llamada
const INTENTOS = 3; // reintentos solo si la API no responde, nunca después de pagar
const UNIDADES = 1e7; // USDC en Stellar usa 7 decimales

// El agente firma con SU wallet, nunca con la tuya
const signer = createEd25519Signer(requerida("AGENTE_SECRET"), RED);
const client = x402Client.fromConfig({
  schemes: [{ network: "stellar:*", client: new ExactStellarScheme(signer, { url: RPC_URL }) }],
  // Tope por pago: si la API cobra más, x402 lo rechaza ANTES de firmar
  spendControls: { maxAmountPerPayment: TOPE },
});
const http = new x402HTTPClient(client);
const fetchQuePaga = wrapFetchWithPayment(fetch, client);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Saldo USDC del agente, en unidades enteras
async function saldoUSDC() {
  const s = await saldos(signer.address);
  return Math.round(Number(s.USDC ?? 0) * UNIDADES);
}

// 1. Pregunta el precio SIN pagar. Si la API no responde, reintenta con espera creciente.
let precio;
for (let i = 1; ; i++) {
  try {
    const r = await fetch(API);
    if (r.status !== 402) {
      console.log(`La ruta no cobra (status ${r.status}).`);
      process.exit(0);
    }
    precio = Number(http.getPaymentRequiredResponse((h) => r.headers.get(h)).accepts[0].amount);
    break;
  } catch {
    if (i === INTENTOS) {
      console.log(`❌ La API no responde después de ${INTENTOS} intentos. No se pagó nada.`);
      process.exit(1);
    }
    console.log(`La API no responde (intento ${i}/${INTENTOS}), reintento en ${i}s…`);
    await esperar(i * 1000);
  }
}

// 2. Antes de firmar: ¿alcanza el saldo?
const saldo = await saldoUSDC();
console.log(
  `🤖 Agente ${signer.address} · precio ${precio / UNIDADES} USDC · saldo ${saldo / UNIDADES} USDC · tope ${TOPE}`,
);
if (saldo < precio) {
  console.log("⛔ Saldo insuficiente. No se firmó nada.");
  process.exit(1);
}

// 3. Paga UNA vez. Si algo falla después de enviar el pago, no reintenta a ciegas: revisa el saldo.
try {
  const res = await fetchQuePaga(API);
  const pago = http.getPaymentSettleResponse((h) => res.headers.get(h));
  console.log(`Respuesta ${res.status}:`, await res.json());
  console.log(`Pagó: ${enlaceTx(pago.transaction)}`);
} catch (e) {
  if (String(e.message).includes("maxAmountPerPayment")) {
    console.log(
      `⛔ Rechazado: la API cobra más que el tope (${TOPE}). No se firmó ni se envió ninguna transacción.`,
    );
    process.exit(1);
  }
  const despues = await saldoUSDC();
  console.log(`❌ Falló el pago: ${e.message}`);
  console.log(
    despues < saldo
      ? "Ojo: el saldo sí bajó, el pago pudo liquidarse. Revisa la wallet antes de volver a intentar."
      : "El saldo no cambió: no se cobró nada. Puedes volver a intentar, que firmará una autorización nueva.",
  );
  process.exit(1);
}
