// Sesión 1 · commit 3: primer pago en Stellar. Envía USDC del pagador al cobrador.
// Uso: npm run pagar -- 1        (monto en USDC, por defecto 1)
import {
  BASE_FEE,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { PASSPHRASE, USDC, enlaceTx, horizon, requerida, saldos } from "../comun.js";

const monto = process.argv[2] ?? "1";
const pagador = Keypair.fromSecret(requerida("PAGADOR_SECRET"));
const cobrador = requerida("COBRADOR_PUBLIC");

const cuenta = await horizon.loadAccount(pagador.publicKey());
const tx = new TransactionBuilder(cuenta, {
  fee: BASE_FEE,
  networkPassphrase: PASSPHRASE,
})
  .addOperation(
    Operation.payment({ destination: cobrador, asset: USDC, amount: monto }),
  )
  .addMemo(Memo.text("Codigo 402 - mi primer pago"))
  .setTimeout(60)
  .build();
tx.sign(pagador);

const resultado = await horizon.submitTransaction(tx);
console.log(`Pago enviado: ${monto} USDC`);
console.log(`  hash: ${resultado.hash}`);
console.log(`  ${enlaceTx(resultado.hash)}`);
console.log("  pagador:", await saldos(pagador.publicKey()));
console.log("  cobrador:", await saldos(cobrador));
