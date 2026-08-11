"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import ExaminerShell from "../ExaminerShell";
import {
  Plus,
  Search,
  FileText,
  Clock,
  Award,
  Edit,
  Users
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-proctored-exam-platform-iv1t.onrender.com";

type Exam = {
  id: string;
  title: string;
  subject: string;
  status: "Draft" | "Published" | "Active" | "Completed" | "Cancelled";
  exam_type: "Regular" | "Practice" | "Mock";
  total_marks: number;
  duration_minutes: number;
  description?: string;
  start_time?: string;
  end_time?: string;
};

export default function ExamManagementPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All Exams" | "Draft" | "Published" | "Active" | "Completed" | "Cancelled">("All Exams");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("examiner_theme");
    setIsDark(savedTheme === "dark");

    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/exams`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: Exam[] = data.map((e) => ({
            id: e.id,
            title: e.title,
            subject: e.subject || "General",
            status: (e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : "Published") as Exam["status"],
            exam_type: "Regular",
            total_marks: e.total_marks || 20,
            duration_minutes: e.duration_minutes || 17,
            description: e.instructions || "Subjects will be configured through sections",
            start_time: e.start_time || "25/7/2026, 10:15:00 pm",
            end_time: e.end_time || "26/7/2026, 10:16:00 pm",
          }));
          setExams(mapped);
        } else {
          setExams([]);
        }
      })
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, []);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        exam.title.toLowerCase().includes(q) ||
        exam.subject.toLowerCase().includes(q) ||
        exam.exam_type.toLowerCase().includes(q);

      const matchesTab =
        activeTab === "All Exams" || exam.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [exams, searchQuery, activeTab]);

  return (
    <ExaminerShell title="Exam Management">
      {/* Header & Create Exam Action */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.3rem" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
            Exam Builder
          </h2>
          <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
            Create, configure, publish, and manage your examinations.
          </p>
        </div>

        <Link
          href="/examiner/create"
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
            gap: "0.35rem",
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={16} />
          Create New Exam
        </Link>
      </div>

      {/* 4 Stat Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.85rem", marginBottom: "1.3rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Total Exams</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{exams.length}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Draft Exams</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{exams.filter(e => e.status === "Draft").length}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Published</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{exams.filter(e => e.status === "Published" || e.status === "Active").length}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Completed</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.25rem" }}>{exams.filter(e => e.status === "Completed").length}</div>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1rem", marginBottom: "1.2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.85rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, maxWidth: "420px", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.8rem" }}>
            <Search size={15} style={{ color: textSub }} />
            <input
              type="text"
              placeholder="Search by exam name, type, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: textMain, width: "100%", fontSize: "0.8rem" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {(["All Exams", "Draft", "Published", "Active", "Completed", "Cancelled"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "0.42rem 0.8rem",
                  borderRadius: "6px",
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
        </div>
      </div>

      {/* Exam Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
        {filteredExams.map((exam) => (
          <div key={exam.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <span style={{ padding: "0.15rem 0.55rem", borderRadius: "16px", fontSize: "0.68rem", fontWeight: 600, background: "#dbeafe", color: "#1e40af" }}>
                  {exam.status}
                </span>
                <span style={{ padding: "0.15rem 0.55rem", borderRadius: "16px", fontSize: "0.68rem", fontWeight: 600, background: "#f3e8ff", color: "#6b21a8" }}>
                  {exam.exam_type}
                </span>
              </div>

              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={16} />
              </div>
            </div>

            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
              {exam.title}
            </h3>

            <div style={{ fontSize: "0.78rem", color: textSub, marginBottom: "0.95rem" }}>
              {exam.description || "Subjects will be configured through sections"}
            </div>

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.95rem" }}>
              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.7rem" }}>
                <div style={{ fontSize: "0.68rem", color: textSub, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Clock size={11} /> Duration: {exam.duration_minutes} min
                </div>
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.7rem" }}>
                <div style={{ fontSize: "0.68rem", color: textSub, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Award size={11} /> Total Marks: {exam.total_marks}
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", paddingTop: "0.65rem", borderTop: `1px solid ${cardBorder}` }}>
              <Link
                href={`/examiner/exams/${exam.id}`}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: "6px",
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Edit size={13} /> Open Builder
              </Link>

              <Link
                href="/examiner/assign"
                style={{
                  background: "transparent",
                  border: `1px solid ${cardBorder}`,
                  color: textMain,
                  borderRadius: "6px",
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Users size={13} /> Assign Students
              </Link>
            </div>
          </div>
        ))}
      </div>
    </ExaminerShell>
  );
}
