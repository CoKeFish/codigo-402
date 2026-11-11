// Configuración compartida por todas las sesiones. Todo corre en la testnet de Stellar.
import dotenv from "dotenv";
import { Asset, Horizon, Networks } from "@stellar/stellar-sdk";
import { fileURLToPath } from "node:url";

export const RUTA_ENV = fileURLToPath(new URL("./.env", import.meta.url));
dotenv.config({ path: RUTA_ENV, quiet: true });

export const RED = "stellar:testnet";
export const PASSPHRASE = Networks.TESTNET;
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const horizon = new Horizon.Server(HORIZON_URL);

// USDC de prueba (emisor de Circle en testnet)
export const USDC = new Asset(
  "USDC",
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
);

export const FACILITATOR_URL =
  process.env.FACILITATOR_URL ?? "https://www.x402.org/facilitator";
export const API_URL = process.env.API_URL ?? "http://localhost:4021";
export const RUTA_DE_PAGO = "/dato";
export const PRECIO = process.env.PRECIO ?? "$0.01";

export function requerida(nombre) {
  const valor = process.env[nombre];
  if (!valor || valor.endsWith("...")) {
    console.error(`Falta ${nombre} en .env. Corre primero: npm run cuentas`);
    process.exit(1);
  }
  return valor;
}

export const enlaceTx = (hash) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;
export const enlaceCuenta = (pub) =>
  `https://stellar.expert/explorer/testnet/account/${pub}`;

export async function saldos(publica) {
  const cuenta = await horizon.loadAccount(publica);
  return Object.fromEntries(
    cuenta.balances.map((b) => [
      b.asset_type === "native" ? "XLM" : b.asset_code,
      b.balance,
    ]),
  );
}
