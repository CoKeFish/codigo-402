// Sesión 4: verifica un pago preguntándole directo a la red (RPC de Stellar) por su hash.
// No confía en lo que diga la API ni el agente.
// Uso: npm run verificar -- <hash de 64 caracteres>
import { rpc } from "@stellar/stellar-sdk";
import { RPC_URL, enlaceTx } from "../comun.js";

const server = new rpc.Server(RPC_URL);

const hash = process.argv[2];
if (!/^[0-9a-f]{64}$/.test(hash || "")) {
  console.log("Uso: npm run verificar -- <hash de 64 caracteres>");
  process.exit(1);
}

// La RPC pública de testnet solo guarda unos 7 días de historia
const tx = await server.getTransaction(hash);
console.log(`🔎 ${hash}`);
console.log(`Estado: ${tx.status}`);
if (tx.status === "SUCCESS") {
  console.log(`Ledger: ${tx.ledger} · ${new Date(tx.createdAt * 1000).toISOString()}`);
  console.log(`Verlo: ${enlaceTx(hash)}`);
} else if (tx.status === "NOT_FOUND") {
  console.log("La RPC no la encuentra: el hash está mal o es más viejo de lo que la RPC guarda.");
}
