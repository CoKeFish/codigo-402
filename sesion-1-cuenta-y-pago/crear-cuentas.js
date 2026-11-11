// Sesión 1 · commit 2: crea dos cuentas de testnet (pagador y cobrador), las fondea
// con Friendbot, les abre la trustline de USDC y guarda las llaves en .env.
// Se puede correr varias veces: lo que ya existe no se repite.
import {
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { appendFileSync } from "node:fs";
import {
  FRIENDBOT_URL,
  PASSPHRASE,
  RUTA_ENV,
  USDC,
  enlaceCuenta,
  enlaceTx,
  horizon,
  saldos,
} from "../comun.js";

async function crearCuenta(rol) {
  const par = Keypair.random();
  // Friendbot regala 10,000 XLM de prueba
  const res = await fetch(`${FRIENDBOT_URL}?addr=${par.publicKey()}`);
  if (!res.ok) throw new Error(`Friendbot falló para ${rol}: ${res.status}`);
  appendFileSync(
    RUTA_ENV,
    `${rol}_SECRET=${par.secret()}\n${rol}_PUBLIC=${par.publicKey()}\n`,
  );
  console.log(`${rol}: cuenta nueva creada y fondeada`);
  return par;
}

// Trustline: "acepto recibir USDC"
async function abrirTrustline(rol, par) {
  const cuenta = await horizon.loadAccount(par.publicKey());
  const yaTiene = cuenta.balances.some(
    (b) => b.asset_code === USDC.code && b.asset_issuer === USDC.issuer,
  );
  if (yaTiene) return console.log(`${rol}: ya tiene trustline de USDC`);

  const tx = new TransactionBuilder(cuenta, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset: USDC }))
    .setTimeout(60)
    .build();
  tx.sign(par);
  const r = await horizon.submitTransaction(tx);
  console.log(`${rol}: trustline de USDC → ${enlaceTx(r.hash)}`);
}

for (const rol of ["PAGADOR", "COBRADOR"]) {
  const secreta = process.env[`${rol}_SECRET`];
  const yaExiste = secreta && !secreta.endsWith("...");
  const par = yaExiste ? Keypair.fromSecret(secreta) : await crearCuenta(rol);
  if (yaExiste) console.log(`${rol}: ya existía`);

  await abrirTrustline(rol, par);
  console.log(`  ${par.publicKey()}`);
  console.log(`  saldos:`, await saldos(par.publicKey()));
  console.log(`  ${enlaceCuenta(par.publicKey())}`);
}

console.log("\nListo. Las llaves están en .env (no se sube a GitHub).");
