"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ExaminerShell from "../ExaminerShell";
import { AlertTriangle, CheckCircle2, XCircle, Search } from "lucide-react";

type FlaggedSession = {
  session_id: string;
  exam_title: string;
  student_name: string;
  student_email: string;
  is_in_progress: boolean;
  suspicion_score: number;
  review_status: string;
  review_note: string | null;
  tab_switches: number;
  face_absent: number;
  multiple_faces: number;
};

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

export default function ProctoringReviewListPage() {
  const [sessions, setSessions] = useState<FlaggedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("examiner_theme") || localStorage.getItem("theme_mode");
    setIsDark(savedTheme === "dark");

    async function load() {
      const token = localStorage.getItem("access_token") || "";
      if (!token) {
        setError("Please sign in first.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/proctoring/flagged-sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSessions(data);
      } catch {
        setError("Could not load flagged sessions.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const filtered = sessions.filter((s) => !statusFilter || s.review_status === statusFilter);
  const pendingCount = sessions.filter((s) => s.review_status === "pending").length;
  const confirmedCount = sessions.filter((s) => s.review_status === "confirmed").length;
  const dismissedCount = sessions.filter((s) => s.review_status === "dismissed").length;

  return (
    <ExaminerShell title="Proctoring Review">
      <div style={{ marginBottom: "1.3rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
          Proctoring Review Log
        </h2>
        <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
          {pendingCount} session{pendingCount !== 1 ? "s" : ""} awaiting manual examiner review.
        </p>
      </div>

      {error ? (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "0.75rem 1.1rem", borderRadius: "10px", marginBottom: "1.3rem", fontSize: "0.82rem", fontWeight: 600 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.85rem", marginBottom: "1.3rem" }}>
        <button
          onClick={() => setStatusFilter(statusFilter === "pending" ? "" : "pending")}
          style={{
            border: `1px solid ${statusFilter === "pending" ? "#2563eb" : cardBorder}`,
            borderRadius: "12px",
            padding: "1rem",
            textAlign: "center",
            background: cardBg,
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#d97706" }}>{pendingCount}</div>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 600, marginTop: "0.2rem" }}>Pending Review</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === "confirmed" ? "" : "confirmed")}
          style={{
            border: `1px solid ${statusFilter === "confirmed" ? "#2563eb" : cardBorder}`,
            borderRadius: "12px",
            padding: "1rem",
            textAlign: "center",
            background: cardBg,
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#dc2626" }}>{confirmedCount}</div>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 600, marginTop: "0.2rem" }}>Confirmed Violations</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === "dismissed" ? "" : "dismissed")}
          style={{
            border: `1px solid ${statusFilter === "dismissed" ? "#2563eb" : cardBorder}`,
            borderRadius: "12px",
            padding: "1rem",
            textAlign: "center",
            background: cardBg,
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#16a34a" }}>{dismissedCount}</div>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 600, marginTop: "0.2rem" }}>Dismissed / Clean</div>
        </button>
      </div>

      {loading ? (
        <div style={{ color: textSub, fontSize: "0.85rem", padding: "2rem", textAlign: "center", border: `1px dashed ${cardBorder}`, borderRadius: "12px" }}>
          Loading proctoring sessions...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ color: textSub, fontSize: "0.85rem", padding: "2rem", textAlign: "center", border: `1px dashed ${cardBorder}`, borderRadius: "12px" }}>
          No flagged sessions{statusFilter ? ` with status "${statusFilter}"` : ""} found.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((s) => (
            <Link
              key={s.session_id}
              href={`/examiner/proctoring/${s.session_id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "12px",
                padding: "1rem 1.2rem",
                textDecoration: "none",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: textMain, fontSize: "0.88rem" }}>{s.student_name}</div>
                <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.2rem" }}>
                  {s.exam_title} • {s.tab_switches} tab switches • {s.face_absent} face-absent • {s.multiple_faces} multi-face
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                <span
                  style={{
                    padding: "0.15rem 0.55rem",
                    borderRadius: "16px",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "capitalize",
                    background: s.review_status === "confirmed" ? "#fee2e2" : s.review_status === "dismissed" ? "#dcfce7" : "#fef3c7",
                    color: s.review_status === "confirmed" ? "#991b1b" : s.review_status === "dismissed" ? "#15803d" : "#92400e",
                  }}
                >
                  {s.review_status}
                </span>
                <span style={{ fontSize: "0.75rem", color: textSub, fontWeight: 600 }}>
                  Suspicion: {s.suspicion_score}/100
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ExaminerShell>
  );
}