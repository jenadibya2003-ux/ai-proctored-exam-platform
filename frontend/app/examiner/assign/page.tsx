"use client";

import { useEffect, useState, useMemo } from "react";
import ExaminerShell from "../ExaminerShell";
import {
  FileText,
  Users,
  Clock,
  CheckCircle2,
  Search
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

type Exam = {
  id: string;
  title: string;
  subject: string;
  status: "Draft" | "Published" | "Active" | "Completed";
  duration_minutes: number;
  start_time: string;
  assignedCount: number;
  submittedCount: number;
};

type Student = {
  id: string;
  name: string;
  email: string;
  roll_number: string;
  department: string;
};

export default function AssignExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("1");
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [searchExams, setSearchExams] = useState("");
  const [searchStudents, setSearchStudents] = useState("");
  const [examTab, setExamTab] = useState<"All Exams" | "Published" | "Active" | "Completed">("All Exams");
  const [studentTab, setStudentTab] = useState<"available" | "assigned">("available");
  const [successNotice, setSuccessNotice] = useState("");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("examiner_theme") || localStorage.getItem("theme_mode");
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
            subject: e.subject || "Multiple Subjects",
            status: (e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : "Published") as Exam["status"],
            duration_minutes: e.duration_minutes || 17,
            start_time: "23/7/2026",
            assignedCount: 0,
            submittedCount: 0,
          }));
          setExams(mapped);
          setSelectedExamId(mapped[0].id);
        } else {
          setExams([]);
        }
      })
      .catch(() => setExams([]));

    fetch(`${API_BASE}/students/admin/all-users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: Student[] = data
            .filter((u) => u.role === "student" || !u.role)
            .map((u, idx) => ({
              id: u.id,
              name: u.full_name || `Student ${idx + 1}`,
              email: u.email,
              roll_number: u.roll_number || `STU-${1000 + idx + 1}`,
              department: "Department not set",
            }));
          setStudents(mapped);
        } else {
          setStudents([]);
        }
      })
      .catch(() => setStudents([]));
  }, []);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const selectedExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId) || exams[0];
  }, [exams, selectedExamId]);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const q = searchExams.toLowerCase().trim();
      const matchesQuery = !q || e.title.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q);
      const matchesTab = examTab === "All Exams" || e.status === examTab;
      return matchesQuery && matchesTab;
    });
  }, [exams, searchExams, examTab]);

  const filteredAvailableStudents = useMemo(() => {
    return students.filter((s) => {
      const isAssigned = assignedStudentIds.includes(s.id);
      if (studentTab === "assigned") return isAssigned;
      const q = searchStudents.toLowerCase().trim();
      const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q);
      return !isAssigned && matchesQuery;
    });
  }, [students, assignedStudentIds, studentTab, searchStudents]);

  // Fetch assigned students when selectedExamId changes
  useEffect(() => {
    if (!selectedExamId) return;
    const token = localStorage.getItem("access_token") || "";
    fetch(`${API_BASE}/exams/${selectedExamId}/assigned-students`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: string[]) => {
        if (Array.isArray(data)) setAssignedStudentIds(data);
      })
      .catch(() => {});
  }, [selectedExamId]);

  const handleToggleAssignStudent = async (id: string) => {
    let next: string[];
    if (assignedStudentIds.includes(id)) {
      next = assignedStudentIds.filter((sid) => sid !== id);
    } else {
      next = [...assignedStudentIds, id];
    }
    setAssignedStudentIds(next);

    const token = localStorage.getItem("access_token") || "";
    try {
      await fetch(`${API_BASE}/exams/${selectedExamId}/assign-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_ids: next }),
      });
      setSuccessNotice(`Updated student assignment successfully!`);
      setTimeout(() => setSuccessNotice(""), 2500);
    } catch {}
  };

  const handleAssignEntireGroup = async () => {
    const allIds = students.map((s) => s.id);
    setAssignedStudentIds(allIds);

    const token = localStorage.getItem("access_token") || "";
    try {
      await fetch(`${API_BASE}/exams/${selectedExamId}/assign-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_ids: allIds }),
      });
      setSuccessNotice(`Assigned exam to entire student group (${allIds.length} students)!`);
      setTimeout(() => setSuccessNotice(""), 3000);
    } catch {}
  };

  return (
    <ExaminerShell title="Assign Exams">
      <div style={{ marginBottom: "1.3rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
          Exam Assignments
        </h2>
        <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
          Select an examination and assign it to approved students.
        </p>
      </div>

      {successNotice && (
        <div style={{ background: "#dcfce7", border: "1px solid #16a34a", color: "#15803d", padding: "0.7rem 1rem", borderRadius: "8px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.82rem" }}>
          <CheckCircle2 size={16} /> {successNotice}
        </div>
      )}

      {/* 4 Stat Overview Cards */}
      <div className="stats-grid-4" style={{ marginBottom: "0.85rem", gap: "0.45rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.6rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: textSub, fontWeight: 600 }}>My Exams</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.1rem" }}>{exams.length}</div>
          </div>
          <FileText size={16} style={{ color: "#2563eb" }} />
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.6rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: textSub, fontWeight: 600 }}>Assignments</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.1rem" }}>{assignedStudentIds.length}</div>
          </div>
          <Users size={16} style={{ color: "#2563eb" }} />
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.6rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: textSub, fontWeight: 600 }}>Started</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.1rem" }}>0</div>
          </div>
          <Clock size={16} style={{ color: "#2563eb" }} />
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.6rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: textSub, fontWeight: 600 }}>Submitted</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.1rem" }}>1</div>
          </div>
          <CheckCircle2 size={16} style={{ color: "#2563eb" }} />
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid-2" style={{ gap: "0.75rem" }}>
        {/* Left Panel */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.85rem 0.95rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: textMain, margin: "0 0 0.1rem 0" }}>Select Examination</h3>
          <p style={{ fontSize: "0.72rem", color: textSub, margin: "0 0 0.65rem 0" }}>Choose the exam that you want to assign.</p>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.45rem 0.75rem", marginBottom: "0.65rem" }}>
            <Search size={14} style={{ color: textSub }} />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchExams}
              onChange={(e) => setSearchExams(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: textMain, width: "100%", fontSize: "0.78rem" }}
            />
          </div>

          {/* 2 Side-by-Side Columns for Exam List */}
          <div className="grid-cards-2col" style={{ gap: "0.45rem" }}>
            {filteredExams.map((e) => {
              const isSelected = selectedExam?.id === e.id;
              return (
                <div
                  key={e.id}
                  onClick={() => setSelectedExamId(e.id)}
                  style={{
                    background: innerBg,
                    border: isSelected ? "2px solid #2563eb" : `1px solid ${cardBorder}`,
                    borderRadius: "8px",
                    padding: "0.65rem 0.75rem",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "78px",
                    boxSizing: "border-box",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.25rem", gap: "0.25rem", flexWrap: "wrap" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: textMain, wordBreak: "break-word", lineHeight: 1.25, minWidth: 0, flex: 1 }}>{e.title}</div>
                      <span style={{ padding: "0.1rem 0.35rem", borderRadius: "8px", fontSize: "0.58rem", fontWeight: 700, background: "#dbeafe", color: "#1e40af", flexShrink: 0, marginTop: "0.05rem" }}>
                        {e.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.subject}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.85rem 0.95rem", minWidth: 0 }}>
          {selectedExam && (
            <>
              <h3 style={{ fontSize: "0.88rem", fontWeight: 800, color: textMain, margin: "0 0 0.1rem 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedExam.title}
              </h3>
              <p style={{ fontSize: "0.68rem", color: textSub, margin: "0 0 0.5rem 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedExam.subject}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.55rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.35rem 0.55rem" }}>
                  <Search size={13} style={{ color: textSub, flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchStudents}
                    onChange={(e) => setSearchStudents(e.target.value)}
                    style={{ background: "transparent", border: "none", outline: "none", color: textMain, width: "100%", fontSize: "0.72rem" }}
                  />
                </div>

                <button
                  onClick={handleAssignEntireGroup}
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "0.35rem 0.45rem", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", width: "100%", whiteSpace: "nowrap" }}
                >
                  <Users size={13} /> Assign All
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {filteredAvailableStudents.map((student) => {
                  const isAssigned = assignedStudentIds.includes(student.id);
                  return (
                    <div key={student.id} style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.45rem 0.55rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.25rem" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.72rem", color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.name}</div>
                        <div style={{ fontSize: "0.62rem", color: textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.email}</div>
                      </div>

                      <button
                        onClick={() => handleToggleAssignStudent(student.id)}
                        style={{
                          background: isAssigned ? "#16a34a" : "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "0.25rem 0.45rem",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        {isAssigned ? "Done" : "Assign"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </ExaminerShell>
  );
}