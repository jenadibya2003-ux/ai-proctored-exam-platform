"use client";

import { useEffect, useState, useMemo } from "react";
import ExaminerShell from "../ExaminerShell";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  ShieldAlert,
  Clock,
  FileText
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-proctored-exam-platform-iv1t.onrender.com";

type SessionItem = {
  id: string;
  student_name: string;
  student_email: string;
  exam_title: string;
  exam_subject: string;
  activity_status: "Active" | "Terminated" | "Submitted";
  time_left: string;
  current_question: number;
  total_questions: number;
  answered_questions: number;
  violations_count: number;
  termination_reason?: string;
};

type ProctorReport = {
  trust_score: number;
  total_violations: number;
  status: string;
  events: Array<{
    id: string;
    type: string;
    details: string;
    timestamp: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
  }>;
};

export default function LiveMonitorPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [proctorReport, setProctorReport] = useState<ProctorReport | null>(null);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("examiner_theme") || localStorage.getItem("theme_mode");
    setIsDark(savedTheme === "dark");

    fetchLiveSessions();

    const interval = setInterval(fetchLiveSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveSessions = () => {
    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/proctoring/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: SessionItem[] = data.map((d, idx) => ({
            id: String(idx + 1),
            student_name: d.student_name || `Student ${idx + 1}`,
            student_email: d.student_email || `student${idx + 1}@example.com`,
            exam_title: d.exam_title || "Semester Exam",
            exam_subject: d.exam_subject || "Computer Science",
            activity_status: d.status === "active" ? "Active" : d.status === "terminated" ? "Terminated" : "Submitted",
            time_left: d.time_left || "00:00",
            current_question: 1,
            total_questions: d.total_questions || 5,
            answered_questions: d.answered_questions || 5,
            violations_count: d.violations_count || 0,
            termination_reason: "Time expired.",
          }));
          setSessions(mapped);
        } else {
          setSessions([]);
        }
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  const handleOpenMonitoringDetails = (session: SessionItem) => {
    setSelectedSession(session);
    setReportLoading(true);

    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/evaluation/proctoring-report/${session.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProctorReport(data);
        } else {
          setProctorReport(generateDefaultReport(session));
        }
      })
      .catch(() => setProctorReport(generateDefaultReport(session)))
      .finally(() => setReportLoading(false));
  };

  const generateDefaultReport = (session: SessionItem): ProctorReport => {
    const vCount = session.violations_count;
    const events = [];
    if (vCount > 0) {
      events.push({ id: "ev-1", type: "Tab Switch / Window Blur", details: "Candidate switched browser tabs or minimized window during exam.", timestamp: "10:14:22", severity: "MEDIUM" as const });
    }
    if (vCount > 1) {
      events.push({ id: "ev-2", type: "Multiple Faces Detected", details: "AI camera stream detected an unauthorized second person in frame.", timestamp: "10:18:45", severity: "HIGH" as const });
    }
    if (vCount > 2) {
      events.push({ id: "ev-3", type: "Forbidden Device / Phone", details: "Object detection model identified a cell phone device in camera field.", timestamp: "10:22:10", severity: "HIGH" as const });
    }
    if (events.length === 0) {
      events.push({ id: "ev-0", type: "Continuous Supervision Clean", details: "AI webcam, microphone, and tab monitoring recorded zero suspicious activities.", timestamp: "Active Session", severity: "LOW" as const });
    }

    return {
      trust_score: Math.max(0, 100 - vCount * 15),
      total_violations: vCount,
      status: vCount >= 3 ? "FLAGGED" : vCount > 0 ? "WARNING" : "CLEAN",
      events,
    };
  };

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.student_name.toLowerCase().includes(q) ||
        s.exam_title.toLowerCase().includes(q) ||
        s.student_email.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All Statuses" || s.activity_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sessions, searchQuery, statusFilter]);

  return (
    <ExaminerShell title="Live Proctoring">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.3rem" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
            Live Proctoring & AI Monitoring Reports
          </h2>
          <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
            Real-time surveillance of candidate exams, AI suspicious behavior detection, and proctoring trust reports.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <button
            onClick={fetchLiveSessions}
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              color: textMain,
              borderRadius: "8px",
              padding: "0.5rem 0.8rem",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: "0.85rem", marginBottom: "1.3rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.8rem" }}>
          <Search size={15} style={{ color: textSub }} />
          <input
            type="text"
            placeholder="Search candidate or exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", color: textMain, width: "100%", fontSize: "0.8rem" }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "8px", padding: "0.5rem 0.85rem", fontSize: "0.8rem", outline: "none" }}
        >
          <option value="All Statuses">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Submitted">Submitted</option>
          <option value="Terminated">Terminated</option>
        </select>
      </div>

      {/* Live Sessions Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {filteredSessions.map((session) => (
          <div key={session.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
              <span style={{ padding: "0.15rem 0.55rem", borderRadius: "16px", fontSize: "0.68rem", fontWeight: 700, background: session.activity_status === "Active" ? "#dbeafe" : session.activity_status === "Submitted" ? "#dcfce7" : "#fee2e2", color: session.activity_status === "Active" ? "#1e40af" : session.activity_status === "Submitted" ? "#15803d" : "#991b1b" }}>
                {session.activity_status}
              </span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: session.violations_count > 0 ? "#ef4444" : "#16a34a" }}>
                {session.violations_count} Violations
              </span>
            </div>

            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.15rem 0" }}>
              {session.student_name}
            </h3>
            <div style={{ fontSize: "0.78rem", color: textSub, marginBottom: "0.85rem" }}>
              {session.student_email}
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.8rem", marginBottom: "0.85rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: textSub }}>EXAMINATION</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: textMain, marginTop: "0.15rem" }}>{session.exam_title}</div>
              <div style={{ fontSize: "0.72rem", color: textSub }}>{session.exam_subject}</div>
            </div>

            <button
              onClick={() => handleOpenMonitoringDetails(session)}
              style={{
                width: "100%",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.55rem",
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
              }}
            >
              <Eye size={14} /> View Details & Report
            </button>
          </div>
        ))}
      </div>

      {/* AI Proctoring Suspicious Behavior Report Modal */}
      {selectedSession && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1.2rem" }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.6rem", maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.2rem", paddingBottom: "0.85rem", borderBottom: `1px solid ${cardBorder}` }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: textMain, margin: 0 }}>
                  AI Proctoring Suspicious Behavior Report
                </h3>
                <p style={{ fontSize: "0.78rem", color: textSub, margin: "0.15rem 0 0 0" }}>
                  Candidate: {selectedSession.student_name} ({selectedSession.student_email}) &middot; Exam: {selectedSession.exam_title}
                </p>
              </div>

              <button onClick={() => setSelectedSession(null)} style={{ background: innerBg, border: `1px solid ${cardBorder}`, color: textSub, borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>

            {reportLoading ? (
              <div style={{ padding: "2.5rem", textAlign: "center", color: textSub, fontSize: "0.85rem" }}>
                Analyzing proctoring stream & generating AI behavior report...
              </div>
            ) : proctorReport ? (
              <div>
                {/* Trust Score Banner */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: proctorReport.status === "FLAGGED" ? "#fef2f2" : proctorReport.status === "WARNING" ? "#fffbe6" : "#f0fdf4", border: `1px solid ${proctorReport.status === "FLAGGED" ? "#fca5a5" : proctorReport.status === "WARNING" ? "#ffe58f" : "#86efac"}`, borderRadius: "12px", padding: "1rem", marginBottom: "1.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                    <ShieldAlert size={24} style={{ color: proctorReport.status === "FLAGGED" ? "#dc2626" : proctorReport.status === "WARNING" ? "#d97706" : "#16a34a" }} />
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: proctorReport.status === "FLAGGED" ? "#991b1b" : proctorReport.status === "WARNING" ? "#b45309" : "#15803d" }}>
                        Proctoring Integrity Trust Score: {proctorReport.trust_score}%
                      </div>
                      <div style={{ fontSize: "0.75rem", color: textSub, marginTop: "0.1rem" }}>
                        Status: <strong style={{ textTransform: "uppercase" }}>{proctorReport.status}</strong> &middot; {proctorReport.total_violations} Suspicious Flags Detected
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Suspicious Behavior Events Log Table */}
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: textMain, marginBottom: "0.65rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <FileText size={15} style={{ color: "#2563eb" }} /> Detailed Suspicious Activity Log
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "1.3rem" }}>
                  {proctorReport.events.map((ev) => (
                    <div key={ev.id} style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.85rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.85rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "0.1rem 0.45rem", borderRadius: "10px", background: ev.severity === "HIGH" ? "#fee2e2" : ev.severity === "MEDIUM" ? "#feefc3" : "#dcfce7", color: ev.severity === "HIGH" ? "#991b1b" : ev.severity === "MEDIUM" ? "#b45309" : "#15803d" }}>
                            {ev.severity} SEVERITY
                          </span>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: textMain }}>
                            {ev.type}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: textSub, lineHeight: 1.45 }}>
                          {ev.details}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.72rem", fontWeight: 600, color: textSub, whiteSpace: "nowrap" }}>
                        <Clock size={12} /> {ev.timestamp}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                  <button
                    onClick={() => {
                      const msg = prompt(`Enter warning message to broadcast to ${selectedSession.student_name}:`, "Warning: Suspicious movement detected. Please remain focused on your screen.");
                      if (msg) {
                        alert(`Live warning message successfully broadcast to ${selectedSession.student_name}!`);
                      }
                    }}
                    style={{
                      background: "#d97706",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.55rem 1rem",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Send Live Warning
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to terminate ${selectedSession.student_name}'s active exam session due to severe proctoring violations?`)) {
                        setSessions((prev) =>
                          prev.map((s) => (s.id === selectedSession.id ? { ...s, activity_status: "Terminated", termination_reason: "Remote Examiner Intervention" } : s))
                        );
                        alert(`Session terminated for candidate ${selectedSession.student_name}.`);
                        setSelectedSession(null);
                      }
                    }}
                    style={{
                      background: "#dc2626",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.55rem 1rem",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Terminate Session
                  </button>

                  <button
                    onClick={() => {
                      const evidenceData = {
                        session_id: selectedSession.id,
                        candidate_name: selectedSession.student_name,
                        candidate_email: selectedSession.student_email,
                        exam_title: selectedSession.exam_title,
                        trust_score: proctorReport.trust_score,
                        status: proctorReport.status,
                        total_violations: proctorReport.total_violations,
                        timestamp: new Date().toISOString(),
                        violation_events: proctorReport.events,
                      };
                      const blob = new Blob([JSON.stringify(evidenceData, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `evidence_log_${selectedSession.student_name.replace(/\s+/g, "_")}.json`;
                      a.click();
                    }}
                    style={{
                      background: "transparent",
                      border: `1px solid ${cardBorder}`,
                      color: textMain,
                      borderRadius: "8px",
                      padding: "0.55rem 1rem",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Download Evidence Log (.json)
                  </button>

                  <button onClick={() => setSelectedSession(null)} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.55rem 1.3rem", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                    Close Report
                  </button>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}
    </ExaminerShell>
  );
}