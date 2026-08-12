"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import {
  Users,
  Clock,
  Shield,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileCheck,
  Eye,
  ArrowRight
} from "lucide-react";

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

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "Student" | "Examiner" | "Admin";
  status: "Approved" | "Pending" | "Rejected" | "Restricted";
  studentId: string;
  registeredDate: string;
};

type OverviewData = {
  active_sessions: number;
  exams_today: number;
  exams_completed_today: number;
  flagged_sessions: number;
  grading_queue: number;
  avg_score_percent: number;
};

export default function AdminDashboardView() {
  const [adminName, setAdminName] = useState("admin1");
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("admin_theme");
      setIsDark(savedTheme === "dark");
    };
    syncTheme();
    window.addEventListener("themeChange", syncTheme);
    window.addEventListener("storage", syncTheme);

    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.full_name) {
          setAdminName(data.full_name);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/exams/admin/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setOverview(data);
      })
      .catch(() => {});

    fetch(`${API_BASE}/students/admin/all-users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: UserItem[] = data.map((u, idx) => {
            const roleCap = (u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Student") as UserItem["role"];
            const statusCap = (u.account_status ? u.account_status.charAt(0).toUpperCase() + u.account_status.slice(1) : "Approved") as UserItem["status"];
            const prefix = roleCap === "Student" ? "STU" : roleCap === "Examiner" ? "EXM" : "ADM";
            const idNum = String(idx + 1).padStart(4, "0");
            return {
              id: u.id,
              name: u.full_name || u.email.split("@")[0],
              email: u.email,
              role: roleCap,
              status: statusCap,
              studentId: `${prefix}-${idNum}`,
              registeredDate: u.created_at || "01/08/2026",
            };
          });
          setUsersList(mapped);
        } else {
          setUsersList([]);
        }
      })
      .catch(() => setUsersList([]))
      .finally(() => setLoading(false));

    return () => {
      window.removeEventListener("themeChange", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const totalUsers = usersList.length;
  const pendingUsers = usersList.filter((u) => u.status === "Pending");
  const examiners = usersList.filter((u) => u.role === "Examiner");
  const students = usersList.filter((u) => u.role === "Student");
  const approvedCount = usersList.filter((u) => u.status === "Approved").length;
  const restrictedCount = usersList.filter((u) => u.status === "Restricted").length;

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  return (
    <AdminShell title="Admin Dashboard">
      {/* Welcome Banner */}
      <div
        className="welcome-banner"
        style={{
          background: isDark ? "linear-gradient(135deg, #0d1424 0%, #1e1b4b 100%)" : "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)",
          border: `1px solid ${cardBorder}`,
          borderRadius: "18px",
          padding: "1.6rem 2rem",
          marginBottom: "1.8rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: textMain, margin: "0 0 0.3rem 0", lineHeight: 1.3 }}>
            Welcome back, {adminName} 👋
          </h2>
          <p style={{ fontSize: "0.88rem", color: textSub, margin: 0 }}>
            Manage account approvals, system users, platform analytics, and examination security.
          </p>
        </div>

        <Link
          href="/admin/users"
          className="welcome-banner-btn"
          style={{
            background: "#2563eb",
            color: "#ffffff",
            borderRadius: "10px",
            padding: "0.7rem 1.3rem",
            fontWeight: 700,
            fontSize: "0.88rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <Users size={18} /> Manage User Approvals
        </Link>
      </div>

      {/* 4 Summary Stat Cards -- 2 uniform side-by-side columns */}
      <div className="stats-grid-4" style={{ marginBottom: "0.85rem", gap: "0.45rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.65rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>Total Users</span>
            <Users size={16} style={{ color: "#3b82f6" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>
            {loading ? "..." : totalUsers}
          </div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.65rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>Pending Approval</span>
            <Clock size={16} style={{ color: "#d97706" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>
            {loading ? "..." : pendingUsers.length}
          </div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.65rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>Examiners</span>
            <Shield size={16} style={{ color: "#9333ea" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>
            {loading ? "..." : examiners.length}
          </div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.65rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>Students</span>
            <GraduationCap size={16} style={{ color: "#16a34a" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>
            {loading ? "..." : students.length}
          </div>
        </div>
      </div>

      {/* Quick Management Actions -- 2 uniform side-by-side columns */}
      <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: textMain, marginBottom: "0.55rem" }}>
        Quick Management Actions
      </h3>

      <div className="stats-grid-4" style={{ marginBottom: "0.85rem", gap: "0.45rem" }}>
        <Link
          href="/admin/users"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: "12px",
            padding: "0.65rem 0.75rem",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "0.35rem",
          }}
        >
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", color: textMain, lineHeight: 1.25 }}>User Management</div>
            <div style={{ fontSize: "0.68rem", color: textSub, marginTop: "0.1rem", lineHeight: 1.2 }}>Approve accounts</div>
          </div>
        </Link>

        <Link
          href="/admin/proctoring-logs"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: "12px",
            padding: "0.65rem 0.75rem",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "0.35rem",
          }}
        >
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", color: textMain, lineHeight: 1.25 }}>Proctoring Logs</div>
            <div style={{ fontSize: "0.68rem", color: textSub, marginTop: "0.1rem", lineHeight: 1.2 }}>Violation events</div>
          </div>
        </Link>

        <Link
          href="/admin/reports"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: "12px",
            padding: "0.65rem 0.75rem",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "0.35rem",
          }}
        >
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileCheck size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", color: textMain, lineHeight: 1.25 }}>System Analytics</div>
            <div style={{ fontSize: "0.68rem", color: textSub, marginTop: "0.1rem", lineHeight: 1.2 }}>Reports &amp; insights</div>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: "12px",
            padding: "0.65rem 0.75rem",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "0.35rem",
          }}
        >
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#ffe4e6", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Eye size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", color: textMain, lineHeight: 1.25 }}>Platform Settings</div>
            <div style={{ fontSize: "0.68rem", color: textSub, marginTop: "0.1rem", lineHeight: 1.2 }}>System settings</div>
          </div>
        </Link>
      </div>

      {/* Platform Overview — Issue 8 fix: display /exams/admin/overview data */}
      {overview && (
        <>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: textMain, margin: "0 0 1rem 0" }}>
            Live Platform Overview
          </h3>
          <div className="stats-grid" style={{ marginBottom: "1.8rem" }}>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: textSub, marginBottom: "0.3rem" }}>Active Sessions</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#2563eb" }}>{overview.active_sessions}</div>
              <div style={{ fontSize: "0.72rem", color: textSub, marginTop: "0.2rem" }}>Students currently in exam</div>
            </div>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: textSub, marginBottom: "0.3rem" }}>Flagged Sessions</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#dc2626" }}>{overview.flagged_sessions}</div>
              <div style={{ fontSize: "0.72rem", color: textSub, marginTop: "0.2rem" }}>Proctoring violations detected</div>
            </div>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: textSub, marginBottom: "0.3rem" }}>Avg. Score Today</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#16a34a" }}>{overview.avg_score_percent}%</div>
              <div style={{ fontSize: "0.72rem", color: textSub, marginTop: "0.2rem" }}>Across all completed exams</div>
            </div>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: textSub, marginBottom: "0.3rem" }}>Exams Today</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: textMain }}>{overview.exams_today}</div>
              <div style={{ fontSize: "0.72rem", color: textSub, marginTop: "0.2rem" }}>Scheduled for today</div>
            </div>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: textSub, marginBottom: "0.3rem" }}>Completed Today</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: textMain }}>{overview.exams_completed_today}</div>
              <div style={{ fontSize: "0.72rem", color: textSub, marginTop: "0.2rem" }}>Exams finished today</div>
            </div>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: textSub, marginBottom: "0.3rem" }}>Grading Queue</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#d97706" }}>{overview.grading_queue}</div>
              <div style={{ fontSize: "0.72rem", color: textSub, marginTop: "0.2rem" }}>Submissions awaiting grading</div>
            </div>
          </div>
        </>
      )}

      {/* Two Column Grid */}
      <div className="wide-sidebar-grid">
        {/* Left Panel: Pending Registrations */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.4rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: textMain, margin: 0 }}>Pending Registrations</h3>
            <Link
              href="/admin/users"
              style={{
                background: "#2563eb",
                color: "#ffffff",
                padding: "0.45rem 0.95rem",
                borderRadius: "8px",
                fontSize: "0.82rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              Manage Approvals <ArrowRight size={14} />
            </Link>
          </div>
          <p style={{ fontSize: "0.82rem", color: textSub, margin: "0 0 1.2rem 0" }}>Recently registered accounts awaiting verification.</p>

          <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pendingUsers.length > 0 ? (
              pendingUsers.slice(0, 3).map((user) => (
                <div key={user.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.9rem 1.1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: textMain }}>{user.name}</div>
                    <div style={{ fontSize: "0.8rem", color: textSub, marginTop: "0.15rem" }}>{user.email}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.7rem",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: user.role === "Student" ? "#1d4ed8" : "#6b21a8",
                        color: "#ffffff",
                      }}
                    >
                      {user.role}
                    </span>
                    <Link
                      href="/admin/users"
                      style={{
                        background: isDark ? "#1e293b" : "#e2e8f0",
                        color: textMain,
                        border: `1px solid ${cardBorder}`,
                        borderRadius: "6px",
                        padding: "0.35rem 0.85rem",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", color: textSub, padding: "1rem", fontSize: "0.85rem" }}>
                No pending registrations at the moment.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Account Status */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.4rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: textMain, margin: "0 0 1.2rem 0" }}>Account Status</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.85rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: textMain }}>Approved</span>
                </div>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: textMain }}>{approvedCount}</span>
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.85rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <AlertCircle size={18} style={{ color: "#eab308" }} />
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: textMain }}>Pending</span>
                </div>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: textMain }}>{pendingUsers.length}</span>
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.85rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <XCircle size={18} style={{ color: "#ef4444" }} />
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: textMain }}>Restricted</span>
                </div>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: textMain }}>{restrictedCount}</span>
              </div>
            </div>
          </div>

          <Link
            href="/admin/users"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: "1.5rem",
              padding: "0.65rem",
              borderRadius: "10px",
              border: `1px solid ${cardBorder}`,
              background: "transparent",
              color: textMain,
              fontWeight: 700,
              fontSize: "0.88rem",
              textDecoration: "none",
            }}
          >
            View All Users
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}