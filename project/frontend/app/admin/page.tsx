"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Overview = {
  active_sessions: number;
  exams_today: number;
  exams_completed_today: number;
  flagged_sessions: number;
  grading_queue: number;
  avg_score_percent: number;
  live_sessions: {
    student_name: string;
    exam_title: string;
    answered_count: number;
    suspicion_score: number;
    current_score: number;
  }[];
  upcoming_exams: { title: string; start_time: string }[];
};

const proctoringAlerts = [
  { title: "Multiple faces detected", who: "Sahil K. — Algorithms exam", when: "2 min ago", extra: "suspicion +26" },
  { title: "Tab switch ×4", who: "Rohan M. — ML Fundamentals", when: "7 min ago", extra: "suspicion +14" },
  { title: "Prolonged gaze away", who: "Vikram S. — Networks", when: "12 min ago", extra: "suspicion +10" },
  { title: "Face absent 18s", who: "Neha R. — DBMS", when: "19 min ago", extra: "auto-paused" },
];

const signalBreakdown = [
  { label: "Face present", value: 91 },
  { label: "Gaze on screen", value: 78 },
  { label: "No tab switches", value: 83 },
  { label: "Single face", value: 96 },
  { label: "High suspicion (>60)", value: 4 },
];

const gradingQueueDemo = [
  { text: "Explain virtual memory paging", detail: "8/10" },
  { text: "Analyse TCP/IP handshake", detail: "14/20" },
  { text: "B-tree insertion diagram", detail: "OCR" },
  { text: "Define normalisation forms", detail: "6/10" },
  { text: "Compare CNN vs RNN architectures", detail: "17/25" },
  { text: "ER diagram — library system", detail: "OCR" },
];

const recentActivity = [
  { text: "Priya K. submitted DBMS", when: "9 min" },
  { text: "Rohan M. tab-switch warning", when: "7 min" },
  { text: "AI scored 12 answers", when: "5 min" },
  { text: "3 new students entered", when: "2 min" },
];

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("access_token") || "";
      try {
        const res = await fetch(`${API_BASE}/exams/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: Overview = await res.json();
          setOverview(data);
        }
      } catch {
        // fall back to demo data silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const summaryCards = overview
    ? [
        { label: "Active Sessions", value: String(overview.active_sessions), trend: "Live count" },
        { label: "Exams Today", value: String(overview.exams_today), trend: `${overview.exams_completed_today} completed` },
        { label: "Flagged Sessions", value: String(overview.flagged_sessions), trend: "Suspicion score > 50" },
        { label: "Grading Queue", value: String(overview.grading_queue), trend: "Awaiting manual grading" },
        { label: "Avg Score", value: `${overview.avg_score_percent}%`, trend: "Across submitted exams" },
      ]
    : [
        { label: "Active Sessions", value: "—", trend: "Loading..." },
        { label: "Exams Today", value: "—", trend: "Loading..." },
        { label: "Flagged Sessions", value: "—", trend: "Loading..." },
        { label: "Grading Queue", value: "—", trend: "Loading..." },
        { label: "Avg Score", value: "—", trend: "Loading..." },
      ];

  const liveSessions = overview
    ? overview.live_sessions.map((s) => ({
        name: s.student_name,
        exam: s.exam_title,
        progress: `${s.answered_count} answered`,
        time: "—",
        score: s.suspicion_score <= 50 ? s.current_score : undefined,
        suspicion: s.suspicion_score > 50 ? s.suspicion_score : undefined,
      }))
    : [];

  const upcomingExams = overview
    ? overview.upcoming_exams.map((e) => ({
        title: e.title,
        time: new Date(e.start_time).toLocaleString(),
      }))
    : [];

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <div style={styles.badge}>Admin dashboard &middot; live</div>
            <h1 style={styles.title}>Platform overview</h1>
            <p style={styles.subtitle}>
              {loading
                ? "Loading live data..."
                : "Some sections below (proctoring signals, AI grading detail) still show demo data until those features are built."}
            </p>
          </div>
          <Link href="/dashboard" style={styles.backLink}>
            Back to dashboard
          </Link>
        </header>

        <div style={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <div key={card.label} style={styles.summaryCard}>
              <div style={styles.summaryLabel}>{card.label}</div>
              <div style={styles.summaryValue}>{card.value}</div>
              <div style={styles.summaryTrend}>{card.trend}</div>
            </div>
          ))}
        </div>

        <div style={styles.twoColGrid}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Live Sessions</h2>
            <div style={styles.list}>
              {liveSessions.length === 0 ? (
                <p style={styles.emptyText}>No active sessions right now.</p>
              ) : (
                liveSessions.map((s, i) => (
                  <div key={i} style={styles.listRow}>
                    <div>
                      <div style={styles.rowTitle}>{s.name}</div>
                      <div style={styles.rowMeta}>
                        {s.exam} &middot; {s.progress}
                      </div>
                    </div>
                    <div style={styles.rowRight}>
                      <div style={styles.rowMeta}>Time: {s.time}</div>
                      {s.score !== undefined ? (
                        <div style={styles.scoreTag}>Score: {s.score}</div>
                      ) : (
                        <div style={styles.suspicionTag}>
                          Suspicion: {s.suspicion}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>
              Proctoring Alerts <span style={styles.demoTag}>demo</span>
            </h2>
            <div style={styles.list}>
              {proctoringAlerts.map((a, i) => (
                <div key={i} style={styles.alertRow}>
                  <div style={styles.rowTitle}>{a.title}</div>
                  <div style={styles.rowMeta}>{a.who}</div>
                  <div style={styles.alertMeta}>
                    {a.when} &middot; {a.extra}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div style={styles.twoColGrid}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>
              Proctoring Signal Breakdown <span style={styles.demoTag}>demo</span>
            </h2>
            <div style={styles.signalList}>
              {signalBreakdown.map((s) => (
                <div key={s.label} style={styles.signalRow}>
                  <div style={styles.signalLabelRow}>
                    <span>{s.label}</span>
                    <span>{s.value}%</span>
                  </div>
                  <div style={styles.signalTrack}>
                    <div
                      style={{
                        ...styles.signalFill,
                        width: `${s.value}%`,
                        background:
                          s.label.includes("High suspicion") ? "#dc2626" : "#4338ca",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>
              AI Grading Queue{" "}
              {overview ? (
                <span style={styles.liveTag}>{overview.grading_queue} live</span>
              ) : (
                <span style={styles.demoTag}>demo</span>
              )}
            </h2>
            <div style={styles.list}>
              {gradingQueueDemo.map((q, i) => (
                <div key={i} style={styles.queueRow}>
                  <span style={styles.queueText}>{q.text}</span>
                  <span style={styles.queueBadge}>{q.detail}</span>
                </div>
              ))}
            </div>
            <div style={styles.queueFooter}>
              <span style={styles.rowMeta}>
                {overview
                  ? `${overview.grading_queue} answers pending grading`
                  : "138 answers pending · 94 AI pre-scored"}
              </span>
              <Link href="/examiner/grading" style={styles.linkButton}>
                Full Queue
              </Link>
            </div>
          </section>
        </div>

        <div style={styles.twoColGrid}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Upcoming Exams</h2>
            <div style={styles.list}>
              {upcomingExams.length === 0 ? (
                <p style={styles.emptyText}>No upcoming exams scheduled.</p>
              ) : (
                upcomingExams.map((e, i) => (
                  <div key={i} style={styles.simpleRow}>
                    <span>{e.title}</span>
                    <span style={styles.rowMeta}>{e.time}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>
              Recent Activity <span style={styles.demoTag}>demo</span>
            </h2>
            <div style={styles.list}>
              {recentActivity.map((a, i) => (
                <div key={i} style={styles.simpleRow}>
                  <span>{a.text}</span>
                  <span style={styles.rowMeta}>{a.when}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Quick Actions</h2>
          <div style={styles.actionsRow}>
            <Link href="/examiner/create" style={styles.actionButton}>
              Create New Exam
            </Link>
            <button style={styles.actionButton}>Review Flagged Sessions</button>
            <button style={styles.actionButton}>Publish Results</button>
            <button style={styles.actionButton}>Export Grading Report</button>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    padding: "2rem 1rem",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  shell: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  badge: {
    display: "inline-block",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#4338ca",
    background: "#eef2ff",
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    marginBottom: "0.5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 0.3rem 0",
  },
  subtitle: {
    fontSize: "0.85rem",
    color: "#64748b",
    margin: 0,
    maxWidth: "480px",
    lineHeight: 1.5,
  },
  backLink: {
    color: "#4338ca",
    textDecoration: "none",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1rem",
  },
  summaryCard: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "1.1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  summaryLabel: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginBottom: "0.3rem",
  },
  summaryValue: {
    fontSize: "1.7rem",
    fontWeight: 800,
    color: "#0f172a",
  },
  summaryTrend: {
    fontSize: "0.75rem",
    color: "#16a34a",
    marginTop: "0.2rem",
  },
  twoColGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "1.2rem",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "1.3rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  panelTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 0.9rem 0",
  },
  demoTag: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#92400e",
    background: "#fef3c7",
    padding: "0.15rem 0.4rem",
    borderRadius: "999px",
    marginLeft: "0.4rem",
    textTransform: "uppercase",
  },
  liveTag: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#15803d",
    background: "#dcfce7",
    padding: "0.15rem 0.4rem",
    borderRadius: "999px",
    marginLeft: "0.4rem",
    textTransform: "uppercase",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: "0.85rem",
  },
  listRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "0.6rem 0",
    borderBottom: "1px solid #f1f5f9",
  },
  rowTitle: {
    fontWeight: 700,
    fontSize: "0.9rem",
    color: "#0f172a",
  },
  rowMeta: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "0.15rem",
  },
  rowRight: {
    textAlign: "right",
  },
  scoreTag: {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#15803d",
    marginTop: "0.2rem",
  },
  suspicionTag: {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#dc2626",
    marginTop: "0.2rem",
  },
  alertRow: {
    padding: "0.6rem 0",
    borderBottom: "1px solid #f1f5f9",
  },
  alertMeta: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    marginTop: "0.2rem",
  },
  signalList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
  },
  signalRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  signalLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.82rem",
    color: "#334155",
  },
  signalTrack: {
    height: "6px",
    background: "#f1f5f9",
    borderRadius: "999px",
    overflow: "hidden",
  },
  signalFill: {
    height: "100%",
    borderRadius: "999px",
  },
  queueRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5rem 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "0.85rem",
    color: "#334155",
  },
  queueText: {
    flex: 1,
    marginRight: "0.6rem",
  },
  queueBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#4338ca",
    background: "#eef2ff",
    padding: "0.2rem 0.5rem",
    borderRadius: "999px",
  },
  queueFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "0.9rem",
  },
  linkButton: {
    border: "none",
    background: "none",
    color: "#4338ca",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.85rem",
    textDecoration: "none",
  },
  simpleRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.88rem",
    color: "#334155",
    padding: "0.5rem 0",
    borderBottom: "1px solid #f1f5f9",
  },
  actionsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.7rem",
  },
  actionButton: {
    padding: "0.7rem 1.1rem",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#0f172a",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
};