// Sesión 2 · commit 1: una API en Express con una sola ruta, todavía gratis.
import express from "express";
import { API_URL, RUTA_DE_PAGO } from "../comun.js";

const PUERTO = Number(new URL(API_URL).port || 4021);

const app = express();

// Ruta gratis: cualquiera la puede pedir.
app.get(RUTA_DE_PAGO, (_, res) =>
  res.json({ dato: "El código HTTP 402 significa Payment Required", gratis: true }),
);

app.listen(PUERTO, () =>
  console.log(`API lista en http://localhost:${PUERTO}${RUTA_DE_PAGO}`),
);
