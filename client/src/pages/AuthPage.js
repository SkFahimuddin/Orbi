import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        if (form.username.length < 3) return setError("Username must be at least 3 characters");
        await register(form.username, form.email, form.password);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const S = styles;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>💬</div>
        <h1 style={S.title}>ChatApp</h1>
        <p style={S.subtitle}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} style={S.form}>
          {mode === "register" && (
            <input
              style={S.input}
              placeholder="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required minLength={3} maxLength={20}
            />
          )}
          <input
            style={S.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={S.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required minLength={6}
          />

          {error && <div style={S.error}>{error}</div>}

          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p style={S.toggle}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span
            style={S.link}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", background: "#0b141a",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Outfit', sans-serif",
  },
  card: {
    background: "#1f2c33", borderRadius: 16, padding: "48px 40px",
    width: "100%", maxWidth: 400, textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  logo: { fontSize: 52, marginBottom: 12 },
  title: { color: "#e9edef", fontSize: 28, fontWeight: 700, marginBottom: 6 },
  subtitle: { color: "#8696a0", fontSize: 15, marginBottom: 32 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: {
    background: "#2a3942", border: "1px solid #3b4a54", borderRadius: 10,
    padding: "14px 16px", color: "#e9edef", fontSize: 15,
    fontFamily: "'Outfit', sans-serif", outline: "none",
    transition: "border-color 0.2s",
  },
  error: {
    background: "rgba(229,62,62,0.15)", border: "1px solid rgba(229,62,62,0.3)",
    color: "#fc8181", borderRadius: 8, padding: "10px 14px", fontSize: 14,
  },
  btn: {
    background: "#25D366", color: "#111c21", border: "none", borderRadius: 10,
    padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Outfit', sans-serif", marginTop: 4,
    transition: "opacity 0.2s",
  },
  toggle: { color: "#8696a0", fontSize: 14, marginTop: 24 },
  link: { color: "#25D366", cursor: "pointer", fontWeight: 600 },
};
