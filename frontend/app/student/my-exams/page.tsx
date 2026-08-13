"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import StudentShell from "../StudentShell";
import {
  Search,
  Clock,
  Award,
  Calendar,
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

type StudentExam = {
  id: string;
  title: string;
  subject: string;
  status: "Upcoming" | "Active" | "Completed" | "Expired";
  exam_type: "Regular" | "Practice" | "Mock";
  total_marks: number;
  duration_minutes: number;
  start_time: string;
  end_time: string;
};

export default function StudentMyExamsPage() {
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All Exams" | "Upcoming" | "Active" | "Completed" | "Expired">("All Exams");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("student_theme");
    setIsDark(savedTheme === "dark");

    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/exams/student/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: StudentExam[] = data.map((e) => {
            const rawStatus = (e.status || "").toLowerCase();
            let normStatus: "Upcoming" | "Active" | "Completed" | "Expired" = "Active";
            if (rawStatus === "completed") normStatus = "Completed";
            else if (rawStatus === "upcoming") normStatus = "Upcoming";
            else if (rawStatus === "expired") normStatus = "Expired";
            else normStatus = "Active";

            return {
              id: e.exam_id || e.id,
              title: e.title,
              subject: e.subject || "Computer Science",
              status: normStatus,
              exam_type: "Regular",
              total_marks: e.total_marks || 100,
              duration_minutes: e.duration_minutes || 60,
              start_time: e.start_time ? new Date(e.start_time).toLocaleString() : "Active Now",
              end_time: e.end_time ? new Date(e.end_time).toLocaleString() : "No Expiry",
            };
          });
          setExams(mapped);
        } else {
          setExams(defaultExams);
        }
      })
      .catch(() => setExams(defaultExams))
      .finally(() => setLoading(false));
  }, []);

  const defaultExams: StudentExam[] = [
    { id: "1", title: "Regular Midterm Exam", subject: "Computer Science & Programming", status: "Completed", exam_type: "Regular", total_marks: 40, duration_minutes: 60, start_time: "23/7/2026, 11:33:00 am", end_time: "25/7/2026, 11:33:00 am" },
    { id: "2", title: "Mathematics & Aptitude Quiz", subject: "Mathematics & Quantitative Aptitude", status: "Active", exam_type: "Regular", total_marks: 20, duration_minutes: 30, start_time: "25/7/2026, 9:00:00 am", end_time: "27/7/2026, 9:00:00 am" },
    { id: "3", title: "Semester 3 Practice Test", subject: "Software Engineering & DevOps", status: "Expired", exam_type: "Regular", total_marks: 50, duration_minutes: 45, start_time: "20/7/2026, 10:37:00 pm", end_time: "22/7/2026, 10:37:00 pm" }
  ];

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const totalCount = exams.length;
  const upcomingCount = exams.filter((e) => e.status === "Upcoming").length;
  const activeCount = exams.filter((e) => e.status === "Active").length;
  const completedCount = exams.filter((e) => e.status === "Completed").length;
  const expiredCount = exams.filter((e) => e.status === "Expired").length;

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || exam.title.toLowerCase().includes(q) || exam.subject.toLowerCase().includes(q);
      const matchesTab = activeTab === "All Exams" || exam.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [exams, searchQuery, activeTab]);

  return (
    <StudentShell title="My Exams">
      {/* Header & Search Bar */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.3rem" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
            My Exams
          </h2>
          <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
            View assigned exams and continue to the secure verification process.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "260px", background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.8rem" }}>
          <Search size={15} style={{ color: textSub }} />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", color: textMain, width: "100%", fontSize: "0.8rem" }}
          />
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid-5" style={{ marginBottom: "1.3rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Total</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{totalCount}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Upcoming</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{upcomingCount}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Active</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{activeCount}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Completed</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{completedCount}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Expired</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{expiredCount}</div>
        </div>
      </div>

      {/* Filter Tabs & Cards List */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.35rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
          {(["All Exams", "Upcoming", "Active", "Completed", "Expired"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.45rem 0.95rem",
                borderRadius: "8px",
                border: "none",
                background: activeTab === tab ? "#2563eb" : innerBg,
                color: activeTab === tab ? "#ffffff" : textSub,
                fontWeight: 600,
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Exam Cards Grid - 2 side-by-side columns on mobile */}
        <div className="grid-cards-2col" style={{ gap: "0.75rem" }}>
          {filteredExams.map((exam) => (
            <div key={exam.id} style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <span
                  style={{
                    padding: "0.15rem 0.55rem",
                    borderRadius: "16px",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    background: exam.status === "Active" ? "#dcfce7" : exam.status === "Completed" ? "#dbeafe" : "#fee2e2",
                    color: exam.status === "Active" ? "#15803d" : exam.status === "Completed" ? "#1e40af" : "#991b1b",
                  }}
                >
                  {exam.status}
                </span>

                <span style={{ padding: "0.15rem 0.55rem", borderRadius: "16px", fontSize: "0.68rem", fontWeight: 700, background: "#f3e8ff", color: "#6b21a8" }}>
                  {exam.exam_type}
                </span>
              </div>

              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.2rem 0" }}>
                {exam.title}
              </h3>
              <div style={{ fontSize: "0.78rem", color: textSub, marginBottom: "0.85rem" }}>
                {exam.subject}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.75rem", color: textSub, marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Award size={13} /> Total Marks: {exam.total_marks}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Clock size={13} /> Duration: {exam.duration_minutes} Minutes
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Calendar size={13} /> Start: {exam.start_time}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Calendar size={13} /> End: {exam.end_time}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                {exam.status === "Completed" ? (
                  <Link
                    href={`/student/my-exams/${exam.id}/submission`}
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      borderRadius: "8px",
                      padding: "0.48rem 0.85rem",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    View Submission <ArrowRight size={13} />
                  </Link>
                ) : (
                  <Link
                    href={`/student/my-exams/${exam.id}/take`}
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      borderRadius: "8px",
                      padding: "0.48rem 0.85rem",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    View Details & Start <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StudentShell>
  );
}