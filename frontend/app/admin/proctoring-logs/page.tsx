"use client";

import { useEffect, useState, useMemo } from "react";
import AdminShell from "../AdminShell";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Clock,
  Download,
  X,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

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

type ProctorLogItem = {
  session_id: string;
  student_name: string;
  student_email: string;
  exam_title: string;
  exam_subject: string;
  trust_score: number;
  violations_count: number;
  status: "FLAGGED" | "WARNING" | "CLEAN";
  started_at: string;
  submitted_at: string;
  events: Array<{
    id: string;
    type: string;
    details: string;
    timestamp: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
  }>;
};

export default function AdminProctoringLogsPage() {
  const [logs, setLogs] = useState<ProctorLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedLog, setSelectedLog] = useState<ProctorLogItem | null>(null);
  const [isDark, setIsDark] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/admin/proctoring-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          setLogs([]);
        }
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("admin_theme");
    setIsDark(savedTheme === "dark");
    fetchLogs();
  }, []);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";
  const innerBg = isDark ? "#080d19" : "#f8fafc";

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchesSearch =
        item.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.exam_title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All Statuses" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [logs, searchQuery, statusFilter]);

  const flaggedCount = logs.filter((l) => l.status === "FLAGGED").length;
  const warningCount = logs.filter((l) => l.status === "WARNING").length;
  const cleanCount = logs.filter((l) => l.status === "CLEAN").length;

  return (
    <AdminShell title="Proctoring Logs">
      {/* Header Banner */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.6rem" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: textMain, margin: "0 0 0.3rem 0" }}>
            AI Proctoring Audit Logs
          </h2>
          <p style={{ fontSize: "0.88rem", color: textSub, margin: 0 }}>
            System-wide candidate security audit trail, violation logs, and integrity trust scores.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          style={{
            background: innerBg,
            color: textMain,
            border: `1px solid ${cardBorder}`,
            borderRadius: "10px",
            padding: "0.6rem 1rem",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <RefreshCw size={15} /> Refresh Audit Trail
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.2rem", marginBottom: "1.6rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: textSub }}>TOTAL AUDITED SESSIONS</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: textMain, marginTop: "0.2rem" }}>{logs.length}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: textSub }}>FLAGGED FOR REVIEW</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#dc2626", marginTop: "0.2rem" }}>{flaggedCount}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: textSub }}>WARNING INCIDENTS</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#d97706", marginTop: "0.2rem" }}>{warningCount}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: textSub }}>CLEAN SESSIONS</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#16a34a", marginTop: "0.2rem" }}>{cleanCount}</div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1rem 1.2rem", display: "flex", gap: "1rem", marginBottom: "1.4rem" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: textSub }} />
          <input
            type="text"
            placeholder="Search candidate name, email, or exam title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem 0.55rem 2.4rem",
              borderRadius: "8px",
              border: `1px solid ${cardBorder}`,
              background: innerBg,
              color: textMain,
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: innerBg,
            border: `1px solid ${cardBorder}`,
            color: textMain,
            borderRadius: "8px",
            padding: "0.55rem 1rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="All Statuses">All Statuses</option>
          <option value="FLAGGED">FLAGGED</option>
          <option value="WARNING">WARNING</option>
          <option value="CLEAN">CLEAN</option>
        </select>
      </div>

      {/* Proctoring Logs Table */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: innerBg, borderBottom: `1px solid ${cardBorder}`, color: textSub, textAlign: "left" }}>
              <th style={{ padding: "0.9rem 1.2rem", fontWeight: 700 }}>CANDIDATE</th>
              <th style={{ padding: "0.9rem 1.2rem", fontWeight: 700 }}>EXAM TITLE</th>
              <th style={{ padding: "0.9rem 1.2rem", fontWeight: 700 }}>TRUST SCORE</th>
              <th style={{ padding: "0.9rem 1.2rem", fontWeight: 700 }}>VIOLATIONS</th>
              <th style={{ padding: "0.9rem 1.2rem", fontWeight: 700 }}>STATUS</th>
              <th style={{ padding: "0.9rem 1.2rem", fontWeight: 700, textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: textSub, fontWeight: 600 }}>
                  {loading ? "Loading live proctoring audit records..." : "No proctoring session logs recorded yet in the system."}
                </td>
              </tr>
            ) : (
              filteredLogs.map((item) => (
              <tr key={item.session_id} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <td style={{ padding: "0.9rem 1.2rem" }}>
                  <div style={{ fontWeight: 700, color: textMain }}>{item.student_name}</div>
                  <div style={{ fontSize: "0.75rem", color: textSub }}>{item.student_email}</div>
                </td>
                <td style={{ padding: "0.9rem 1.2rem" }}>
                  <div style={{ fontWeight: 700, color: textMain }}>{item.exam_title}</div>
                  <div style={{ fontSize: "0.75rem", color: textSub }}>{item.exam_subject}</div>
                </td>
                <td style={{ padding: "0.9rem 1.2rem" }}>
                  <div style={{ fontWeight: 800, color: item.trust_score >= 85 ? "#16a34a" : item.trust_score >= 70 ? "#d97706" : "#dc2626" }}>
                    {item.trust_score}%
                  </div>
                </td>
                <td style={{ padding: "0.9rem 1.2rem", fontWeight: 700, color: item.violations_count > 0 ? "#d97706" : textSub }}>
                  {item.violations_count} Event(s)
                </td>
                <td style={{ padding: "0.9rem 1.2rem" }}>
                  <span
                    style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "12px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      background: item.status === "FLAGGED" ? "#fee2e2" : item.status === "WARNING" ? "#fffbe6" : "#dcfce7",
                      color: item.status === "FLAGGED" ? "#991b1b" : item.status === "WARNING" ? "#b45309" : "#15803d",
                    }}
                  >
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: "0.9rem 1.2rem", textAlign: "right" }}>
                  <button
                    onClick={() => setSelectedLog(item)}
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.4rem 0.8rem",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Eye size={14} /> Audit Log
                  </button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1.2rem" }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.6rem", maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", borderBottom: `1px solid ${cardBorder}`, paddingBottom: "0.85rem" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: textMain, margin: 0 }}>
                  Audit Evidence Log: {selectedLog.student_name}
                </h3>
                <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.15rem" }}>{selectedLog.exam_title}</div>
              </div>
              <button onClick={() => setSelectedLog(null)} style={{ background: innerBg, border: `1px solid ${cardBorder}`, color: textSub, borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "1.4rem" }}>
              {selectedLog.events.length > 0 ? (
                selectedLog.events.map((ev) => (
                  <div key={ev.id} style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: textMain }}>{ev.type}</div>
                      <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.1rem" }}>{ev.details}</div>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: textSub, fontWeight: 600 }}>{ev.timestamp}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#16a34a", fontWeight: 700, fontSize: "0.88rem" }}>
                  ✓ No suspicious proctoring violations recorded for this candidate.
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(selectedLog, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `admin_audit_${selectedLog.student_name.replace(/\s+/g, "_")}.json`;
                  a.click();
                }}
                style={{ background: "transparent", border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "8px", padding: "0.5rem 0.9rem", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Download size={14} /> Download Evidence (.json)
              </button>
              <button onClick={() => setSelectedLog(null)} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}