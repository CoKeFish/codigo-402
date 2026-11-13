// Sesión 2: una API que cobra sola. GET /dato responde 402 hasta que el cliente
// paga PRECIO en USDC; el facilitador verifica y liquida el pago en Stellar.
// Base: quickstart oficial de x402 en Stellar.
import express from "express";
import { paymentMiddlewareFromConfig } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import {
  API_URL,
  FACILITATOR_URL,
  PRECIO,
  RED,
  RUTA_DE_PAGO,
  requerida,
} from "../comun.js";

const PAY_TO = requerida("COBRADOR_PUBLIC"); // la cuenta que recibe el pago
const PUERTO = Number(new URL(API_URL).port || 4021);

const app = express();

// Información pública: qué ruta cobra, cuánto, en qué red y a qué cuenta.
app.get("/", (_, res) =>
  res.json({ ruta: RUTA_DE_PAGO, precio: PRECIO, red: RED, cobra: PAY_TO }),
);

// x402: sin pago, la ruta responde 402 con las instrucciones para pagar.
app.use(
  paymentMiddlewareFromConfig(
    {
      [`GET ${RUTA_DE_PAGO}`]: {
        accepts: {
          scheme: "exact",
          price: PRECIO,
          network: RED,
          payTo: PAY_TO,
        },
      },
    },
    new HTTPFacilitatorClient({ url: FACILITATOR_URL }),
    [{ network: RED, server: new ExactStellarScheme() }],
  ),
);

// Esto solo se entrega cuando el pago ya se verificó y se liquidó.
app.get(RUTA_DE_PAGO, (_, res) =>
  res.json({ dato: "El código HTTP 402 significa Payment Required", pagado: true }),
);

app.listen(PUERTO, () =>
  console.log(`API x402 en http://localhost:${PUERTO}${RUTA_DE_PAGO} (${PRECIO} → ${PAY_TO})`),
);
