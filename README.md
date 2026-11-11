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
| Jue 12 nov | Cobra por tu API con x402 | `sesion-2-api-x402/` | base lista |
| Mar 17 nov | Un agente que paga solo, con límite de gasto | `sesion-3-agente/` | base lista |
| Jue 19 nov | Verifica un pago en la red | `sesion-4-verificar/` | base lista |
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
npm run agente -- 3   # terminal 2: el agente consulta 3 veces y paga cada una
npm run verificar -- <hash>   # comprueba cualquier pago en la red
```

El agente nunca gasta más de `PRESUPUESTO_USDC` por ejecución: si el siguiente pago
no cabe, se detiene sin firmar.

## Configuración (`.env`)

| Variable | Para qué | Por defecto |
|---|---|---|
| `PAGADOR_SECRET` / `PAGADOR_PUBLIC` | cuenta del agente que paga | las genera `npm run cuentas` |
| `COBRADOR_SECRET` / `COBRADOR_PUBLIC` | cuenta que recibe los cobros de la API | las genera `npm run cuentas` |
| `FACILITATOR_URL` | facilitador x402 que verifica y liquida | `https://www.x402.org/facilitator` (testnet) |
| `API_URL` | dónde escucha la API y a dónde apunta el agente | `http://localhost:4021` |
| `PRECIO` | precio por consulta | `$0.01` |
| `PRESUPUESTO_USDC` | tope de gasto del agente | `0.05` |

Las llaves del `.env` son de testnet y no valen nada, pero el archivo no se sube al repo.

## Referencias

- Raven MCP (documentación de Stellar para asistentes de IA): https://raven.stellar.org
- Quickstart oficial de x402 en Stellar: https://developers.stellar.org/docs/build/agentic-payments/x402/quickstart-guide
- Repo canónico: https://github.com/stellar/x402-stellar
- Facilitador alterno (OpenZeppelin, pide API key): `https://channels.openzeppelin.com/x402/testnet`
- Explorador de testnet: https://stellar.expert/explorer/testnet
