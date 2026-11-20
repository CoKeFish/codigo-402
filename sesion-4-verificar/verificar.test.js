// Sesión 4: pruebas del verificador contra la red. Uso: npm test
// Si un día el verificador deja de rechazar algo, una prueba falla y avisa.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verificar } from "./verificar.js";

// El pago más reciente del README (el que hizo el agente para la sesión 4)
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const hashes = readme.match(/[0-9a-f]{64}/g);
const HASH = hashes[hashes.length - 1];
const API = process.env.COBRADOR_PUBLIC; // la cuenta que cobra la API
const OTRA = process.env.PAGADOR_PUBLIC; // cualquier otra cuenta

test("acepta el pago correcto: 0.01 USDC a la cuenta de la API", async () => {
  const r = await verificar(HASH, { destino: API, monto: "0.01" });
  assert.equal(r.ok, true, r.motivos.join("; "));
});

test("rechaza si el monto no es el esperado", async () => {
  const r = await verificar(HASH, { destino: API, monto: "0.05" });
  assert.equal(r.ok, false);
  assert.match(r.motivos.join(), /monto/);
});

test("rechaza si el destinatario no es el esperado", async () => {
  const r = await verificar(HASH, { destino: OTRA, monto: "0.01" });
  assert.equal(r.ok, false);
  assert.match(r.motivos.join(), /destinatario/);
});

test("rechaza un hash que no existe", async () => {
  const r = await verificar("0".repeat(64), { destino: API, monto: "0.01" });
  assert.equal(r.ok, false);
});
