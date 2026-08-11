"use client";

import { useState } from "react";

const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined") {
    if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        return "https://ai-proctored-exam-platform-iv1t.onrender.com";
      }
    }
  }
  return envUrl || "https://ai-proctored-exam-platform-iv1t.onrender.com";
};
const API_BASE = getApiBase();

function getUserRole(token: string) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized));
    return decoded.role || null;
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [roleFocused, setRoleFocused] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (mode === "signup") {
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            role,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.detail || "Could not create account.");
          setLoading(false);
          return;
        }

        setError("");
        setSuccessMessage("✓ Registration submitted! Your account is pending Admin approval before you can log in.");
        setMode("login");
        setFullName("");
        setPassword("");
        setRole("student");
        setLoading(false);
        return;
      } catch {
        setError("Could not reach the server. Is the backend running?");
        setLoading(false);
        return;
      }
    }

    const body = new URLSearchParams();
    body.set("username", email);
    body.set("password", password);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!res.ok) {
        const resData = await res.json().catch(() => ({}));
        setError(resData.detail || "Incorrect email or password. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const userRole = getUserRole(data.access_token);
      localStorage.setItem("access_token", data.access_token);
      if (userRole) {
        localStorage.setItem("user_role", userRole);
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Could not reach the server. Is the backend running?");
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>AI-Proctored</div>
        <div style={styles.switchRow}>
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{
              ...styles.switchButton,
              ...(mode === "login" ? styles.switchButtonActive : {}),
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            style={{
              ...styles.switchButton,
              ...(mode === "signup" ? styles.switchButtonActive : {}),
            }}
          >
            Sign up
          </button>
        </div>
        <h1 style={styles.title}>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p style={styles.subtitle}>
          {mode === "login"
            ? "Sign in to continue to your exam portal"
            : "Create a student, examiner, or admin account"}
        </p>

        <form onSubmit={handleLogin} style={styles.form}>
          {mode === "signup" && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFullNameFocused(true)}
                onBlur={() => setFullNameFocused(false)}
                placeholder="Your name"
                required
                style={{
                  ...styles.input,
                  ...(fullNameFocused ? styles.inputFocused : {}),
                }}
              />
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="you@example.com"
              required
              style={{
                ...styles.input,
                ...(emailFocused ? styles.inputFocused : {}),
              }}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              placeholder="••••••••"
              required
              style={{
                ...styles.input,
                ...(passwordFocused ? styles.inputFocused : {}),
              }}
            />
          </div>

          {mode === "signup" && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onFocus={() => setRoleFocused(true)}
                onBlur={() => setRoleFocused(false)}
                style={{
                  ...styles.input,
                  ...(roleFocused ? styles.inputFocused : {}),
                }}
              >
                <option value="student">Student</option>
                <option value="examiner">Examiner</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {successMessage && (
            <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700, marginBottom: "1rem", lineHeight: 1.4 }}>
              {successMessage}
            </div>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? (mode === "signup" ? "Creating account..." : "Signing in...") : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "1.5rem",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "2.5rem 2rem",
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
  },
  badge: {
    display: "inline-block",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#4338ca",
    background: "#eef2ff",
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    marginBottom: "1rem",
  },
  switchRow: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  switchButton: {
    flex: 1,
    padding: "0.55rem 0.7rem",
    borderRadius: "999px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    fontWeight: 600,
    cursor: "pointer",
  },
  switchButtonActive: {
    background: "#4338ca",
    borderColor: "#4338ca",
    color: "#ffffff",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 0.4rem 0",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "#64748b",
    margin: "0 0 1.8rem 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.1rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#334155",
  },
  input: {
    padding: "0.7rem 0.85rem",
    fontSize: "0.95rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.15s ease",
    color: "#0f172a",
  },
  inputFocused: {
    borderColor: "#4338ca",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "0.85rem",
    padding: "0.6rem 0.8rem",
    borderRadius: "8px",
  },
  button: {
    marginTop: "0.3rem",
    padding: "0.75rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#ffffff",
    background: "#4338ca",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  buttonDisabled: {
    background: "#a5b4fc",
    cursor: "not-allowed",
  },
};