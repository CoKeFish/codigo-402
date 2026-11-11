# Código 402

Bootcamp de BAF México × Nirium (10–27 nov 2026): API que cobra con x402 y agente que paga, en Stellar **testnet**. Calendario y uso en `README.md`.

- JavaScript ESM plano, Node 22, sin TypeScript ni build: el bootcamp es "JavaScript básico" y el código debe poder mostrarse en clase.
- Una carpeta por sesión; lo compartido (red, USDC, `.env`) vive en `comun.js`. El prototipo del Demo Day va en `prototipo/`.
- Solo testnet. Nunca poner llaves de mainnet en este proyecto.
- El puerto 3001 de este PC lo ocupa otra app; la API usa 4021.
- Paquetes: `@x402/express`, `@x402/core`, `@x402/fetch`, `@x402/stellar`, `@stellar/stellar-sdk`. Consultar la doc actual con ctx7 (`/stellar/stellar-docs`) antes de cambiar el flujo de pago: la API de x402 cambia seguido.
- Cuando en clase den el repositorio de la serie y el formato de entrega, anotarlos en el README y ajustar la estructura a lo que pidan.
