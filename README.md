# Código 402: Agentes que pagan

Mi trabajo del bootcamp **Código 402** (BAF México × Nirium × Programa de Embajadores de Stellar):
una API que cobra sola y un agente de IA que la paga, con el estándar
[x402](https://developers.stellar.org/docs/build/agentic-payments/x402) sobre Stellar.
Todo corre en **testnet**, sin dinero real.

- Evento: https://luma.com/ljzvwv35
- Instructores: Gio Amador y Monse Mendoza (Nirium)

## Calendario

En línea por Google Meet. 18:00–19:15 CDMX = **19:00–20:15 Bogotá**.

| Fecha | Sesión | Carpeta | Estado |
|---|---|---|---|
| Mar 10 nov | Tu primera cuenta y tu primer pago en Stellar | `sesion-1-cuenta-y-pago/` | entregada |
| Jue 12 nov | Cobra por tu API con x402 | `sesion-2-api-x402/` | entregada |
| Mar 17 nov | Un agente que paga solo, con límite de gasto | `sesion-3-agente/` | entregada |
| Jue 19 nov | Verifica un pago en la red | `sesion-4-verificar/` | entregada |
| Mar 24 nov | Taller de prototipos y ensayo del Demo Day | `prototipo/` | pendiente |
| Vie 27 nov | **Demo Day** (19:00–21:00 Bogotá) | `prototipo/` | pendiente |

## Entrega

Cada sesión pide construir una pieza en un repositorio público propio llamado
`codigo-402` y registrar sus commits en Apex (BAF explica cómo al cierre de cada sesión).
La guía de clase trabaja en GitHub Codespaces con los scripts en la raíz; aquí va el
mismo ejercicio, con una carpeta por sesión.

| Sesión | Entregable | Commits |
|---|---|---|
| 1 | `.gitignore` con `.env`, `.env.example`, script de cuentas, script del primer pago y el hash del pago en este README | 3: estructura · cuentas con trustline · primer pago |
| 2 | API (`server.js`) con una ruta que cobra con x402, cliente (`cliente.js`) y el hash de un pago real en este README | 3: ruta gratis · ruta protegida (402) · pago con el cliente |
| 3 | Agente (`agente.js`) con wallet propia (`crear-agente.js`) que paga la API hasta su tope y rechaza lo que lo excede sin transacción, y el hash de un pago del agente en este README | 3: agente que paga · tope por pago · errores y reintentos |
| 4 | Verificador (`verificar.js`) que consulta el hash en la RPC y acepta el pago correcto o lo rechaza por contrato, monto o destinatario; pruebas (`verificar.test.js`) y el hash verificado en este README | 3: consulta con RPC · validación de USDC, monto y destinatario · pruebas de rechazo |

## Uso

Requiere Node.js 22+.

```bash
npm install
npm run cuentas       # crea pagador y cobrador en testnet, los fondea, abre su trustline de USDC y escribe .env
npm run usdc -- 5     # cambia XLM por 5 USDC de prueba para el pagador
npm run pagar -- 1    # envía 1 USDC del pagador al cobrador
```

x402 cobra en USDC, por eso el pagador necesita saldo. Si `npm run usdc` no encuentra
ruta de cambio, pide USDC en https://faucet.circle.com (red *Stellar Testnet*,
dirección `PAGADOR_PUBLIC` del `.env`). Luego:

```bash
npm run api           # terminal 1: API que responde 402 hasta que le pagan
npm run cliente       # terminal 2: pide el dato, recibe el 402, paga 0.01 USDC y lo vuelve a pedir
npm run agente-wallet # una vez: wallet propia del agente con 0.05 USDC de presupuesto
npm run agente        # terminal 2: el agente pregunta el precio, revisa su saldo y paga solo
npm run verificar -- <hash>   # le pregunta a la RPC de Stellar si ese pago es 0.01 USDC a la API
```

El verificador no le cree a la API ni al agente: lee en la red el evento `transfer` de la
transacción y revisa que el contrato sea el de USDC, que el destinatario sea
`COBRADOR_PUBLIC` y que el monto sea el precio. Para ver un rechazo:
`MONTO=0.05 npm run verificar -- <hash>` o `DESTINO=G... npm run verificar -- <hash>`.
La RPC pública de testnet solo guarda unos 7 días: un hash más viejo sale `NOT_FOUND`.
`npm test` corre 4 pruebas contra la red con el último hash de este README: acepta el pago
correcto y rechaza el monto equivocado, el destinatario equivocado y un hash que no existe.

El agente tiene tres límites: su propia wallet con poco dinero, un tope por pago
(`TOPE`, por defecto `$0.02`) que x402 revisa antes de firmar, y la regla de no pagar a
ciegas: si la API no responde reintenta la petición hasta 3 veces, nunca el pago.
Para ver el rechazo: `TOPE='$0.005' npm run agente`.

## Configuración (`.env`)

| Variable | Para qué | Por defecto |
|---|---|---|
| `PAGADOR_SECRET` / `PAGADOR_PUBLIC` | tu cuenta: paga en las sesiones 1 y 2 y fondea al agente | las genera `npm run cuentas` |
| `COBRADOR_SECRET` / `COBRADOR_PUBLIC` | cuenta que recibe los cobros de la API | las genera `npm run cuentas` |
| `AGENTE_SECRET` / `AGENTE_PUBLIC` | wallet propia del agente, con su presupuesto | las genera `npm run agente-wallet` |
| `FACILITATOR_URL` | facilitador x402 que verifica y liquida | `https://www.x402.org/facilitator` (testnet) |
| `API_URL` | dónde escucha la API y a dónde apunta el agente | `http://localhost:4021` |
| `PRECIO` | precio por consulta | `$0.01` |
| `TOPE` | lo máximo que el agente paga por una llamada | `$0.02` |

Las llaves del `.env` son de testnet y no valen nada, pero el archivo no se sube al repo.

## Referencias

- Raven MCP (documentación de Stellar para asistentes de IA): https://raven.stellar.org
- Quickstart oficial de x402 en Stellar: https://developers.stellar.org/docs/build/agentic-payments/x402/quickstart-guide
- Repo canónico: https://github.com/stellar/x402-stellar
- Facilitador alterno (OpenZeppelin, pide API key): `https://channels.openzeppelin.com/x402/testnet`
- Explorador de testnet: https://stellar.expert/explorer/testnet

## Mi primer pago en Stellar

1 USDC del pagador al cobrador, en testnet (sesión 1).

- Hash: `b91ba80c7a852439a2da6dafed7b5cfdc71f81ae67ea9e0388b8402dc6f73fe0`
- Verlo: https://stellar.expert/explorer/testnet/tx/b91ba80c7a852439a2da6dafed7b5cfdc71f81ae67ea9e0388b8402dc6f73fe0

## Mi API cobra con x402

0.01 USDC del pagador a la API (cuenta del cobrador), en testnet (sesión 2).

- Hash: `946d33cb261f86377d2d87a3c0dee7e2ef397c0c4d3f01ccb6b21af5b947004a`
- Verlo: https://stellar.expert/explorer/testnet/tx/946d33cb261f86377d2d87a3c0dee7e2ef397c0c4d3f01ccb6b21af5b947004a

## Mi agente paga solo

0.01 USDC de la wallet del agente a la API, en testnet (sesión 3).

- Tope por pago: `$0.02`. Lo que lo excede se rechaza sin transacción.
- Pago del agente a mi API: `989a5727aa5b510b1e5dd0f4d8cd0dd9a708aee88b14a352dd649daefeaa0397`
- Verlo: https://stellar.expert/explorer/testnet/tx/989a5727aa5b510b1e5dd0f4d8cd0dd9a708aee88b14a352dd649daefeaa0397

## Mi verificador

Verifica un pago preguntándole a la red (RPC de Stellar), no a la API ni al agente (sesión 4).

- Pago que verifiqué con RPC: `b9629799963e0b629175515f0d15568de1e643ad3b8871f369316af9af7e06c2`
- Verlo: https://stellar.expert/explorer/testnet/tx/b9629799963e0b629175515f0d15568de1e643ad3b8871f369316af9af7e06c2
