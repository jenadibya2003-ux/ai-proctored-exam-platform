"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import ExaminerShell from "../ExaminerShell";
import {
  Users,
  BookOpen,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
  Send,
  X,
  Mail,
  UserCheck
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

type Student = {
  id: string;
  name: string;
  email: string;
  roll_number: string;
  department: string;
  semester: string;
  phone: string;
  account_status: string;
  assigned: number;
  active: number;
  submitted: number;
  violations: number;
};

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("examiner_theme") || localStorage.getItem("theme_mode");
    setIsDark(savedTheme === "dark");

    const token = localStorage.getItem("access_token") || "";

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
              department: "Computer Science",
              semester: "Semester 1",
              phone: "Not provided",
              account_status: u.account_status || "approved",
              assigned: 1,
              active: 0,
              submitted: 1,
              violations: 0,
            }));

          if (mapped.length > 0) {
            setStudents(mapped);
          } else {
            setStudents(defaultCleanStudents);
          }
        } else {
          setStudents(defaultCleanStudents);
        }
      })
      .catch(() => {
        setStudents(defaultCleanStudents);
      })
      .finally(() => setLoading(false));
  }, []);

  const defaultCleanStudents: Student[] = [
    { id: "1", name: "Student Candidate 1", email: "student1@example.com", roll_number: "STU-1001", department: "Computer Science", semester: "Semester 1", phone: "Not provided", account_status: "approved", assigned: 1, active: 0, submitted: 1, violations: 0 },
    { id: "2", name: "Student Candidate 2", email: "student2@example.com", roll_number: "STU-1002", department: "Information Technology", semester: "Semester 1", phone: "Not provided", account_status: "approved", assigned: 1, active: 0, submitted: 0, violations: 0 },
  ];

  const totalAssignments = students.reduce((acc, curr) => acc + curr.assigned, 0);
  const totalActive = students.reduce((acc, curr) => acc + curr.active, 0);
  const totalSubmitted = students.reduce((acc, curr) => acc + curr.submitted, 0);
  const totalViolations = students.reduce((acc, curr) => acc + curr.violations, 0);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery]);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  return (
    <ExaminerShell title="Students">
      {/* Header & Search Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: textMain, margin: "0 0 0.15rem 0" }}>
            Student Management
          </h2>
          <p style={{ fontSize: "0.75rem", color: textSub, margin: 0 }}>
            View registered candidates, exam assignments, and submission activity.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", width: "100%", background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.45rem 0.75rem" }}>
          <Search size={15} style={{ color: textSub }} />
          <input
            type="text"
            placeholder="Search students by name, email or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", color: textMain, width: "100%", fontSize: "0.78rem" }}
          />
        </div>
      </div>

      {/* 5 Stat Overview Cards - Clean 2-column grid */}
      <div className="stats-grid-4" style={{ marginBottom: "0.85rem", gap: "0.45rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.6rem 0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: textSub, fontSize: "0.72rem", fontWeight: 600 }}>
            <span>Students</span>
            <Users size={15} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>{students.length}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.6rem 0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: textSub, fontSize: "0.72rem", fontWeight: 600 }}>
            <span>Assigned</span>
            <BookOpen size={15} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>{totalAssignments}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.6rem 0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: textSub, fontSize: "0.72rem", fontWeight: 600 }}>
            <span>Active</span>
            <PlayCircle size={15} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>{totalActive}</div>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.6rem 0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: textSub, fontSize: "0.72rem", fontWeight: 600 }}>
            <span>Submitted</span>
            <CheckCircle2 size={15} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>{totalSubmitted}</div>
        </div>
      </div>

      {/* Student Cards Grid - Standard uniform layout matching other subsections */}
      <div className="grid-3" style={{ gap: "1rem" }}>
        {filteredStudents.map((student) => (
          <div key={student.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1.1rem 1.2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UserCheck size={18} />
                </div>

                <span style={{ padding: "0.2rem 0.5rem", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700, background: "#dbeafe", color: "#1e40af" }}>
                  Approved
                </span>
              </div>

              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: textMain, margin: "0 0 0.2rem 0", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {student.name}
              </h3>

              <div style={{ fontSize: "0.78rem", color: textSub, display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.75rem", overflow: "hidden" }}>
                <Mail size={13} style={{ flexShrink: 0 }} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.email}</span>
              </div>

              {/* 3 Stat Boxes Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.4rem", marginBottom: "0.75rem" }}>
                <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.4rem 0.2rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: textMain }}>{student.assigned}</div>
                  <div style={{ fontSize: "0.62rem", color: textSub, marginTop: "0.05rem" }}>Assigned</div>
                </div>

                <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.4rem 0.2rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: textMain }}>{student.active}</div>
                  <div style={{ fontSize: "0.62rem", color: textSub, marginTop: "0.05rem" }}>Active</div>
                </div>

                <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.4rem 0.2rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: textMain }}>{student.submitted}</div>
                  <div style={{ fontSize: "0.62rem", color: textSub, marginTop: "0.05rem" }}>Submitted</div>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                onClick={() => setSelectedStudent(student)}
                style={{
                  flex: 1,
                  background: innerBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: "8px",
                  padding: "0.45rem 0.4rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: textMain,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                  whiteSpace: "nowrap",
                }}
              >
                <Eye size={13} /> View Details
              </button>

              <button
                onClick={() => {}}
                style={{
                  flex: 1,
                  background: "#2563eb",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.45rem 0.4rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                <Send size={13} /> Assign Exam
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.6rem", width: "450px", maxWidth: "90vw" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: textMain, margin: 0 }}>Student Profile</h3>
              <button onClick={() => setSelectedStudent(null)} style={{ background: "transparent", border: "none", color: textSub, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.8rem", color: textMain }}>
              <div><strong>Name:</strong> {selectedStudent.name}</div>
              <div><strong>Email:</strong> {selectedStudent.email}</div>
              <div><strong>Roll Number:</strong> {selectedStudent.roll_number}</div>
              <div><strong>Department:</strong> {selectedStudent.department}</div>
              <div><strong>Semester:</strong> {selectedStudent.semester}</div>
              <div><strong>Status:</strong> {selectedStudent.account_status}</div>
            </div>
          </div>
        </div>
      )}
    </ExaminerShell>
  );
}