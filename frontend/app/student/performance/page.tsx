"use client";

import { useEffect, useState } from "react";
import StudentShell from "../StudentShell";
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type PerformanceItem = {
  id: string;
  title: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: "PASSED" | "FAILED";
};

export default function StudentPerformancePage() {
  const [stats, setStats] = useState({
    totalExams: 1,
    passed: 1,
    failed: 0,
    avgScore: 100,
    violations: 0,
    bestSubject: "Computer Science & Programming",
  });

  const [recentExams, setRecentExams] = useState<PerformanceItem[]>([]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("student_theme");
    setIsDark(savedTheme === "dark");

    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/exams/student/results`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: PerformanceItem[] = data.map((d, idx) => {
            const score = d.final_score || d.ai_score || 5;
            const total = d.total_marks || 5;
            const pct = (score / total) * 100;
            return {
              id: String(idx + 1),
              title: d.exam_title || "Regular Midterm Exam",
              subject: d.exam_subject || "Computer Science",
              score: score,
              totalMarks: total,
              percentage: Math.round(pct),
              status: pct >= 40 ? "PASSED" : "FAILED",
            };
          });
          setRecentExams(mapped);

          const passedCount = mapped.filter((m) => m.status === "PASSED").length;
          const failedCount = mapped.filter((m) => m.status === "FAILED").length;
          const avgPct = Math.round(mapped.reduce((acc, curr) => acc + curr.percentage, 0) / mapped.length);

          setStats({
            totalExams: mapped.length,
            passed: passedCount,
            failed: failedCount,
            avgScore: avgPct,
            violations: 0,
            bestSubject: mapped[0].subject,
          });
        } else {
          setRecentExams(defaultPerformance);
        }
      })
      .catch(() => setRecentExams(defaultPerformance));
  }, []);

  const defaultPerformance: PerformanceItem[] = [
    { id: "1", title: "Regular Midterm Exam", subject: "Computer Science & Programming", score: 5, totalMarks: 5, percentage: 100, status: "PASSED" }
  ];

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  return (
    <StudentShell title="Performance">
      <div style={{ marginBottom: "1.3rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
          Performance Overview
        </h2>
        <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
          Track your academic progress and examination performance analytics.
        </p>
      </div>

      {/* 5 Stat Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.85rem", marginBottom: "1.4rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: textSub, fontSize: "0.75rem", fontWeight: 500 }}>
            <span>Total Exams</span>
            <BookOpen size={15} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{stats.totalExams}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: textSub, fontSize: "0.75rem", fontWeight: 500 }}>
            <span>Passed</span>
            <CheckCircle2 size={15} style={{ color: "#16a34a" }} />
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{stats.passed}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: textSub, fontSize: "0.75rem", fontWeight: 500 }}>
            <span>Failed</span>
            <XCircle size={15} style={{ color: "#dc2626" }} />
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{stats.failed}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: textSub, fontSize: "0.75rem", fontWeight: 500 }}>
            <span>Average Score</span>
            <Award size={15} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{stats.avgScore}%</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: textSub, fontSize: "0.75rem", fontWeight: 500 }}>
            <span>Violations</span>
            <AlertTriangle size={15} style={{ color: "#b45309" }} />
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{stats.violations}</div>
        </div>
      </div>

      {/* 2 Main Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.3rem" }}>
        {/* Recent Performance List */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.35rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.15rem 0" }}>
            Recent Performance
          </h3>
          <p style={{ fontSize: "0.75rem", color: textSub, margin: "0 0 1rem 0" }}>Your latest examination scores.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {recentExams.map((item) => (
              <div key={item.id} style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.85rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: textMain }}>{item.title}</div>
                  <span
                    style={{
                      padding: "0.15rem 0.55rem",
                      borderRadius: "16px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      background: item.status === "PASSED" ? "#dcfce7" : "#fee2e2",
                      color: item.status === "PASSED" ? "#15803d" : "#991b1b",
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                <div style={{ fontSize: "0.75rem", color: textSub, marginBottom: "0.65rem" }}>{item.subject}</div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: textMain, marginBottom: "0.35rem" }}>
                  <span>Score: {item.score} / {item.totalMarks}</span>
                  <span>{item.percentage}%</span>
                </div>

                <div style={{ width: "100%", height: "6px", borderRadius: "3px", background: cardBorder, overflow: "hidden" }}>
                  <div style={{ width: `${item.percentage}%`, height: "100%", background: item.status === "PASSED" ? "#16a34a" : "#dc2626", borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Summary & Weak Area Insights Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.35rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 1rem 0" }}>
              Overall Summary
            </h3>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1.1rem", textAlign: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>AVERAGE PERCENTAGE</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#2563eb", marginTop: "0.25rem" }}>{stats.avgScore}%</div>
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>BEST SUBJECT</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: textMain, marginTop: "0.25rem" }}>{stats.bestSubject}</div>
              <div style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600, marginTop: "0.15rem" }}>100% average accuracy</div>
            </div>
          </div>

          {/* Targeted Practice & Weak Areas Card */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.35rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: 0 }}>
                Weak Area Insights & Recommended Practice
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.85rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.83rem", fontWeight: 700, color: textMain }}>Computer Networks & Protocols</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#b45309", background: "#fef3c7", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>Needs Focus (65%)</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: textSub, marginBottom: "0.5rem" }}>Review OSI model layers and subnetting concepts.</div>
                <a
                  href="/student/mock-tests"
                  style={{ display: "inline-block", background: "#2563eb", color: "#ffffff", padding: "0.3rem 0.75rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700, textDecoration: "none" }}
                >
                  Start Practice Quiz →
                </a>
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.85rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.83rem", fontWeight: 700, color: textMain }}>Software Engineering & Testing</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>Proficient (88%)</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: textSub }}>Solid understanding of Agile development workflows.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
