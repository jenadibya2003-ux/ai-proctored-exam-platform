"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import {
  Sliders,
  Save,
  CheckCircle2,
  ShieldAlert,
  Bell
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-proctored-exam-platform-iv1t.onrender.com";

export default function AdminSettingsView() {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Settings form state
  const [platformName, setPlatformName] = useState("AI-Proctored Exam Platform");
  const [tabSwitchLimit, setTabSwitchLimit] = useState("3");
  const [faceDetection, setFaceDetection] = useState(true);
  const [proctorSensitivity, setProctorSensitivity] = useState("high");
  const [autoGradingEnabled, setAutoGradingEnabled] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("admin_theme");
    setIsDark(savedTheme === "dark");
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "#080d19" : "#f8fafc";

  return (
    <AdminShell title="System Settings">
      {/* Section Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: textMain, margin: "0 0 0.3rem 0" }}>
          Platform Configuration & Security Settings
        </h2>
        <p style={{ fontSize: "0.88rem", color: textSub, margin: 0 }}>
          Manage AI proctoring thresholds, evaluation rules, and system configurations.
        </p>
      </div>

      {savedSuccess && (
        <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "0.8rem 1.2rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.88rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle2 size={18} /> Platform settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.6rem" }}>
        {/* AI Proctoring Rules */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "18px", padding: "1.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.2rem" }}>
            <ShieldAlert size={20} style={{ color: "#2563eb" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: textMain, margin: 0 }}>
              AI Proctoring Security Rules
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: textMain, marginBottom: "0.35rem" }}>
                Allowed Tab Switch Violations Limit
              </label>
              <select
                value={tabSwitchLimit}
                onChange={(e) => setTabSwitchLimit(e.target.value)}
                style={{ width: "100%", background: inputBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "10px", padding: "0.65rem 0.85rem", fontSize: "0.85rem", outline: "none", fontWeight: 600 }}
              >
                <option value="1">Strict (1 Switch Max)</option>
                <option value="3">Standard (3 Switches Max)</option>
                <option value="5">Lenient (5 Switches Max)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: textMain, marginBottom: "0.35rem" }}>
                AI Vision Suspicion Sensitivity
              </label>
              <select
                value={proctorSensitivity}
                onChange={(e) => setProctorSensitivity(e.target.value)}
                style={{ width: "100%", background: inputBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "10px", padding: "0.65rem 0.85rem", fontSize: "0.85rem", outline: "none", fontWeight: 600 }}
              >
                <option value="low">Low (Fewer Flags)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Maximum Security)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: inputBg, border: `1px solid ${cardBorder}`, padding: "0.85rem 1rem", borderRadius: "12px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: textMain }}>Enforce Face Detection</div>
                <div style={{ fontSize: "0.78rem", color: textSub }}>Require continuous webcam presence during exam</div>
              </div>
              <input
                type="checkbox"
                checked={faceDetection}
                onChange={(e) => setFaceDetection(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>

        {/* System & Evaluation Settings */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "18px", padding: "1.6rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.2rem" }}>
              <Sliders size={20} style={{ color: "#9333ea" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: textMain, margin: 0 }}>
                System & Automated Evaluation
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: textMain, marginBottom: "0.35rem" }}>
                  Platform Display Title
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  style={{ width: "100%", background: inputBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "10px", padding: "0.65rem 0.85rem", fontSize: "0.85rem", outline: "none", fontWeight: 600, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: inputBg, border: `1px solid ${cardBorder}`, padding: "0.85rem 1rem", borderRadius: "12px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: textMain }}>Automated AI Evaluation</div>
                  <div style={{ fontSize: "0.78rem", color: textSub }}>Instant MCQ and descriptive response scoring</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoGradingEnabled}
                  onChange={(e) => setAutoGradingEnabled(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: "1.8rem",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "0.75rem 1.4rem",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
            }}
          >
            <Save size={18} /> Save Settings
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
