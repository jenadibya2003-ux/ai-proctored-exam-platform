"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ExaminerShell from "../../ExaminerShell";
import { ArrowLeft, ShieldAlert, CheckCircle2, XCircle, Download } from "lucide-react";

type ProctorEvent = {
  id: string;
  event_type: string;
  detail: Record<string, unknown> | null;
  timestamp: string;
};

type FlaggedSession = {
  session_id: string;
  exam_title: string;
  student_name: string;
  student_email: string;
  suspicion_score: number;
  review_status: string;
  review_note: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-proctored-exam-platform-iv1t.onrender.com";

const EVENT_LABELS: Record<string, string> = {
  tab_switch: "Tab switch",
  face_absent: "Face not detected",
  multiple_faces: "Multiple faces detected",
  gaze_away: "Gaze away from screen",
};

export default function ProctoringReviewDetailPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<FlaggedSession | null>(null);
  const [events, setEvents] = useState<ProctorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("examiner_theme") || localStorage.getItem("theme_mode");
    setIsDark(savedTheme === "dark");

    async function load() {
      const token = localStorage.getItem("access_token") || "";
      if (!token) {
        setError("Please sign in first.");
        setLoading(false);
        return;
      }
      try {
        const [sessionsRes, eventsRes] = await Promise.all([
          fetch(`${API_BASE}/proctoring/flagged-sessions`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/proctoring/events/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!sessionsRes.ok || !eventsRes.ok) throw new Error();

        const sessionsData: FlaggedSession[] = await sessionsRes.json();
        const match = sessionsData.find((s) => s.session_id === sessionId) || null;
        setSession(match);
        setNote(match?.review_note || "");

        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      } catch {
        setError("Could not load this session's details.");
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) load();
  }, [sessionId]);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  async function submitDecision(decision: "confirmed" | "dismissed") {
    setSubmitting(true);
    const token = localStorage.getItem("access_token") || "";
    try {
      const res = await fetch(`${API_BASE}/proctoring/review/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, note }),
      });
      if (!res.ok) throw new Error();
      setSession((prev) => (prev ? { ...prev, review_status: decision, review_note: note } : prev));
    } catch {
      setError("Could not submit your review decision.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <ExaminerShell title="Session Review">
        <div style={{ color: textSub, padding: "2rem", textAlign: "center", fontSize: "0.85rem" }}>Loading session details...</div>
      </ExaminerShell>
    );
  }

  const handleDownloadEvidenceLog = () => {
    if (events.length === 0) {
      alert("No proctoring events recorded for this session.");
      return;
    }

    const payload = {
      session_id: sessionId,
      candidate_name: session?.student_name,
      candidate_email: session?.student_email,
      exam_title: session?.exam_title,
      suspicion_score: session?.suspicion_score,
      total_violations: events.length,
      downloaded_at: new Date().toISOString(),
      events: events.map((e) => ({
        event_type: e.event_type,
        label: EVENT_LABELS[e.event_type] || e.event_type,
        timestamp: e.timestamp,
        formatted_time: new Date(e.timestamp).toLocaleTimeString(),
        details: e.detail,
      })),
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `proctoring_evidence_${session?.student_name || "session"}_${sessionId.slice(0, 8)}.json`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
  };

  return (
    <ExaminerShell title="Session Review">
      <div style={{ marginBottom: "1.3rem" }}>
        <Link href="/examiner/proctoring" style={{ color: "#2563eb", textDecoration: "none", fontSize: "0.78rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.5rem" }}>
          <ArrowLeft size={14} /> Back to proctoring list
        </Link>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
          Candidate Proctoring Audit Log
        </h2>
        {session && (
          <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
            {session.student_name} ({session.student_email}) • {session.exam_title}
          </p>
        )}
      </div>

      {error ? (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "0.75rem 1.1rem", borderRadius: "10px", marginBottom: "1.3rem", fontSize: "0.82rem", fontWeight: 600 }}>
          {error}
        </div>
      ) : null}

      {session && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.2rem" }}>
          {/* Left Events Stream */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.3rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: 0 }}>
                Detected Behavior Events ({events.length})
              </h3>

              <button
                onClick={handleDownloadEvidenceLog}
                style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.45rem 0.85rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
              >
                <Download size={13} /> Download Evidence Log
              </button>
            </div>

            {events.length === 0 ? (
              <div style={{ color: textSub, fontSize: "0.8rem", padding: "1.5rem", textAlign: "center", border: `1px dashed ${cardBorder}`, borderRadius: "10px" }}>
                No proctoring violation events recorded.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {events.map((e) => (
                  <div key={e.id} style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.75rem 0.9rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.82rem", color: textMain }}>
                        {EVENT_LABELS[e.event_type] || e.event_type}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: textSub, marginTop: "0.15rem" }}>
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#fee2e2", color: "#991b1b", padding: "0.15rem 0.5rem", borderRadius: "10px" }}>
                      FLAGGED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Examiner Decision Box */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.3rem", height: "fit-content" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.85rem 0" }}>
              Review Decision
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.72rem", color: textSub, fontWeight: 600 }}>CURRENT STATUS</div>
              <span style={{ display: "inline-block", marginTop: "0.25rem", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700, background: session.review_status === "confirmed" ? "#fee2e2" : session.review_status === "dismissed" ? "#dcfce7" : "#fef3c7", color: session.review_status === "confirmed" ? "#991b1b" : session.review_status === "dismissed" ? "#15803d" : "#92400e" }}>
                {session.review_status}
              </span>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: textSub, marginBottom: "0.35rem" }}>
                Examiner Review Notes
              </label>
              <textarea
                rows={3}
                placeholder="Enter notes on decision rationale..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.6rem", color: textMain, fontSize: "0.78rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                onClick={() => submitDecision("confirmed")}
                disabled={submitting}
                style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.55rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
              >
                <ShieldAlert size={14} /> Confirm Violation
              </button>

              <button
                onClick={() => submitDecision("dismissed")}
                disabled={submitting}
                style={{ background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.55rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
              >
                <CheckCircle2 size={14} /> Dismiss Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </ExaminerShell>
  );
}