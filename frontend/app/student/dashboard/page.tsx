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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type AssignedExam = {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  proctoring_enabled: boolean;
};

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
          if (Array.isArray(examsList) && examsList.length > 0) {
            setExams(examsList);
            setStats((prev) => ({
              ...prev,
              availableExams: examsList.length,
            }));
          } else {
            setExams(defaultExams);
          }
        })
        .catch(() => setExams(defaultExams));
    } else {
      setExams(defaultExams);
    }

    return () => {
      window.removeEventListener("themeChange", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const defaultExams: AssignedExam[] = [
    { id: "1", title: "Data Structures & Algorithms Midterm", subject: "Computer Science", duration_minutes: 60, total_marks: 100, proctoring_enabled: true },
    { id: "2", title: "Artificial Intelligence Final Assessment", subject: "AI & ML", duration_minutes: 90, total_marks: 100, proctoring_enabled: true },
    { id: "3", title: "Web Application Engineering Practical", subject: "Software Engineering", duration_minutes: 45, total_marks: 50, proctoring_enabled: true },
  ];

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  return (
    <StudentShell title="Student Dashboard">
      {/* Welcome Banner - Compact font sizes */}
      <div
        style={{
          background: isDark ? "linear-gradient(135deg, #0d1424 0%, #1e1b4b 100%)" : "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)",
          border: `1px solid ${cardBorder}`,
          borderRadius: "16px",
          padding: "1.3rem 1.6rem",
          marginBottom: "1.4rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: textMain, margin: "0 0 0.25rem 0" }}>
            Welcome back, {studentInfo.name} 👋
          </h2>
          <p style={{ fontSize: "0.82rem", color: textSub, margin: 0 }}>
            View assigned examinations, check proctoring status, and track your performance.
          </p>
        </div>

        <Link
          href="/student/my-exams"
          style={{
            background: "#2563eb",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "0.55rem 1.1rem",
            fontWeight: 700,
            fontSize: "0.8rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            boxShadow: "0 3px 10px rgba(37, 99, 235, 0.25)",
          }}
        >
          <BookOpen size={16} /> View All My Exams
        </Link>
      </div>

      {/* 3 Stat Cards - Compact font sizes & numbers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.4rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: textSub }}>Available Exams</span>
            <FileText size={18} style={{ color: "#3b82f6" }} />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: textMain, marginTop: "0.3rem" }}>
            {stats.availableExams}
          </div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: textSub }}>Completed Exams</span>
            <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: textMain, marginTop: "0.3rem" }}>
            {stats.completedExams}
          </div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: textSub }}>AI Monitoring</span>
            <Video size={18} style={{ color: "#9333ea" }} />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: textMain, marginTop: "0.3rem" }}>
            {stats.aiMonitoring}
          </div>
        </div>
      </div>

      {/* Main Assigned My Exams Section */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.35rem", marginBottom: "1.4rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: 0 }}>
              My Assigned Examinations
            </h3>
            <p style={{ fontSize: "0.78rem", color: textSub, margin: "0.15rem 0 0 0" }}>
              Select an exam below to begin system check and enter the proctored exam environment.
            </p>
          </div>

          <Link
            href="/student/my-exams"
            style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2563eb", textDecoration: "none" }}
          >
            Manage All ({exams.length}) →
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {exams.map((ex) => (
            <div
              key={ex.id}
              style={{
                background: innerBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "12px",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "#dbeafe", color: "#1e40af", padding: "0.15rem 0.5rem", borderRadius: "10px" }}>
                    {ex.subject}
                  </span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    <ShieldCheck size={13} /> AI Proctored
                  </span>
                </div>

                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: textMain, margin: "0 0 0.4rem 0", lineHeight: 1.3 }}>
                  {ex.title}
                </h4>

                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", fontSize: "0.72rem", color: textSub, marginBottom: "0.85rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    <Clock size={12} /> {ex.duration_minutes} Mins
                  </span>
                  <span>Total Marks: {ex.total_marks}</span>
                </div>
              </div>

              <Link
                href={`/student/my-exams/${ex.id}/take`}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "0.5rem 0.85rem",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  textDecoration: "none",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.35rem",
                }}
              >
                <Play size={13} /> Start Exam
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 2 Cards Grid: Student Info & System Readiness */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.3rem" }}>
        {/* Student Profile Info Card */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.35rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 1rem 0" }}>
            Student Profile Information
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: textSub, textTransform: "uppercase" }}>FULL NAME</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: textMain, marginTop: "0.15rem" }}>{studentInfo.name}</div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: textSub, textTransform: "uppercase" }}>EMAIL ADDRESS</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: textMain, marginTop: "0.15rem" }}>{studentInfo.email}</div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: textSub, textTransform: "uppercase" }}>ROLE</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: textMain, marginTop: "0.15rem" }}>{studentInfo.role}</div>
            </div>
          </div>
        </div>

        {/* System Status Card */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.35rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 1rem 0" }}>
            System Status & Readiness
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "#16a34a", fontSize: "1rem" }}>●</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: textMain }}>Camera Ready</div>
                <div style={{ fontSize: "0.72rem", color: textSub }}>Webcam hardware detected and authorized</div>
              </div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "#16a34a", fontSize: "1rem" }}>●</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: textMain }}>Microphone Ready</div>
                <div style={{ fontSize: "0.72rem", color: textSub }}>Audio input channel active</div>
              </div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "#16a34a", fontSize: "1rem" }}>●</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: textMain }}>Internet Connected</div>
                <div style={{ fontSize: "0.72rem", color: textSub }}>Stable connection to examination server</div>
              </div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "#2563eb", fontSize: "1rem" }}>●</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: textMain }}>AI Proctoring Available</div>
                <div style={{ fontSize: "0.72rem", color: textSub }}>Real-time face detection & tab monitoring online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
