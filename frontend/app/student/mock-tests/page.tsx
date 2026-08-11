"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StudentShell from "../StudentShell";
import { FlaskConical, ArrowRight, Clock, Award } from "lucide-react";

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

type MockItem = {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  question_count: number;
};

export default function StudentMockTestsPage() {
  const [isDark, setIsDark] = useState(false);
  const [mockList, setMockList] = useState<MockItem[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("student_theme");
    setIsDark(savedTheme === "dark");

    fetch(`${API_BASE}/exams/student/mock-list`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setMockList(data);
        } else {
          setMockList(defaultMocks);
        }
      })
      .catch(() => setMockList(defaultMocks));
  }, []);

  const defaultMocks: MockItem[] = [
    { id: "1", title: "Computer Science & Programming Practice", subject: "Computer Science & Programming", duration_minutes: 30, total_marks: 30, question_count: 15 },
    { id: "2", title: "Mathematics & Quantitative Aptitude Practice", subject: "Mathematics", duration_minutes: 25, total_marks: 20, question_count: 10 },
    { id: "3", title: "Software Engineering & Systems Practice", subject: "Software Engineering", duration_minutes: 40, total_marks: 40, question_count: 20 },
  ];

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  return (
    <StudentShell title="Mock Tests">
      <div style={{ marginBottom: "1.3rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
          Practice Mock Tests
        </h2>
        <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
          Take dynamic subject practice tests to prepare for official examinations.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.1rem" }}>
        {mockList.map((m, idx) => (
          <div key={m.id || idx} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.35rem" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.85rem" }}>
              <FlaskConical size={18} />
            </div>

            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.35rem 0" }}>
              {m.title}
            </h3>

            <div style={{ display: "flex", gap: "0.8rem", fontSize: "0.75rem", color: textSub, marginBottom: "1.1rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Clock size={13} /> {m.duration_minutes} Mins
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Award size={13} /> {m.total_marks} Marks
              </span>
            </div>

            <Link
              href="/mock-exam"
              style={{
                background: "#2563eb",
                color: "#ffffff",
                borderRadius: "8px",
                padding: "0.55rem 1rem",
                fontSize: "0.78rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                width: "100%",
                justifyContent: "center",
                boxSizing: "border-box"
              }}
            >
              Start Practice Test <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </StudentShell>
  );
}