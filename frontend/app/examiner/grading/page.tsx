"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type GradableAnswer = {
  answer_id: string;
  session_id: string;
  student_id: string;
  question_id: string;
  question_text: string;
  question_type: string;
  text_answer: string | null;
  selected_option_ids: string[] | null;
  final_score: number | null;
  max_marks: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// TEMPORARY: same hardcoded exam id pattern used elsewhere until an exam list/picker exists here.
const EXAM_ID = "a90582e5-9097-4b5d-9f18-452faca26b19";

export default function GradingPage() {
  const [answers, setAnswers] = useState<GradableAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scoreInputs, setScoreInputs] = useState<{ [key: string]: string }>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("access_token") || "";
      if (!token) {
        setError("Please sign in first.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/exams/${EXAM_ID}/answers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not load answers.");
        const data: GradableAnswer[] = await res.json();
        setAnswers(data);

        const initialScores: { [key: string]: string } = {};
        data.forEach((a) => {
          initialScores[a.answer_id] = a.final_score?.toString() || "";
        });
        setScoreInputs(initialScores);
      } catch {
        setError("Could not load answers for grading.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveScore(answerId: string) {
    setSavingId(answerId);
    const token = localStorage.getItem("access_token") || "";
    const score = Number(scoreInputs[answerId]);

    try {
      const res = await fetch(`${API_BASE}/exams/answers/${answerId}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score }),
      });

      if (res.ok) {
        setAnswers((prev) =>
          prev.map((a) =>
            a.answer_id === answerId ? { ...a, final_score: score } : a
          )
        );
      } else {
        alert("Could not save this score.");
      }
    } catch {
      alert("Could not reach the server.");
    } finally {
      setSavingId(null);
    }
  }

  const subjectiveAnswers = answers.filter(
    (a) => a.question_type === "short_answer" || a.question_type === "long_answer"
  );

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>Grading portal</div>
            <h1 style={styles.title}>Review subjective answers</h1>
            <p style={styles.subtitle}>
              Objective (MCQ) answers are already auto-scored. Review and
              score the written answers below.
            </p>
          </div>
          <Link href="/dashboard" style={styles.backLink}>
            Back to dashboard
          </Link>
        </div>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {loading ? <p style={styles.emptyState}>Loading answers...</p> : null}

        {!loading && subjectiveAnswers.length === 0 ? (
          <p style={styles.emptyState}>
            No subjective answers to grade yet.
          </p>
        ) : null}

        <div style={styles.list}>
          {subjectiveAnswers.map((answer) => (
            <div key={answer.answer_id} style={styles.card}>
              <div style={styles.questionText}>{answer.question_text}</div>
              <div style={styles.studentAnswer}>
                {answer.text_answer || "(no answer submitted)"}
              </div>

              <div style={styles.gradeRow}>
                <label style={styles.gradeLabel}>
                  Score (out of {answer.max_marks})
                </label>
                <input
                  type="number"
                  min={0}
                  max={answer.max_marks}
                  value={scoreInputs[answer.answer_id] || ""}
                  onChange={(e) =>
                    setScoreInputs((prev) => ({
                      ...prev,
                      [answer.answer_id]: e.target.value,
                    }))
                  }
                  style={styles.scoreInput}
                />
                <button
                  onClick={() => saveScore(answer.answer_id)}
                  disabled={savingId === answer.answer_id}
                  style={styles.saveButton}
                >
                  {savingId === answer.answer_id ? "Saving..." : "Save score"}
                </button>
              </div>
            </div>
          ))}
        </div>
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
    maxWidth: "820px",
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
    margin: "0 0 0.3rem 0",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.5,
    maxWidth: "480px",
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
    marginBottom: "0.8rem",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "0.95rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.2rem",
    background: "#f8fafc",
  },
  questionText: {
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "0.6rem",
  },
  studentAnswer: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.8rem",
    color: "#334155",
    fontSize: "0.9rem",
    lineHeight: 1.5,
    marginBottom: "0.9rem",
    whiteSpace: "pre-wrap",
  },
  gradeRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.7rem",
  },
  gradeLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#475569",
  },
  scoreInput: {
    width: "80px",
    padding: "0.5rem 0.6rem",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.9rem",
  },
  saveButton: {
    padding: "0.55rem 1rem",
    border: "none",
    borderRadius: "8px",
    background: "#4338ca",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};