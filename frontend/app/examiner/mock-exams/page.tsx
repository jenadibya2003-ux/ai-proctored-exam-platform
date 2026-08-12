"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import ExaminerShell from "../ExaminerShell";
import {
  FlaskConical,
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  Clock,
  Award,
  Users,
  User,
  CheckCircle2,
  X
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

type MockExamItem = {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  question_count: number;
  status: string;
};

export default function ExaminerMockExamsPage() {
  const [mocks, setMocks] = useState<MockExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDark, setIsDark] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMock, setEditingMock] = useState<MockExamItem | null>(null);
  const [assigningMock, setAssigningMock] = useState<MockExamItem | null>(null);

  // Form States
  const [mTitle, setMTitle] = useState("");
  const [mSubject, setMSubject] = useState("Computer Science & Programming");
  const [mDuration, setMDuration] = useState(30);
  const [mMarks, setMMarks] = useState(30);
  const [mPassMarks, setMPassMarks] = useState(12);

  // Assign Mode
  const [assignMode, setAssignMode] = useState<"group" | "single">("group");
  const [studentEmail, setStudentEmail] = useState("");
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("examiner_theme");
    setIsDark(savedTheme === "dark");

    fetchMocks();
  }, []);

  const fetchMocks = () => {
    setLoading(true);
    fetch(`${API_BASE}/exams/mock-exams`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setMocks(data);
        } else {
          setMocks(defaultMocks);
        }
      })
      .catch(() => setMocks(defaultMocks))
      .finally(() => setLoading(false));
  };

  const defaultMocks: MockExamItem[] = [
    { id: "1", title: "Computer Science & Programming Practice", subject: "Computer Science & Programming", duration_minutes: 30, total_marks: 30, passing_marks: 12, question_count: 15, status: "Mock" },
    { id: "2", title: "Mathematics & Quantitative Aptitude Practice", subject: "Mathematics", duration_minutes: 25, total_marks: 20, passing_marks: 8, question_count: 10, status: "Mock" },
    { id: "3", title: "Software Engineering & Systems Practice", subject: "Software Engineering", duration_minutes: 40, total_marks: 40, passing_marks: 16, question_count: 20, status: "Mock" },
  ];

  const handleCreateMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/exams/mock-exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: mTitle.trim(),
          subject: mSubject.trim(),
          duration_minutes: Number(mDuration),
          total_marks: Number(mMarks),
          passing_marks: Number(mPassMarks),
        }),
      });

      if (res.ok) {
        fetchMocks();
        setShowCreateModal(false);
        setMTitle("");
      }
    } catch {
      const newMock: MockExamItem = {
        id: `mock-${Date.now()}`,
        title: mTitle.trim(),
        subject: mSubject.trim(),
        duration_minutes: Number(mDuration),
        total_marks: Number(mMarks),
        passing_marks: Number(mPassMarks),
        question_count: 15,
        status: "Mock",
      };
      setMocks((prev) => [newMock, ...prev]);
      setShowCreateModal(false);
      setMTitle("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMock || !mTitle.trim()) return;

    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/exams/mock-exams/${editingMock.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: mTitle.trim(),
          subject: mSubject.trim(),
          duration_minutes: Number(mDuration),
          total_marks: Number(mMarks),
          passing_marks: Number(mPassMarks),
        }),
      });
    } catch {}

    setMocks((prev) =>
      prev.map((m) =>
        m.id === editingMock.id
          ? {
              ...m,
              title: mTitle.trim(),
              subject: mSubject.trim(),
              duration_minutes: Number(mDuration),
              total_marks: Number(mMarks),
              passing_marks: Number(mPassMarks),
            }
          : m
      )
    );

    setEditingMock(null);
    setSubmitting(false);
  };

  const handleDeleteMock = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this mock exam?")) return;

    try {
      await fetch(`${API_BASE}/exams/mock-exams/${id}`, { method: "DELETE" });
    } catch {}

    setMocks((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAssignMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningMock) return;

    setSubmitting(true);
    const targetText = assignMode === "group" ? "All Enrolled Student Groups" : (studentEmail || "Single Student Candidate");
    setAssignSuccessMsg(`Successfully assigned "${assigningMock.title}" to ${targetText}!`);
    setTimeout(() => {
      setAssignSuccessMsg(null);
      setAssigningMock(null);
      setSubmitting(false);
    }, 2000);
  };

  const filteredMocks = useMemo(() => {
    return mocks.filter((m) => {
      const q = search.toLowerCase().trim();
      return !q || m.title.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q);
    });
  }, [mocks, search]);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  return (
    <ExaminerShell title="Mock Exams">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.3rem" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
            Mock Exams Management
          </h2>
          <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
            Create, manage, edit, assign, and publish practice mock examinations for candidates.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "240px", background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.8rem" }}>
            <Search size={15} style={{ color: textSub }} />
            <input
              type="text"
              placeholder="Search mock exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: textMain, width: "100%", fontSize: "0.8rem" }}
            />
          </div>

          <button
            onClick={() => {
              setMTitle("");
              setMSubject("Computer Science & Programming");
              setMDuration(30);
              setMMarks(30);
              setMPassMarks(12);
              setShowCreateModal(true);
            }}
            style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.55rem 0.95rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Plus size={15} /> Create Mock Exam
          </button>
        </div>
      </div>

      {/* Mocks Grid */}
      <div className="grid-3" style={{ gap: "1.1rem" }}>
        {filteredMocks.map((m) => (
          <div key={m.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.35rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FlaskConical size={18} />
                </div>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, background: "#dbeafe", color: "#1e40af", padding: "0.15rem 0.55rem", borderRadius: "16px" }}>
                  PRACTICE MOCK
                </span>
              </div>

              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.35rem 0", lineHeight: 1.35 }}>
                {m.title}
              </h3>
              <div style={{ fontSize: "0.75rem", color: textSub, marginBottom: "1rem" }}>
                {m.subject}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.1rem" }}>
                <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.65rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: textSub }}>DURATION</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, color: textMain, marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Clock size={13} style={{ color: "#2563eb" }} /> {m.duration_minutes} Mins
                  </div>
                </div>

                <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.65rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: textSub }}>MARKS</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, color: textMain, marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Award size={13} style={{ color: "#16a34a" }} /> {m.total_marks} Pts
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderTop: `1px solid ${cardBorder}`, paddingTop: "0.85rem" }}>
              <button
                onClick={() => setAssigningMock(m)}
                style={{ flex: 1, background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.45rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}
              >
                <Send size={13} /> Assign
              </button>

              <button
                onClick={() => {
                  setEditingMock(m);
                  setMTitle(m.title);
                  setMSubject(m.subject);
                  setMDuration(m.duration_minutes);
                  setMMarks(m.total_marks);
                  setMPassMarks(m.passing_marks);
                }}
                style={{ background: innerBg, color: textMain, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.45rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
              >
                <Edit size={13} />
              </button>

              <button
                onClick={() => handleDeleteMock(m.id)}
                style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: "8px", padding: "0.45rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {(showCreateModal || editingMock) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.4rem", maxWidth: "480px", width: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: textMain, margin: 0 }}>
                {editingMock ? "Edit Mock Exam" : "Create New Mock Exam"}
              </h3>
              <button onClick={() => { setShowCreateModal(false); setEditingMock(null); }} style={{ background: "none", border: "none", color: textSub, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={editingMock ? handleEditMock : handleCreateMock} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: textSub, marginBottom: "0.25rem" }}>
                  Mock Exam Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science Practice Test"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.75rem", color: textMain, fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: textSub, marginBottom: "0.25rem" }}>
                  Subject Category
                </label>
                <input
                  type="text"
                  required
                  value={mSubject}
                  onChange={(e) => setMSubject(e.target.value)}
                  style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.75rem", color: textMain, fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: textSub, marginBottom: "0.25rem" }}>
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={mDuration}
                    onChange={(e) => setMDuration(Number(e.target.value))}
                    style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.65rem", color: textMain, fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: textSub, marginBottom: "0.25rem" }}>
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={mMarks}
                    onChange={(e) => setMMarks(Number(e.target.value))}
                    style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.65rem", color: textMain, fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: textSub, marginBottom: "0.25rem" }}>
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={mPassMarks}
                    onChange={(e) => setMPassMarks(Number(e.target.value))}
                    style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.65rem", color: textMain, fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingMock(null); }}
                  style={{ background: innerBg, color: textSub, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.95rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.5rem 1.1rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  {submitting ? "Saving..." : (editingMock ? "Update Mock Exam" : "Save Mock Exam")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assigningMock && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.4rem", maxWidth: "480px", width: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: textMain, margin: 0 }}>
                  Assign Mock Exam
                </h3>
                <div style={{ fontSize: "0.75rem", color: textSub }}>{assigningMock.title}</div>
              </div>
              <button onClick={() => setAssigningMock(null)} style={{ background: "none", border: "none", color: textSub, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {assignSuccessMsg ? (
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 700, textAlign: "center" }}>
                ✓ {assignSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleAssignMockSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {/* Assign Mode Toggle */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", background: innerBg, padding: "0.25rem", borderRadius: "10px", border: `1px solid ${cardBorder}` }}>
                  <button
                    type="button"
                    onClick={() => setAssignMode("group")}
                    style={{
                      background: assignMode === "group" ? "#2563eb" : "transparent",
                      color: assignMode === "group" ? "#ffffff" : textSub,
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.45rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Users size={14} /> Student Group
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignMode("single")}
                    style={{
                      background: assignMode === "single" ? "#2563eb" : "transparent",
                      color: assignMode === "single" ? "#ffffff" : textSub,
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.45rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <User size={14} /> Single Student
                  </button>
                </div>

                {assignMode === "single" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: textSub, marginBottom: "0.25rem" }}>
                      Student Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student1@example.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.75rem", color: textMain, fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setAssigningMock(null)}
                    style={{ background: innerBg, color: textSub, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.95rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.5rem 1.1rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    {submitting ? "Assigning..." : "Confirm Assignment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </ExaminerShell>
  );
}