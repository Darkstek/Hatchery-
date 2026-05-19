// mock-gateway.js — spusť: node mock-gateway.js
// Simuluje POUZE JEDEN další teploměr s intervalem 10 minut a teplotou 24-27 °C

const fetch = require("node-fetch");

const API_URL = "https://hatchery-l9qw.onrender.com";
const API_KEY = "hatchery-gw-key-2026";
const GATEWAY_ID = "gateway-01"; 

async function register() {
  try {
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
  } catch (err) {
    console.error("Chyba při registraci gateway:", err.message);
  }
}

function generateBatch() {
  const batch = [];

  // --- SIMULOVANÝ POMOCNÝ TEPLOMĚR ---
  // Math.random() generuje od 0 do 1.
  // Vynásobením 3 získáme rozsah 0 až 3.
  // Přičtením k 24 dostaneme přesný rozsah 24.00 až 27.00 °C.
  const temp = parseFloat((24.0 + Math.random() * 3.0).toFixed(2));
  const offline = Math.random() < 0.01; // Snížená šance na výpadek na 1 %

  batch.push({
    nodeId: "Inkubator - Simulovany",
    temp: offline ? null : temp,
    time: null, 
    msg: offline ? "Senzor offline" : "OK",
  });

  return batch;
}

async function sendBatch() {
  const batch = generateBatch();
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
    const logTime = new Date().toLocaleTimeString("cs-CZ");

    console.log(
      `[${logTime}] SIMULACE — Teplota: ${batch[0].temp ?? "null"}°C | msg: ${batch[0].msg}`
    );
    console.log(`Odesláno do DB (korigovaný UTC čas).\n`);
  } catch (err) {
    console.error("Chyba simulátoru:", err.message);
  }
}

async function main() {
  console.log("Simulátor sekundárního čídla spuštěn — odesílám každých 10 minut...\n");
  await register();
  await sendBatch();
  
  
  setInterval(sendBatch, 10 * 60 * 1000); // Odesílat každých 10 minut
}

main();