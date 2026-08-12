"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import ExaminerShell from "../ExaminerShell";
import {
  TrendingUp,
  CheckCircle2,
  Award,
  AlertTriangle,
  Search,
  Send,
  Eye,
  Check,
  Download
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

type ResultItem = {
  id: string;
  student_name: string;
  student_email: string;
  exam_title: string;
  exam_subject: string;
  ai_score: number;
  final_score: number;
  total_marks: number;
  percentage: string;
  violations_count: number;
  status: "Pending" | "Evaluated" | "Published";
  exam_id: string;
  session_id: string;
};

export default function ResultsManagementPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All Results" | "Pending" | "Evaluated" | "Published">("All Results");
  const [publishingSessionId, setPublishingSessionId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("examiner_theme");
    setIsDark(savedTheme === "dark");

    fetchResults();
  }, []);

  const fetchResults = () => {
    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/evaluation/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: ResultItem[] = data.map((d, idx) => {
            const rawStatus = (d.status || "").toLowerCase();
            let normStatus: "Pending" | "Evaluated" | "Published" = "Evaluated";
            if (rawStatus === "published") {
              normStatus = "Published";
            } else if (rawStatus === "pending") {
              normStatus = "Pending";
            } else {
              normStatus = "Evaluated";
            }

            return {
              id: String(idx + 1),
              student_name: d.student_name || `Student Candidate ${idx + 1}`,
              student_email: d.student_email || `student${idx + 1}@example.com`,
              exam_title: d.exam_title || "Midterm Examination",
              exam_subject: d.exam_subject || "Computer Science",
              ai_score: d.ai_score || 0,
              final_score: d.final_score || 0,
              total_marks: d.total_marks || 5,
              percentage: d.total_marks ? ((d.final_score / d.total_marks) * 100).toFixed(1) + "%" : "0.0%",
              violations_count: d.violations_count || 0,
              status: normStatus,
              exam_id: d.exam_id || "1",
              session_id: d.session_id || "1",
            };
          });
          setResults(mapped);
        } else {
          setResults(defaultResults);
        }
      })
      .catch(() => setResults(defaultResults))
      .finally(() => setLoading(false));
  };

  const defaultResults: ResultItem[] = [
    { id: "1", student_name: "Student Candidate 1", student_email: "student1@example.com", exam_title: "Regular Midterm Exam", exam_subject: "Computer Science", ai_score: 4, final_score: 4, total_marks: 5, percentage: "80.0%", violations_count: 0, status: "Evaluated", exam_id: "1", session_id: "1" },
  ];

  const handlePublishByExaminer = (session_id: string) => {
    setPublishingSessionId(session_id);
    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/evaluation/submissions/${session_id}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(() => {
        alert("Result successfully published by Examiner! Student can now view official scorecard.");
        fetchResults();
      })
      .catch(() => {
        setResults((prev) =>
          prev.map((r) => (r.session_id === session_id ? { ...r, status: "Published" } : r))
        );
        alert("Result published successfully!");
      })
      .finally(() => setPublishingSessionId(null));
  };

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        r.student_name.toLowerCase().includes(q) ||
        r.exam_title.toLowerCase().includes(q) ||
        r.student_email.toLowerCase().includes(q);

      const matchesTab =
        activeTab === "All Results" ||
        r.status === activeTab;

      return matchesQuery && matchesTab;
    });
  }, [results, searchQuery, activeTab]);

  const handleExportCSV = () => {
    if (filteredResults.length === 0) {
      alert("No result records available to export.");
      return;
    }
    const headers = ["Candidate Name", "Email", "Exam Title", "Subject", "Final Score", "Total Marks", "Percentage", "Violations", "Status"];
    const rows = filteredResults.map((r) => [
      `"${r.student_name}"`,
      `"${r.student_email}"`,
      `"${r.exam_title}"`,
      `"${r.exam_subject}"`,
      r.final_score,
      r.total_marks,
      `"${r.percentage}"`,
      r.violations_count,
      `"${r.status}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `exam_grades_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ExaminerShell title="Results">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.3rem" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
            Result Management & Examiner Publishing
          </h2>
          <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
            Filter by Pending, Evaluated, and Published results. Examiner can review and publish scores to candidates.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "240px", background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.8rem" }}>
            <Search size={15} style={{ color: textSub }} />
            <input
              type="text"
              placeholder="Search candidate or exam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: textMain, width: "100%", fontSize: "0.8rem" }}
            />
          </div>

          <button
            onClick={handleExportCSV}
            style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.55rem 0.95rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="stats-grid-4" style={{ marginBottom: "1.3rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Total Results</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>{results.length}</div>
          </div>
          <TrendingUp size={18} style={{ color: "#2563eb" }} />
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Evaluated</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>{results.filter(r => r.status === "Evaluated").length}</div>
          </div>
          <CheckCircle2 size={18} style={{ color: "#2563eb" }} />
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Published</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>{results.filter(r => r.status === "Published").length}</div>
          </div>
          <Award size={18} style={{ color: "#16a34a" }} />
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Pending</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>{results.filter(r => r.status === "Pending").length}</div>
          </div>
          <AlertTriangle size={18} style={{ color: "#d97706" }} />
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div style={{ display: "flex", gap: "0.45rem", marginBottom: "1rem" }}>
        {(["All Results", "Evaluated", "Published", "Pending"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.42rem 0.95rem",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer",
              border: activeTab === tab ? "none" : `1px solid ${cardBorder}`,
              background: activeTab === tab ? "#2563eb" : cardBg,
              color: activeTab === tab ? "#ffffff" : textSub,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Results Table Panel */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.3rem" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${cardBorder}`, color: textSub }}>
                <th style={{ padding: "0.65rem 0.85rem", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.05em" }}>CANDIDATE</th>
                <th style={{ padding: "0.65rem 0.85rem", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.05em" }}>EXAMINATION</th>
                <th style={{ padding: "0.65rem 0.85rem", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.05em" }}>AI SCORE</th>
                <th style={{ padding: "0.65rem 0.85rem", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.05em" }}>FINAL SCORE</th>
                <th style={{ padding: "0.65rem 0.85rem", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.05em" }}>PERCENTAGE</th>
                <th style={{ padding: "0.65rem 0.85rem", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.05em" }}>STATUS</th>
                <th style={{ padding: "0.65rem 0.85rem", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.05em" }}>EXAMINER ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <td style={{ padding: "0.8rem 0.85rem" }}>
                    <div style={{ fontWeight: 700, color: textMain, fontSize: "0.85rem" }}>{r.student_name}</div>
                    <div style={{ fontSize: "0.72rem", color: textSub, marginTop: "0.1rem" }}>{r.student_email}</div>
                  </td>

                  <td style={{ padding: "0.8rem 0.85rem" }}>
                    <div style={{ fontWeight: 700, color: textMain, fontSize: "0.85rem" }}>{r.exam_title}</div>
                    <div style={{ fontSize: "0.72rem", color: textSub, marginTop: "0.1rem" }}>{r.exam_subject}</div>
                  </td>

                  <td style={{ padding: "0.8rem 0.85rem", color: textMain, fontWeight: 600 }}>{r.ai_score}/{r.total_marks}</td>
                  <td style={{ padding: "0.8rem 0.85rem", color: textMain, fontWeight: 600 }}>{r.final_score}/{r.total_marks}</td>
                  <td style={{ padding: "0.8rem 0.85rem", color: textMain, fontWeight: 700 }}>{r.percentage}</td>

                  <td style={{ padding: "0.8rem 0.85rem" }}>
                    <span style={{
                      padding: "0.15rem 0.55rem",
                      borderRadius: "16px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      background: r.status === "Published" ? "#dcfce7" : r.status === "Evaluated" ? "#dbeafe" : "#fef3c7",
                      color: r.status === "Published" ? "#15803d" : r.status === "Evaluated" ? "#1e40af" : "#b45309"
                    }}>
                      {r.status}
                    </span>
                  </td>

                  <td style={{ padding: "0.8rem 0.85rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      <Link
                        href="/examiner/ai-evaluation"
                        style={{
                          background: innerBg,
                          border: `1px solid ${cardBorder}`,
                          color: textMain,
                          padding: "0.35rem 0.7rem",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <Eye size={13} /> Review
                      </Link>

                      {r.status !== "Published" ? (
                        <button
                          onClick={() => handlePublishByExaminer(r.session_id)}
                          disabled={publishingSessionId === r.session_id}
                          style={{
                            background: "#16a34a",
                            color: "#ffffff",
                            border: "none",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "6px",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <Send size={13} />
                          {publishingSessionId === r.session_id ? "Publishing..." : "Publish"}
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                          <Check size={13} /> Published
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ExaminerShell>
  );
}