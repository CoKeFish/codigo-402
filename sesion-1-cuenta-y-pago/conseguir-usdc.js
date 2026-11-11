// Sesión 1 · commit 3: consigue USDC de prueba para el pagador cambiando XLM en el
// exchange que Stellar trae integrado (un path payment de la cuenta a sí misma).
// Uso: npm run usdc -- 5         (USDC a recibir, por defecto 5)
import {
  Asset,
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { PASSPHRASE, USDC, enlaceTx, horizon, requerida, saldos } from "../comun.js";

const quiero = process.argv[2] ?? "5";
const pagador = Keypair.fromSecret(requerida("PAGADOR_SECRET"));

// ¿Cuánto XLM cuesta recibir esa cantidad de USDC?
const rutas = await horizon
  .strictReceivePaths([Asset.native()], USDC, quiero)
  .call();
if (!rutas.records.length) {
  console.error(
    "No hay ruta XLM→USDC ahora. Usa https://faucet.circle.com (Stellar Testnet).",
  );
  process.exit(1);
}
const mejor = rutas.records[0];
const maxXlm = (Number(mejor.source_amount) * 1.05).toFixed(7); // 5% de margen
console.log(`Cuesta ~${mejor.source_amount} XLM recibir ${quiero} USDC`);

const cuenta = await horizon.loadAccount(pagador.publicKey());
const tx = new TransactionBuilder(cuenta, {
  fee: BASE_FEE,
  networkPassphrase: PASSPHRASE,
})
  .addOperation(
    Operation.pathPaymentStrictReceive({
      sendAsset: Asset.native(),
      sendMax: maxXlm,
      destination: pagador.publicKey(),
      destAsset: USDC,
      destAmount: quiero,
      path: mejor.path.map((p) =>
        p.asset_type === "native"
          ? Asset.native()
          : new Asset(p.asset_code, p.asset_issuer),
      ),
    }),
  )
  .setTimeout(60)
  .build();
tx.sign(pagador);

const resultado = await horizon.submitTransaction(tx);
console.log(`Ya tienes ${quiero} USDC de prueba`);
console.log(`  ${enlaceTx(resultado.hash)}`);
console.log("  pagador:", await saldos(pagador.publicKey()));
