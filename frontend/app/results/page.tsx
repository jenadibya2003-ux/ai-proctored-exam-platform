"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ResultBreakdownItem = {
  question_text: string;
  question_type: string;
  marks: number;
  score: number;
};

type Result = {
  submitted_at: string;
  total_score: number;
  max_score: number;
  breakdown: ResultBreakdownItem[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ResultsPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("access_token") || "";
      const examId = localStorage.getItem("active_exam_id") || "";

      if (!token || !examId) {
        setError("No exam selected. Please choose an exam first.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/exams/${examId}/my-result`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.detail || "Could not load your results.");
          setLoading(false);
          return;
        }

        const data: Result = await res.json();
        setResult(data);
      } catch {
        setError("Could not reach the server.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>Results</div>
            <h1 style={styles.title}>Your exam results</h1>
          </div>
          <Link href="/dashboard" style={styles.backLink}>
            Back to dashboard
          </Link>
        </div>

        {loading ? <p style={styles.emptyState}>Loading your results...</p> : null}
        {error ? <div style={styles.errorBox}>{error}</div> : null}

        {result ? (
          <>
            <div style={styles.scoreBox}>
              <span style={styles.scoreNumber}>
                {result.total_score} / {result.max_score}
              </span>
              <span style={styles.scoreLabel}>total points</span>
            </div>

            <div style={styles.list}>
              {result.breakdown.map((item, i) => (
                <div key={i} style={styles.card}>
                  <div style={styles.questionText}>{item.question_text}</div>
                  <div style={styles.questionMeta}>
                    {item.question_type} &middot; {item.score} / {item.marks} marks
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    padding: "2rem 1rem",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  shell: {
    maxWidth: "700px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "2rem",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    marginBottom: "1.2rem",
  },
  badge: {
    display: "inline-block",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#4338ca",
    background: "#eef2ff",
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    marginBottom: "0.5rem",
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  backLink: {
    color: "#4338ca",
    textDecoration: "none",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "0.75rem 0.9rem",
    borderRadius: "10px",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "0.95rem",
  },
  scoreBox: {
    padding: "1.4rem",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "14px",
    textAlign: "center",
    marginBottom: "1.4rem",
  },
  scoreNumber: {
    display: "block",
    fontSize: "2.4rem",
    fontWeight: 800,
    color: "#15803d",
  },
  scoreLabel: {
    fontSize: "0.85rem",
    color: "#166534",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "0.9rem",
    background: "#f8fafc",
  },
  questionText: {
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: "0.3rem",
  },
  questionMeta: {
    fontSize: "0.85rem",
    color: "#64748b",
    textTransform: "capitalize",
  },
};