// mock-gateway.js — spusť: node mock-gateway.js
// Simuluje Pavlovu gateway — posílá batch dat každých 15 minut
// Pro testování posílá každých 10 sekund

const fetch = require("node-fetch");

const API_URL = "https://hatchery-l9qw.onrender.com";
const API_KEY = "hatchery-gw-key-2026";
const GATEWAY_ID = "gateway-01";

async function register() {
  const res = await fetch(`${API_URL}/api/gateway/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      gatewayId: GATEWAY_ID,
      name: "Líheň kurník #1",
      location: "Kurník A",
    }),
  });
  const data = await res.json();
  console.log("Gateway registrována:", data.message || "OK");
}

let nodeIdCounter = 1;

function generateBatch(count = 3) {
  const batch = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const baseTemp = 37.5;
    const variation = (Math.random() - 0.5) * 2;
    const temp = parseFloat((baseTemp + variation).toFixed(2));

    const offline = Math.random() < 0.05;

    // OPRAVA: Posíláme čistý ISO řetězec, který končí na 'Z' (UTC)
    // To zajistí, že frontend i backend budou mít stejný časový základ.
    const time = new Date(now.getTime() - (count - i) * 10000);
    const timeStr = time.toISOString(); 

    batch.push({
      id: nodeIdCounter++,
      temp: offline ? null : temp,
      time: timeStr,
      msg: offline ? "Senzor offline" : "OK",
    });
  }

  return batch;
}

async function sendBatch() {
  const batch = generateBatch(3);

  try {
    const res = await fetch(`${API_URL}/api/data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "x-gateway-id": GATEWAY_ID,
      },
      body: JSON.stringify(batch),
    });

    const data = await res.json();

    batch.forEach((item) => {
      const tempStatus = item.temp === null
        ? "📴 SENZOR OFFLINE"
        : item.temp < 36.5
        ? "❄️  PŘÍLIŠ CHLADNO"
        : item.temp > 38.5
        ? "🔥 PŘÍLIŠ TEPLO"
        : "✅ OK";

      console.log(
        `[${item.time}] ID: ${item.id} | Teplota: ${item.temp ?? "null"}°C ${tempStatus} | msg: ${item.msg}`
      );
    });

    console.log(`Odesláno ${data.count} záznamu\n`);
  } catch (err) {
    console.error("Chyba při odesílání:", err.message);
  }
}

async function main() {
  console.log("Mock gateway spuštěna (Pavluv format) — batch každých 10s...\n");
  await register();
  await sendBatch();
  setInterval(sendBatch, 10000);
}

main();