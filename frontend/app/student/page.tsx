"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Exam = {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
};

function getUserRole(token: string) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized));
    return decoded.role || null;
  } catch {
    return null;
  }
}

export default function StudentExamSelectionPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("access_token") || "";
      if (!token) {
        setError("Please sign in first.");
        setLoading(false);
        return;
      }

      const role = getUserRole(token);
      if (role !== "student") {
        setError("This page is for students.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/exams/student`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Unable to load available exams.");
        }

        const data = await res.json();
        setExams(data);
        if (data[0]) setSelectedExamId(data[0].id);
      } catch {
        setError("Could not load exams.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function startExam() {
    const token = localStorage.getItem("access_token") || "";
    if (!selectedExamId) {
      setError("Please select an exam.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/exams/${selectedExamId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Could not start the selected exam.");
      }

      const data = await res.json();
      localStorage.setItem("exam_token", data.access_token);
      localStorage.setItem("active_exam_id", selectedExamId);
      window.location.href = "/exam";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start exam.");
    }
  }

  if (loading) return <div style={styles.center}>Loading available exams…</div>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Choose an exam</h1>
        <p style={styles.subtitle}>Select one of the currently open exams to begin.</p>
        {error ? <div style={styles.errorBox}>{error}</div> : null}
        <div style={styles.list}>
          {exams.length === 0 ? (
            <div style={styles.empty}>No exams are currently available.</div>
          ) : (
            exams.map((exam) => (
              <label key={exam.id} style={styles.examItem}>
                <input
                  type="radio"
                  name="exam"
                  checked={selectedExamId === exam.id}
                  onChange={() => setSelectedExamId(exam.id)}
                />
                <div>
                  <div style={styles.examTitle}>{exam.title}</div>
                  <div style={styles.examMeta}>{exam.subject} • {exam.duration_minutes} min</div>
                </div>
              </label>
            ))
          )}
        </div>
        <button onClick={startExam} style={styles.button}>Start selected exam</button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    padding: "1.5rem",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "560px",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "2rem",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 0.35rem",
  },
  subtitle: {
    color: "#64748b",
    margin: "0 0 1rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    marginBottom: "1rem",
  },
  examItem: {
    display: "flex",
    gap: "0.7rem",
    alignItems: "flex-start",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "0.8rem",
  },
  examTitle: {
    fontWeight: 700,
    color: "#0f172a",
  },
  examMeta: {
    color: "#64748b",
    fontSize: "0.9rem",
    marginTop: "0.2rem",
  },
  button: {
    padding: "0.8rem 1rem",
    border: "none",
    borderRadius: "10px",
    background: "#4338ca",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  empty: {
    color: "#64748b",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "0.75rem 0.9rem",
    borderRadius: "10px",
    marginBottom: "0.8rem",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    color: "#334155",
  },
};
