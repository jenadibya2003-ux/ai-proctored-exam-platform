"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { Mail, Lock, CheckCircle2, AlertCircle, Calendar } from "lucide-react";

const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("172.") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return `http://${host}:8000`;
    }
  }
  return envUrl || "https://ai-proctored-exam-platform-iv1t.onrender.com";
};
const API_BASE = getApiBase();

export default function AdminProfileView() {
  const [fullName, setFullName] = useState("admin1");
  const [email, setEmail] = useState("admin1@example.com");
  const [role, setRole] = useState("Admin");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("admin_theme");
    setIsDark(savedTheme === "dark");

    const token = localStorage.getItem("access_token") || "";
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setFullName(data.full_name || "admin1");
            setEmail(data.email || "admin1@example.com");
            setRole(data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : "Admin");
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
    .slice(0, 2) || "A1";

  return (
    <AdminShell title="Profile">
      <div style={{ marginBottom: "1.6rem" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: textMain, margin: "0 0 0.3rem 0" }}>
          Admin Profile Settings
        </h2>
        <p style={{ fontSize: "0.85rem", color: textSub, margin: 0 }}>
          Manage your account credentials and security preferences.
        </p>
      </div>

      {successMsg && (
        <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", color: "#15803d", padding: "0.85rem 1.2rem", borderRadius: "12px", marginBottom: "1.6rem", fontSize: "0.88rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "0.85rem 1.2rem", borderRadius: "12px", marginBottom: "1.6rem", fontSize: "0.88rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      <div className="grid-sidebar-wide">
        {/* Left Profile Overview Card */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "18px", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>
            {initials}
          </div>

          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, margin: "0 0 0.2rem 0" }}>
            {fullName}
          </h3>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2563eb", marginBottom: "1.6rem" }}>
            {role}
          </div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left", fontSize: "0.82rem" }}>
            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.8rem 1rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: textSub, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Mail size={13} /> EMAIL
              </div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: textMain, marginTop: "0.2rem" }}>{email}</div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.8rem 1rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: textSub }}>ROLE</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: textMain, marginTop: "0.2rem" }}>{role}</div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.8rem 1rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: textSub, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Calendar size={13} /> MEMBER SINCE
              </div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: textMain, marginTop: "0.2rem" }}>Aug 6, 2026</div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.8rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: textSub }}>EMAIL STATUS</div>
              <span style={{ background: "#dcfce7", color: "#15803d", padding: "0.15rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>Verified</span>
            </div>
          </div>
        </div>

        {/* Right Change Password Card */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "18px", padding: "2rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: textMain, margin: "0 0 1.4rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Lock size={18} style={{ color: "#2563eb" }} /> Change Password
          </h3>

          <form onSubmit={handlePasswordUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: textSub, marginBottom: "0.4rem" }}>
                Current Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.75rem 1rem", color: textMain, fontSize: "0.9rem", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: textSub, marginBottom: "0.4rem" }}>
                New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.75rem 1rem", color: textMain, fontSize: "0.9rem", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: textSub, marginBottom: "0.4rem" }}>
                Confirm New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.75rem 1rem", color: textMain, fontSize: "0.9rem", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                id="show-passwords-adm"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <label htmlFor="show-passwords-adm" style={{ fontSize: "0.82rem", color: textSub, cursor: "pointer" }}>
                Show passwords
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: "0.8rem",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "0.8rem 1.6rem",
                fontSize: "0.88rem",
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
    </AdminShell>
  );
}