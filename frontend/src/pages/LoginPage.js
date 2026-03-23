import React, { useState } from "react";
import { login } from "../services/api";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      onLogin();
    } catch (err) {
      setError("Nesprávný email nebo heslo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Hatchery Monitor</h1>
        <p style={styles.subtitle}>Systém pro monitorování líhně</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Přihlašuji..." : "Přihlásit se"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#1e293b",
    borderRadius: "16px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    textAlign: "center",
  },
  logo: { fontSize: "64px", marginBottom: "16px" },
  title: { color: "#f1f5f9", fontSize: "24px", fontWeight: "700", margin: "0 0 8px" },
  subtitle: { color: "#94a3b8", fontSize: "14px", margin: "0 0 32px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  input: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#f1f5f9",
    fontSize: "15px",
    outline: "none",
  },
  error: { color: "#f87171", fontSize: "14px", margin: "0" },
  button: {
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
};