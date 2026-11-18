// Sesión 3: el agente paga solo la API de la sesión 2, con un tope por pago.
// wrapFetchWithPayment envuelve al fetch normal: cuando la API contesta 402, lee el
// precio, firma el pago con la wallet del agente y vuelve a pedir.
// Uso: npm run agente           (con la API prendida en otra terminal: npm run api)
//      TOPE='$0.005' npm run agente   para ver cómo rechaza un cobro mayor al tope
import { x402Client, x402HTTPClient, wrapFetchWithPayment } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { API_URL, RED, RPC_URL, RUTA_DE_PAGO, enlaceTx, requerida } from "../comun.js";

const API = new URL(RUTA_DE_PAGO, API_URL).toString();
const TOPE = process.env.TOPE || "$0.02"; // lo máximo que el agente paga por una llamada

// El agente firma con SU wallet, nunca con la tuya
const signer = createEd25519Signer(requerida("AGENTE_SECRET"), RED);
const client = x402Client.fromConfig({
  schemes: [{ network: "stellar:*", client: new ExactStellarScheme(signer, { url: RPC_URL }) }],
  // Tope por pago: si la API cobra más, x402 lo rechaza ANTES de firmar
  spendControls: { maxAmountPerPayment: TOPE },
});
const fetchQuePaga = wrapFetchWithPayment(fetch, client);

console.log(`🤖 Agente ${signer.address} pide ${API} (tope ${TOPE} por pago)`);
try {
  const res = await fetchQuePaga(API);
  const pago = new x402HTTPClient(client).getPaymentSettleResponse((h) => res.headers.get(h));
  console.log(`Respuesta ${res.status}:`, await res.json());
  console.log(`Pagó: ${enlaceTx(pago.transaction)}`);
} catch (e) {
  if (String(e.message).includes("maxAmountPerPayment")) {
    console.log(
      `⛔ Rechazado: la API cobra más que el tope (${TOPE}). No se firmó ni se envió ninguna transacción.`,
    );
    process.exit(1);
  }
  throw e;
}
