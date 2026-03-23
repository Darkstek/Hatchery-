import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { getMeasurements, getLatestMeasurement, getAlerts, getGateways } from "../services/api";

const TEMP_MIN = 36.5;
const TEMP_MAX = 38.5;

function TempStatus({ temp, msg }) {
  if (msg && msg !== "OK") return <span style={{ color: "#f87171", fontWeight: 700 }}>{msg}</span>;
  if (temp === null) return <span style={{ color: "#94a3b8", fontWeight: 700 }}>SENZOR OFFLINE</span>;
  if (temp < TEMP_MIN) return <span style={{ color: "#60a5fa", fontWeight: 700 }}>PŘÍLIŠ CHLADNO</span>;
  if (temp > TEMP_MAX) return <span style={{ color: "#f87171", fontWeight: 700 }}>PŘÍLIŠ TEPLO</span>;
  return <span style={{ color: "#4ade80", fontWeight: 700 }}>OPTIMÁLNÍ</span>;
}

export default function DashboardPage({ onLogout }) {
  const [measurements, setMeasurements] = useState([]);
  const [latest, setLatest] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [m, l, a, g] = await Promise.all([
        getMeasurements(50),
        getLatestMeasurement(),
        getAlerts(),
        getGateways(),
      ]);
      setMeasurements(m.reverse().map((d) => ({
        ...d,
        time: new Date(d.timestamp).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }),
      })));
      setLatest(l);
      setAlerts(a);
      setGateways(g);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh každých 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    onLogout();
  };

  if (loading) return (
    <div style={{ ...styles.container, justifyContent: "center", alignItems: "center" }}>
      <p style={{ color: "#94a3b8", fontSize: "18px" }}>Načítám data...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div>
            <h1 style={styles.headerTitle}>Hatchery Monitor</h1>
            <p style={styles.headerSub}>Monitorování líhně kuřat</p>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>Odhlásit</button>
      </div>

      <div style={styles.content}>
        {/* Status karty */}
        <div style={styles.cardRow}>
          {/* Aktuální teplota */}
          <div style={styles.card}>
            <p style={styles.cardLabel}>Aktuální teplota</p>
            <p style={styles.bigTemp}>
              {latest ? (latest.temperature !== null ? `${latest.temperature}°C` : "—") : "—"}
            </p>
            <TempStatus temp={latest?.temperature} msg={latest?.msg} />
            <p style={styles.cardSub}>
              Optimální rozsah: {TEMP_MIN}°C – {TEMP_MAX}°C
            </p>
          </div>

          {/* Gateway status */}
          <div style={styles.card}>
            <p style={styles.cardLabel}>Gateway status</p>
            {gateways.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>Žádná gateway</p>
            ) : (
              gateways.map((gw) => (
                <div key={gw.gatewayId} style={styles.gwRow}>
                  <span style={{ ...styles.dot, background: gw.online ? "#4ade80" : "#f87171" }} />
                  <div>
                    <p style={styles.gwName}>{gw.name}</p>
                    <p style={styles.gwSub}>{gw.online ? "Online" : "Offline"} · {gw.location}</p>
                  </div>
                </div>
              ))
            )}
            <p style={styles.cardSub}>
              Poslední data: {latest ? new Date(latest.timestamp).toLocaleString("cs-CZ") : "—"}
            </p>
          </div>

          {/* Alerty */}
          <div style={styles.card}>
            <p style={styles.cardLabel}>Alerty (tlačítko)</p>
            <p style={styles.bigTemp}>{alerts.length}</p>
            <p style={{ color: "#f59e0b", fontWeight: 600 }}>
              {alerts.length === 0 ? "Žádné problémy" : "Vyžaduje pozornost"}
            </p>
            <p style={styles.cardSub}>
              {alerts.length > 0
                ? `Poslední: ${new Date(alerts[0].timestamp).toLocaleString("cs-CZ")}`
                : "Vše v pořádku"}
            </p>
          </div>
        </div>

        {/* Graf teplot */}
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Historie teplot</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={measurements} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis domain={[35, 40]} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} unit="°C" />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#f1f5f9" }}
                itemStyle={{ color: "#f59e0b" }}
              />
              <ReferenceLine y={TEMP_MIN} stroke="#60a5fa" strokeDasharray="5 5" label={{ value: "Min", fill: "#60a5fa", fontSize: 11 }} />
              <ReferenceLine y={TEMP_MAX} stroke="#f87171" strokeDasharray="5 5" label={{ value: "Max", fill: "#f87171", fontSize: 11 }} />
              <Line
                type="monotone" dataKey="temperature" stroke="#f59e0b"
                strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "#f59e0b" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Historie alertů */}
        {alerts.length > 0 && (
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>Historie problémů</h2>
            <div style={styles.alertList}>
              {alerts.slice(0, 10).map((a) => (
                <div key={a._id} style={styles.alertRow}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f87171", flexShrink: 0 }} />
                  <div>
                    <p style={styles.alertText}>Problém senzoru: {a.msg} — Gateway: {a.gatewayId}</p>
                    <p style={styles.alertTime}>{new Date(a.timestamp).toLocaleString("cs-CZ")}</p>
                  </div>
                  <span style={styles.alertTemp}>{a.temperature !== null ? `${a.temperature}°C` : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0f172a", color: "#f1f5f9" },
  header: {
    background: "#1e293b", borderBottom: "1px solid #334155",
    padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  headerTitle: { color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0 },
  headerSub: { color: "#94a3b8", fontSize: "13px", margin: 0 },
  logoutBtn: {
    background: "transparent", border: "1px solid #475569", borderRadius: "8px",
    padding: "8px 16px", color: "#94a3b8", cursor: "pointer", fontSize: "14px",
  },
  content: { padding: "32px", maxWidth: "1200px", margin: "0 auto" },
  cardRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" },
  card: { background: "#1e293b", borderRadius: "12px", padding: "24px", border: "1px solid #334155" },
  cardLabel: { color: "#94a3b8", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" },
  bigTemp: { color: "#f1f5f9", fontSize: "48px", fontWeight: "700", margin: "0 0 8px", lineHeight: 1 },
  cardSub: { color: "#64748b", fontSize: "12px", margin: "8px 0 0" },
  gwRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" },
  dot: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  gwName: { color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: 0 },
  gwSub: { color: "#64748b", fontSize: "12px", margin: 0 },
  chartCard: { background: "#1e293b", borderRadius: "12px", padding: "24px", border: "1px solid #334155", marginBottom: "24px" },
  chartTitle: { color: "#f1f5f9", fontSize: "18px", fontWeight: "600", margin: "0 0 24px" },
  alertList: { display: "flex", flexDirection: "column", gap: "12px" },
  alertRow: { display: "flex", alignItems: "center", gap: "16px", background: "#0f172a", borderRadius: "8px", padding: "12px 16px", border: "1px solid #334155" },
  alertText: { color: "#f1f5f9", fontSize: "14px", fontWeight: "600", margin: 0 },
  alertTime: { color: "#64748b", fontSize: "12px", margin: "4px 0 0" },
  alertTemp: { marginLeft: "auto", color: "#f59e0b", fontWeight: "700", fontSize: "16px" },
};