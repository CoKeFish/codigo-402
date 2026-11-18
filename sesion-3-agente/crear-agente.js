// Sesión 3 · bloque 1: una wallet solo para el agente, con presupuesto chico.
// Friendbot le da XLM, se abre su trustline de USDC y el pagador le pasa el presupuesto.
// Si el agente falla o lo engañan, lo más que puede perder es ese presupuesto.
// Uso: npm run agente-wallet
import { BASE_FEE, Keypair, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { appendFileSync } from "node:fs";
import {
  FRIENDBOT_URL,
  PASSPHRASE,
  RUTA_ENV,
  USDC,
  enlaceTx,
  horizon,
  requerida,
} from "../comun.js";

const PRESUPUESTO = "0.05"; // lo único que el agente puede gastar

if (process.env.AGENTE_SECRET) {
  console.log("El agente ya tiene wallet en .env.");
  process.exit(0);
}

// 1. Wallet nueva solo para el agente: XLM de Friendbot y trustline de USDC
const agente = Keypair.random();
const r = await fetch(`${FRIENDBOT_URL}?addr=${agente.publicKey()}`);
if (!r.ok) throw new Error(`Friendbot falló: ${r.status}`);
let cuenta = await horizon.loadAccount(agente.publicKey());
let tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
  .addOperation(Operation.changeTrust({ asset: USDC }))
  .setTimeout(60)
  .build();
tx.sign(agente);
await horizon.submitTransaction(tx);

// 2. Tu cuenta (el pagador) le pasa un presupuesto chico de USDC
const yo = Keypair.fromSecret(requerida("PAGADOR_SECRET"));
cuenta = await horizon.loadAccount(yo.publicKey());
tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
  .addOperation(
    Operation.payment({ destination: agente.publicKey(), asset: USDC, amount: PRESUPUESTO }),
  )
  .setTimeout(60)
  .build();
tx.sign(yo);
const res = await horizon.submitTransaction(tx);

// Las llaves del agente van al .env, que no se sube.
appendFileSync(
  RUTA_ENV,
  `\nAGENTE_PUBLIC=${agente.publicKey()}\nAGENTE_SECRET=${agente.secret()}\n`,
);
console.log(`✅ Wallet del agente: ${agente.publicKey()}`);
console.log(`   Presupuesto: ${PRESUPUESTO} USDC ${enlaceTx(res.hash)}`);
