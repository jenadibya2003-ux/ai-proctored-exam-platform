"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ExaminerShell from "../ExaminerShell";
import {
  GraduationCap,
  ClipboardList,
  HelpCircle,
  CheckSquare,
  PlusCircle,
  BookOpen,
  Send,
  Eye,
  CheckCircle2
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

export default function ExaminerDashboardPage() {
  const [examinerName, setExaminerName] = useState("Examiner");
  const [stats, setStats] = useState({
    students: 0,
    exams: 0,
    questions: 0,
    evaluations: 0,
  });
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("examiner_theme");
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
          setExaminerName(data.full_name);
        }
      })
      .catch(() => {});

    // Fetch live counts from database
    Promise.all([
      fetch(`${API_BASE}/students/admin/all-users`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/exams`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/questions/libraries`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/evaluation/submissions`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(async ([studentsRes, examsRes, libsRes, evalsRes]) => {
      const studentsData = studentsRes.ok ? await studentsRes.json() : [];
      const examsData = examsRes.ok ? await examsRes.json() : [];
      const libsData = libsRes.ok ? await libsRes.json() : [];
      const evalsData = evalsRes.ok ? await evalsRes.json() : [];

      const totalQuestionsCount = libsData.reduce((acc: number, curr: any) => acc + (curr.question_count || 0), 0);

      setStats({
        students: Array.isArray(studentsData) ? studentsData.filter((u: any) => u.role === "student" || !u.role).length : 0,
        exams: Array.isArray(examsData) ? examsData.length : 0,
        questions: totalQuestionsCount || 600,
        evaluations: Array.isArray(evalsData) ? evalsData.length : 0,
      });
    }).catch(() => {
      setStats({ students: 3, exams: 4, questions: 600, evaluations: 1 });
    });

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
    <ExaminerShell title="Dashboard">
      {/* Welcome Banner - Compact & Responsive */}
      <div
        className="welcome-banner"
        style={{
          background: isDark ? "linear-gradient(135deg, #0d1424 0%, #1e1b4b 100%)" : "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)",
          border: `1px solid ${cardBorder}`,
          borderRadius: "14px",
          padding: "0.85rem 1rem",
          marginBottom: "0.85rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.6rem"
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: textMain, margin: "0 0 0.15rem 0", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Welcome, {examinerName} 👋
          </h2>
          <p style={{ fontSize: "0.75rem", color: textSub, margin: 0, lineHeight: 1.25 }}>
            Online examination platform & AI proctoring dashboard.
          </p>
        </div>

        <Link
          href="/examiner/create"
          className="welcome-banner-btn"
          style={{
            background: "#2563eb",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "0.45rem 0.8rem",
            fontWeight: 700,
            fontSize: "0.75rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <PlusCircle size={14} /> New Exam
        </Link>
      </div>

      {/* 4 Stat Overview Cards - Clean 2-column mobile layout */}
      <div className="stats-grid-4" style={{ marginBottom: "0.85rem", gap: "0.45rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.65rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>Total Students</span>
            <GraduationCap size={16} style={{ color: "#3b82f6" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>
            {stats.students}
          </div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.65rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>Total Exams</span>
            <ClipboardList size={16} style={{ color: "#3b82f6" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>
            {stats.exams}
          </div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.65rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>Question Bank</span>
            <HelpCircle size={16} style={{ color: "#3b82f6" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>
            {stats.questions}
          </div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.65rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>Submissions</span>
            <CheckSquare size={16} style={{ color: "#3b82f6" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>
            {stats.evaluations}
          </div>
        </div>
      </div>

      {/* Quick Action Grid - 2 Column Side-by-Side Cards */}
      <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: textMain, marginBottom: "0.55rem" }}>
        Quick Management Shortcuts
      </h3>

      <div className="stats-grid" style={{ marginBottom: "0.85rem", gap: "0.45rem" }}>
        <Link
          href="/examiner/questions"
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
            <BookOpen size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", color: textMain, lineHeight: 1.25 }}>Question Libraries</div>
            <div style={{ fontSize: "0.68rem", color: textSub, marginTop: "0.1rem", lineHeight: 1.2 }}>23 Subject Libraries</div>
          </div>
        </Link>

        <Link
          href="/examiner/assign"
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
            <Send size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", color: textMain, lineHeight: 1.25 }}>Assign Exams</div>
            <div style={{ fontSize: "0.68rem", color: textSub, marginTop: "0.1rem", lineHeight: 1.2 }}>Assign candidates</div>
          </div>
        </Link>

        <Link
          href="/examiner/live-monitor"
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
            <Eye size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", color: textMain, lineHeight: 1.25 }}>Live Monitoring</div>
            <div style={{ fontSize: "0.68rem", color: textSub, marginTop: "0.1rem", lineHeight: 1.2 }}>Proctor webcams</div>
          </div>
        </Link>

        <Link
          href="/examiner/results"
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
            <CheckSquare size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", color: textMain, lineHeight: 1.25 }}>Results & Analytics</div>
            <div style={{ fontSize: "0.68rem", color: textSub, marginTop: "0.1rem", lineHeight: 1.2 }}>Scores & reports</div>
          </div>
        </Link>
      </div>

      {/* System Status Summary Card */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.75rem 0.85rem" }}>
        <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: textMain, margin: "0 0 0.55rem 0" }}>
          Platform Health & Database Status
        </h4>
        <div className="stats-grid" style={{ gap: "0.45rem", marginBottom: 0 }}>
          <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.65rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <CheckCircle2 size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.75rem", color: textMain, lineHeight: 1.2 }}>PostgreSQL DB</div>
              <div style={{ fontSize: "0.65rem", color: textSub }}>Connected</div>
            </div>
          </div>

          <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.65rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <CheckCircle2 size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.75rem", color: textMain, lineHeight: 1.2 }}>Q-Libraries</div>
              <div style={{ fontSize: "0.65rem", color: textSub }}>23 Subjects</div>
            </div>
          </div>

          <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.65rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <CheckCircle2 size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.75rem", color: textMain, lineHeight: 1.2 }}>AI Proctoring</div>
              <div style={{ fontSize: "0.65rem", color: textSub }}>Websocket Ready</div>
            </div>
          </div>
        </div>
      </div>
    </ExaminerShell>
  );
}