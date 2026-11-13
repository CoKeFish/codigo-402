// Sesión 2 · commit 3: el cliente que paga la API. Es el cliente de ejemplo oficial
// de Stellar (x402 Quickstart), firmando con la cuenta del pagador.
// Uso: npm run cliente           (con la API prendida en otra terminal: npm run api)
import { Transaction, TransactionBuilder } from "@stellar/stellar-sdk";
import { x402Client, x402HTTPClient } from "@x402/fetch";
import { createEd25519Signer, getNetworkPassphrase } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { API_URL, RED, RPC_URL, RUTA_DE_PAGO, enlaceTx, requerida } from "../comun.js";

const url = new URL(RUTA_DE_PAGO, API_URL).toString();
const firmante = createEd25519Signer(requerida("PAGADOR_SECRET"), RED);
const cliente = new x402Client().register(
  "stellar:*",
  new ExactStellarScheme(firmante, { url: RPC_URL }),
);
const http = new x402HTTPClient(cliente);
console.log(`Objetivo: ${url}\nCliente: ${firmante.address}`);

// 1. Pide sin pagar: la API responde 402 con las instrucciones.
const primera = await fetch(url);
console.log(`Sin pago: ${primera.status}`);
const requerido = http.getPaymentRequiredResponse((n) => primera.headers.get(n));

// 2. Arma y firma el pago con la llave del pagador.
let pago = await cliente.createPaymentPayload(requerido);

// Comisión de 1 stroop, como en el ejemplo oficial (límite del facilitador de testnet).
const passphrase = getNetworkPassphrase(RED);
const tx = new Transaction(pago.payload.transaction, passphrase);
const ext = tx.toEnvelope().value.tx.ext;
if (ext.type === "sorobanData") {
  const ajustada = TransactionBuilder.cloneFrom(tx, {
    fee: "1",
    sorobanData: ext.value,
    networkPassphrase: passphrase,
  }).build();
  pago = { ...pago, payload: { ...pago.payload, transaction: ajustada.toXDR() } };
}

// 3. Vuelve a pedir, ahora con el pago firmado.
const pagada = await fetch(url, { headers: http.encodePaymentSignatureHeader(pago) });
const cuerpo = await pagada.text();
console.log(`Con pago: ${pagada.status} ${cuerpo}`);
if (!pagada.ok) process.exit(1);

const liquidacion = http.getPaymentSettleResponse((n) => pagada.headers.get(n));
console.log(`Hash: ${liquidacion.transaction}`);
console.log(`  ${enlaceTx(liquidacion.transaction)}`);
