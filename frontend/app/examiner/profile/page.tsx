"use client";

import { useEffect, useState } from "react";
import ExaminerShell from "../ExaminerShell";
import { Mail, Lock, CheckCircle2, AlertCircle, Calendar } from "lucide-react";

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

export default function ExaminerProfilePage() {
  const [fullName, setFullName] = useState("examiner2");
  const [email, setEmail] = useState("examiner2@example.com");
  const [role, setRole] = useState("Examiner");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("examiner_theme") || localStorage.getItem("theme_mode");
    setIsDark(savedTheme === "dark");

    const token = localStorage.getItem("access_token") || "";
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setFullName(data.full_name || "examiner2");
            setEmail(data.email || "examiner2@example.com");
            setRole(data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : "Examiner");
          }
        })
        .catch(() => {});
    }
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg("Password must be at least 4 characters long.");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("access_token") || "";

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: newPassword,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Profile and password updated successfully in database!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.detail || "Failed to update profile.");
      }
    } catch {
      setErrorMsg("Network error updating password.");
    } finally {
      setSaving(false);
    }
  };

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "E2";

  return (
    <ExaminerShell title="Profile">
      <div style={{ marginBottom: "1.3rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
          Examiner Profile Settings
        </h2>
        <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
          Manage your account credentials and security preferences.
        </p>
      </div>

      {successMsg && (
        <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", color: "#15803d", padding: "0.75rem 1.1rem", borderRadius: "10px", marginBottom: "1.3rem", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "0.75rem 1.1rem", borderRadius: "10px", marginBottom: "1.3rem", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.3rem" }}>
        {/* Left Profile Overview Card */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.6rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.85rem" }}>
            {initials}
          </div>

          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: textMain, margin: "0 0 0.15rem 0" }}>
            {fullName}
          </h3>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", marginBottom: "1.3rem" }}>
            {role}
          </div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left", fontSize: "0.78rem" }}>
            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: textSub, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Mail size={12} /> EMAIL
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: textMain, marginTop: "0.15rem" }}>{email}</div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: textSub }}>ROLE</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: textMain, marginTop: "0.15rem" }}>{role}</div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: textSub, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Calendar size={12} /> MEMBER SINCE
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: textMain, marginTop: "0.15rem" }}>Aug 6, 2026</div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: textSub }}>EMAIL STATUS</div>
              <span style={{ background: "#dcfce7", color: "#15803d", padding: "0.1rem 0.5rem", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 700 }}>Verified</span>
            </div>
          </div>
        </div>

        {/* Right Change Password Card */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.6rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: textMain, margin: "0 0 1.2rem 0", display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <Lock size={16} style={{ color: "#2563eb" }} /> Change Password
          </h3>

          <form onSubmit={handlePasswordUpdate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: textSub, marginBottom: "0.35rem" }}>
                Current Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.6rem 0.85rem", color: textMain, fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: textSub, marginBottom: "0.35rem" }}>
                New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.6rem 0.85rem", color: textMain, fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: textSub, marginBottom: "0.35rem" }}>
                Confirm New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.6rem 0.85rem", color: textMain, fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <input
                type="checkbox"
                id="show-passwords-ex"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                style={{ width: "15px", height: "15px", cursor: "pointer" }}
              />
              <label htmlFor="show-passwords-ex" style={{ fontSize: "0.78rem", color: textSub, cursor: "pointer" }}>
                Show passwords
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: "0.6rem",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.65rem 1.3rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                alignSelf: "flex-start",
              }}
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </ExaminerShell>
  );
}