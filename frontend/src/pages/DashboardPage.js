import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { getMeasurements, getLatestMeasurement, getGateways, deleteAlert } from "../services/api";

function formatTemp(temp) {
  if (temp === null || temp === undefined) return "—";
  return parseFloat(temp).toFixed(1) + "°C";
}

function formatTime(timestamp) {
  const d = new Date(timestamp);
  d.setHours(d.getHours() - 1);
  return d.toLocaleString("cs-CZ");
}

function formatTimeShort(timestamp) {
  const d = new Date(timestamp);
  d.setHours(d.getHours() - 1);
  return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}

function TempStatus({ temp, msg, tempMin, tempMax }) {
  if (msg && msg !== "OK") return <span style={{ color: "#f87171", fontWeight: 700 }}>{msg}</span>;
  if (temp === null) return <span style={{ color: "#94a3b8", fontWeight: 700 }}>SENZOR OFFLINE</span>;
  if (temp < tempMin) return <span style={{ color: "#60a5fa", fontWeight: 700 }}>PŘÍLIŠ CHLADNO</span>;
  if (temp > tempMax) return <span style={{ color: "#f87171", fontWeight: 700 }}>PŘÍLIŠ TEPLO</span>;
  return <span style={{ color: "#4ade80", fontWeight: 700 }}>OPTIMÁLNÍ</span>;
}

function isAlert(item, tempMin, tempMax) {
  if (!item) return false;
  if (item.msg && item.msg !== "OK") return true;
  if (item.temperature !== null && item.temperature < tempMin) return true;
  if (item.temperature !== null && item.temperature > tempMax) return true;
  return false;
}

function LoadingSpinner() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "20px"
    }}>
      <div style={{
        width: "52px", height: "52px", borderRadius: "50%",
        border: "4px solid #334155", borderTop: "4px solid #f59e0b",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: "#94a3b8", fontSize: "16px", margin: 0 }}>Načítám data...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function RangeSlider({ tempMin, tempMax, onChange }) {
  const MIN = 0;
  const MAX = 40;

  return (
    <div style={sliderStyles.wrapper}>
      <div style={sliderStyles.header}>
        <span style={sliderStyles.label}>Teplotní rozsah</span>
        <span style={sliderStyles.values}>{tempMin}°C – {tempMax}°C</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <span style={sliderStyles.tick}>Min: {tempMin}°C</span>
        <input
          type="range" min={MIN} max={tempMax - 1} value={tempMin}
          onChange={(e) => onChange(Number(e.target.value), tempMax)}
          style={{ flex: 1, accentColor: "#60a5fa", cursor: "pointer" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={sliderStyles.tick}>Max: {tempMax}°C</span>
        <input
          type="range" min={tempMin + 1} max={MAX} value={tempMax}
          onChange={(e) => onChange(tempMin, Number(e.target.value))}
          style={{ flex: 1, accentColor: "#f87171", cursor: "pointer" }}
        />
      </div>
    </div>
  );
}

const sliderStyles = {
  wrapper: { padding: "16px 0 8px" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "12px" },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  values: { color: "#f59e0b", fontSize: "14px", fontWeight: 700 },
  tick: { color: "#64748b", fontSize: "12px", minWidth: "70px" },
};

export default function DashboardPage({ onLogout }) {
  const [measurements, setMeasurements] = useState([]);
  const [latest, setLatest] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tempMin, setTempMin] = useState(20);
  const [tempMax, setTempMax] = useState(25);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [m, l, g] = await Promise.all([
        getMeasurements(50),
        getLatestMeasurement(),
        getGateways(),
      ]);

      const allAlerts = m.filter((item) => isAlert(item, tempMin, tempMax));

      setMeasurements(m.reverse().map((d) => ({
        ...d,
        temperature: d.temperature !== null ? parseFloat(parseFloat(d.temperature).toFixed(1)) : null,
        time: formatTimeShort(d.timestamp),
      })));
      setLatest(l);
      setAlerts(allAlerts);
      setGateways(g);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tempMin, tempMax]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDeleteAlert = async (id) => {
    try {
      await deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    onLogout();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={styles.container}>

      {/* Potvrzovací modal */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#1e293b", borderRadius: "12px", padding: "32px",
            border: "1px solid #334155", maxWidth: "360px", width: "90%", textAlign: "center"
          }}>
            <p style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: 600, margin: "0 0 8px" }}>
              Smazat upozornění?
            </p>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 24px" }}>
              Tato akce je nevratná.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ background: "transparent", border: "1px solid #475569", borderRadius: "8px", padding: "10px 24px", color: "#94a3b8", cursor: "pointer", fontSize: "14px" }}
              >Zrušit</button>
              <button
                onClick={() => handleDeleteAlert(confirmDelete)}
                style={{ background: "#ef4444", border: "none", borderRadius: "8px", padding: "10px 24px", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}
              >Smazat</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Hatchery Monitor</h1>
          <p style={styles.headerSub}>Monitorování líhně kuřat</p>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>Odhlásit</button>
      </div>

      <div style={styles.content}>
        <div style={styles.cardRow}>
          <div style={styles.card}>
            <p style={styles.cardLabel}>Aktuální teplota</p>
            <p style={styles.bigTemp}>
              {latest ? formatTemp(latest.temperature) : "—"}
            </p>
            <TempStatus temp={latest?.temperature} msg={latest?.msg} tempMin={tempMin} tempMax={tempMax} />
            <p style={styles.cardSub}>Optimální rozsah: {tempMin}°C – {tempMax}°C</p>
          </div>

          <div style={styles.card}>
            <p style={styles.cardLabel}>Stav gateway</p>
            {gateways.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>Žádná gateway</p>
            ) : (
              gateways.map((gw) => (
                <div key={gw.gatewayId} style={styles.gwRow}>
                  <span style={{ ...styles.dot, background: gw.online ? "#4ade80" : "#f87171" }} />
                  <div>
                    <p style={styles.gwName}>{gw.name}</p>
                    <p style={styles.gwSub}>{gw.online ? "Připojena" : "Odpojena"} · {gw.location}</p>
                  </div>
                </div>
              ))
            )}
            <p style={styles.cardSub}>Poslední záznam: {latest ? formatTime(latest.timestamp) : "—"}</p>
          </div>

          <div style={styles.card}>
            <p style={styles.cardLabel}>Upozornění</p>
            <p style={styles.bigTemp}>{alerts.length}</p>
            <p style={{ color: alerts.length === 0 ? "#4ade80" : "#f59e0b", fontWeight: 600 }}>
              {alerts.length === 0 ? "Vše v pořádku" : "Vyžaduje pozornost"}
            </p>
            <p style={styles.cardSub}>
              {alerts.length > 0 ? `Poslední: ${formatTime(alerts[0].timestamp)}` : "Žádná upozornění"}
            </p>
          </div>
        </div>

        <div style={styles.chartCard}>
          <RangeSlider
            tempMin={tempMin}
            tempMax={tempMax}
            onChange={(min, max) => { setTempMin(min); setTempMax(max); }}
          />
        </div>

        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Historie teplot</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={measurements} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis domain={[0, 40]} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} unit="°C" />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#f1f5f9" }}
                itemStyle={{ color: "#f59e0b" }}
                formatter={(value) => value !== null ? `${parseFloat(value).toFixed(1)}°C` : "—"}
              />
              <ReferenceLine y={tempMin} stroke="#60a5fa" strokeDasharray="5 5" label={{ value: "Min", fill: "#60a5fa", fontSize: 11 }} />
              <ReferenceLine y={tempMax} stroke="#f87171" strokeDasharray="5 5" label={{ value: "Max", fill: "#f87171", fontSize: 11 }} />
              <Line
                type="monotone" dataKey="temperature" stroke="#f59e0b"
                strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "#f59e0b" }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {alerts.length > 0 && (
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>Historie upozornění</h2>
            <div style={styles.alertList}>
              {alerts.slice(0, 10).map((a) => (
                <div key={a._id} style={styles.alertRow}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: a.msg && a.msg !== "OK" ? "#f87171" : "#f59e0b",
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={styles.alertText}>
                      {a.msg && a.msg !== "OK"
                        ? a.msg
                        : a.temperature < tempMin
                        ? "Teplota pod minimem"
                        : "Teplota nad maximem"}
                      {" — Gateway: "}{a.gatewayId}
                    </p>
                    <p style={styles.alertTime}>{formatTime(a.timestamp)}</p>
                  </div>
                  <span style={styles.alertTemp}>{formatTemp(a.temperature)}</span>
                  <button
                    onClick={() => setConfirmDelete(a._id)}
                    style={styles.deleteBtn}
                    title="Smazat upozornění"
                  >✕</button>
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
  alertTemp: { color: "#f59e0b", fontWeight: "700", fontSize: "16px" },
  deleteBtn: {
    background: "transparent", border: "1px solid #475569", borderRadius: "6px",
    color: "#94a3b8", cursor: "pointer", fontSize: "12px", padding: "4px 8px",
    flexShrink: 0,
  },
};