"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StudentShell from "../StudentShell";
import {
  FileText,
  CheckCircle2,
  Video,
  Clock,
  ShieldCheck,
  Play,
  BookOpen
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

type AssignedExam = {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  proctoring_enabled: boolean;
};

const defaultExams: AssignedExam[] = [
  { id: "1", title: "Data Structures & Algorithms Midterm", subject: "Computer Science", duration_minutes: 60, total_marks: 100, proctoring_enabled: true },
  { id: "2", title: "Artificial Intelligence Final Assessment", subject: "AI & ML", duration_minutes: 90, total_marks: 100, proctoring_enabled: true },
  { id: "3", title: "Web Application Engineering Practical", subject: "Software Engineering", duration_minutes: 45, total_marks: 50, proctoring_enabled: true },
];

export default function StudentDashboardPage() {
  const [studentInfo, setStudentInfo] = useState({
    name: "Student Candidate 1",
    email: "student1@example.com",
    role: "Student",
  });

  const [exams, setExams] = useState<AssignedExam[]>([]);
  const [stats, setStats] = useState({
    availableExams: 3,
    completedExams: 1,
    aiMonitoring: "Ready",
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("student_theme");
      setIsDark(savedTheme === "dark");
    };
    syncTheme();
    window.addEventListener("themeChange", syncTheme);
    window.addEventListener("storage", syncTheme);

    const token = localStorage.getItem("access_token") || "";
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setStudentInfo({
              name: data.full_name || "Student Candidate 1",
              email: data.email || "student1@example.com",
              role: data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : "Student",
            });
          }
        })
        .catch(() => {});

      fetch(`${API_BASE}/exams/student`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((examsList: any[]) => {
          if (Array.isArray(examsList)) {
            setExams(examsList.length > 0 ? examsList : defaultExams);
            setStats((prev) => ({ ...prev, availableExams: examsList.length }));
          }
        })
        .catch(() => setExams(defaultExams));

      fetch(`${API_BASE}/exams/student/results`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((resList: any[]) => {
          if (Array.isArray(resList)) {
            setStats((prev) => ({ ...prev, completedExams: resList.length }));
          }
        })
        .catch(() => {});
    } else {
      setExams(defaultExams);
    }

    return () => {
      window.removeEventListener("themeChange", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  return (
    <StudentShell title="Student Dashboard">
      {/* ── Welcome Banner ─────────────────────────────────────────── */}
      <div
        className="welcome-banner card-padded"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #0d1424 0%, #1e1b4b 100%)"
            : "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)",
          border: `1px solid ${cardBorder}`,
          borderRadius: "16px",
          padding: "1.3rem 1.6rem",
          marginBottom: "1.4rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, margin: "0 0 0.25rem 0", lineHeight: 1.3 }}>
            Welcome back, {studentInfo.name} 👋
          </h2>
          <p style={{ fontSize: "0.82rem", color: textSub, margin: 0, lineHeight: 1.5 }}>
            View assigned examinations, check proctoring status, and track your performance.
          </p>
        </div>

        <Link
          href="/student/my-exams"
          className="welcome-banner-btn"
          style={{
            background: "#2563eb",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "0.6rem 1.1rem",
            fontWeight: 700,
            fontSize: "0.8rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            boxShadow: "0 3px 10px rgba(37, 99, 235, 0.25)",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <BookOpen size={16} /> View All My Exams
        </Link>
      </div>

      {/* ── 3 Stat Cards -- 2 uniform side-by-side columns ── */}
      <div className="stats-grid" style={{ marginBottom: "0.85rem", gap: "0.45rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.65rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>Available Exams</span>
            <FileText size={16} style={{ color: "#3b82f6", flexShrink: 0 }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>
            {stats.availableExams}
          </div>
          <div style={{ fontSize: "0.68rem", color: textSub, marginTop: "0.05rem" }}>Assigned to you</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.65rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>Completed</span>
            <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>
            {stats.completedExams}
          </div>
          <div style={{ fontSize: "0.68rem", color: textSub, marginTop: "0.05rem" }}>This semester</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.65rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>AI Monitoring</span>
            <Video size={16} style={{ color: "#9333ea", flexShrink: 0 }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>
            {stats.aiMonitoring}
          </div>
          <div style={{ fontSize: "0.68rem", color: textSub, marginTop: "0.05rem" }}>Proctoring status</div>
        </div>
      </div>



      {/* ── Bottom: Profile + System Status ──────────────────────── */}
      <div className="two-col-grid">
        {/* Student Profile Info */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.35rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textMain, margin: "0 0 1rem 0" }}>
            Student Profile
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {[
              { label: "FULL NAME", value: studentInfo.name },
              { label: "EMAIL ADDRESS", value: studentInfo.email },
              { label: "ROLE", value: studentInfo.role },
            ].map((item) => (
              <div key={item.label} style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem" }}>
                <div style={{ fontSize: "0.66rem", fontWeight: 700, color: textSub, textTransform: "uppercase", marginBottom: "0.15rem" }}>{item.label}</div>
                <div className="overflow-text" style={{ fontSize: "0.85rem", fontWeight: 700, color: textMain }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* System Readiness */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.35rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textMain, margin: "0 0 1rem 0" }}>
            System Readiness
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {[
              { label: "Camera Ready", desc: "Webcam detected and authorized", color: "#16a34a" },
              { label: "Microphone Ready", desc: "Audio input channel active", color: "#16a34a" },
              { label: "Internet Connected", desc: "Stable connection to exam server", color: "#16a34a" },
              { label: "AI Proctoring", desc: "Face detection & tab monitoring online", color: "#2563eb" },
            ].map((item) => (
              <div key={item.label} style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ color: item.color, fontSize: "1rem", flexShrink: 0 }}>●</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.83rem", color: textMain }}>{item.label}</div>
                  <div style={{ fontSize: "0.7rem", color: textSub, marginTop: "0.1rem" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StudentShell>
  );
}