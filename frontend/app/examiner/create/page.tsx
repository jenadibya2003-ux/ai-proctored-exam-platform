"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Question = {
  id: string;
  subject: string;
  question_type: string;
  difficulty: string;
  text: string;
  marks: number;
};

type Role = "student" | "examiner" | "admin" | "user";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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

function parseKeyValuePairs(raw: string) {
  if (!raw.trim()) return {};
  const result: Record<string, number> = {};
  raw.split(",").forEach((chunk) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;
    const [key, value] = trimmed.split(":");
    if (key && value) {
      result[key.trim()] = Number(value.trim());
    }
  });
  return result;
}

function formatDateTimeInput(value: Date) {
  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function CreateExamPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [role, setRole] = useState<Role>("user");

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [passingMarks, setPassingMarks] = useState("40");
  const [status, setStatus] = useState("Draft");
  const [searchTerm, setSearchTerm] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [startTime, setStartTime] = useState(formatDateTimeInput(new Date()));
  const [endTime, setEndTime] = useState(formatDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizationMode, setRandomizationMode] = useState("per_student");
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(false);
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const [webcamMonitoringEnabled, setWebcamMonitoringEnabled] = useState(true);
  const [gazeTrackingEnabled, setGazeTrackingEnabled] = useState(false);
  const [gazeTrackingSensitivityThreshold, setGazeTrackingSensitivityThreshold] = useState("3");
  const [maxTabSwitchWarnings, setMaxTabSwitchWarnings] = useState("3");
  const [difficultyCounts, setDifficultyCounts] = useState("");
  const [questionTypeDistribution, setQuestionTypeDistribution] = useState("");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("access_token") || "";
      const userRole = getUserRole(token);
      setRole((userRole as Role) || "user");

      if (!token) {
        setError("Please sign in first.");
        setLoading(false);
        return;
      }

      if (userRole !== "examiner" && userRole !== "admin") {
        setError("Only examiners and admins can create exams.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/questions/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Unable to load questions");
        }

        const data = await res.json();
        setQuestions(data);
      } catch {
        setError("Could not load your question bank.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function toggleQuestion(id: string) {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const token = localStorage.getItem("access_token") || "";
    if (!token) {
      setError("Please sign in first.");
      setSaving(false);
      return;
    }

    if (selectedQuestionIds.length === 0) {
      setError("Select at least one question for the exam.");
      setSaving(false);
      return;
    }

    const rules: Record<string, Record<string, number>> = {};
    const difficultyRule = parseKeyValuePairs(difficultyCounts);
    const typeRule = parseKeyValuePairs(questionTypeDistribution);
    if (Object.keys(difficultyRule).length > 0) {
      rules.difficulty_counts = difficultyRule;
    }
    if (Object.keys(typeRule).length > 0) {
      rules.question_type_distribution = typeRule;
    }

    const payload = {
      title,
      subject,
      total_marks: Number(totalMarks),
      passing_marks: Number(passingMarks),
      status: status,
      duration_minutes: Number(durationMinutes),
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      randomize_questions: randomizeQuestions,
      randomization_mode: randomizationMode,
      negative_marking_enabled: negativeMarkingEnabled,
      proctoring_enabled: proctoringEnabled,
      webcam_monitoring_enabled: webcamMonitoringEnabled,
      gaze_tracking_enabled: gazeTrackingEnabled,
      gaze_tracking_sensitivity_threshold: Number(gazeTrackingSensitivityThreshold),
      max_tab_switch_warnings: Number(maxTabSwitchWarnings),
      question_ids: selectedQuestionIds,
      question_selection_rules: Object.keys(rules).length > 0 ? rules : undefined,
    };

    try {
      const res = await fetch(`${API_BASE}/exams/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Could not create the exam.");
      }

      const created = await res.json();
     setSuccess(`Exam created successfully with id ${created.id}`);

     setTitle("");
     setSubject("");
     setTotalMarks("100");
     setPassingMarks("40");
     setStatus("Draft");
     setSearchTerm("");
     setSelectedQuestionIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the exam.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={styles.center}>Loading your exam builder…</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>Examiner tools</div>
            <h1 style={styles.title}>Create a new exam</h1>
            <p style={styles.subtitle}>Choose questions, configure settings, and launch the assessment.</p>
          </div>
          <Link href="/dashboard" style={styles.backLink}>Back to dashboard</Link>
        </div>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {success ? <div style={styles.successBox}>{success}</div> : null}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.grid}>
            <label style={styles.field}>
              <span style={styles.label}>Exam title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required style={styles.input} />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Subject</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} required style={styles.input} />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Total Marks</span>
              <input
                type="number" 
                value={totalMarks}
                onChange={(e)=>setTotalMarks(e.target.value)}
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Passing Marks</span>
              <input
                type="number"
                value={passingMarks}
                onChange={(e) => setPassingMarks(e.target.value)}
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Status</span>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={styles.input}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Completed">Completed</option>
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Duration (minutes)</span>
              <input type="number" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required style={styles.input} />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Start time</span>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required style={styles.input} />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>End time</span>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required style={styles.input} />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Randomization mode</span>
              <select value={randomizationMode} onChange={(e) => setRandomizationMode(e.target.value)} style={styles.input}>
                <option value="per_student">Per student</option>
                <option value="shared">Shared</option>
              </select>
            </label>
          </div>

          <div style={styles.toggleRow}>
            <label style={styles.checkboxRow}>
              <input type="checkbox" checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} />
              <span>Randomize questions</span>
            </label>
            <label style={styles.checkboxRow}>
              <input type="checkbox" checked={negativeMarkingEnabled} onChange={(e) => setNegativeMarkingEnabled(e.target.checked)} />
              <span>Enable negative marking</span>
            </label>
            <label style={styles.checkboxRow}>
              <input type="checkbox" checked={proctoringEnabled} onChange={(e) => setProctoringEnabled(e.target.checked)} />
              <span>Enable proctoring</span>
            </label>
          </div>

          <div style={styles.grid}>
            <label style={styles.field}>
              <span style={styles.label}>Webcam monitoring</span>
              <input type="checkbox" checked={webcamMonitoringEnabled} onChange={(e) => setWebcamMonitoringEnabled(e.target.checked)} />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Gaze tracking</span>
              <input type="checkbox" checked={gazeTrackingEnabled} onChange={(e) => setGazeTrackingEnabled(e.target.checked)} />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Gaze sensitivity threshold</span>
              <input type="number" min="1" value={gazeTrackingSensitivityThreshold} onChange={(e) => setGazeTrackingSensitivityThreshold(e.target.value)} style={styles.input} />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Max tab-switch warnings</span>
              <input type="number" min="0" value={maxTabSwitchWarnings} onChange={(e) => setMaxTabSwitchWarnings(e.target.value)} style={styles.input} />
            </label>
          </div>

          <div style={styles.grid}>
            <label style={styles.field}>
              <span style={styles.label}>Difficulty counts (easy:2,medium:1)</span>
              <input value={difficultyCounts} onChange={(e) => setDifficultyCounts(e.target.value)} style={styles.input} />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Question type distribution (mcq:2,short_answer:1)</span>
              <input value={questionTypeDistribution} onChange={(e) => setQuestionTypeDistribution(e.target.value)} style={styles.input} />
            </label>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Question bank</div>
            <div style={styles.sectionSubtitle}>Select questions from the bank to include in this exam.</div>
            <input
            type="text"
            placeholder="Search Question..."
            value={searchTerm}
            onChange={(e)=>setSearchTerm(e.target.value)}
            style={styles.input}
            />
            <div style={styles.questionList}>
              {questions.length === 0 ? (
                <div style={styles.emptyState}>No questions found yet. Create some in the question bank first.</div>
              ) : (
                questions
                .filter(
                  (question) =>
                    !subject ||
                question.subject.toLowerCase() === subject.toLowerCase()
                )
                .filter((question)=>
                    question.text
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                )
                .map((question)=>(
                  <label key={question.id} style={styles.questionItem}>
                    <input type="checkbox" checked={selectedQuestionIds.includes(question.id)} onChange={() => toggleQuestion(question.id)} />
                    <div>
                      <div style={styles.questionText}>{question.text}</div>
                      <div style={styles.questionMeta}>{question.subject} • {question.question_type} • {question.difficulty} • {question.marks} mark(s)</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <button type="submit" disabled={saving} style={styles.submitButton}>
            {saving ? "Creating exam..." : "Create exam"}
          </button>
        </form>
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
    maxWidth: "980px",
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
  },
  backLink: {
    color: "#4338ca",
    textDecoration: "none",
    fontWeight: 600,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    color: "#334155",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "0.7rem 0.8rem",
    fontSize: "0.95rem",
    outline: "none",
  },
  toggleRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    padding: "0.7rem 0",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    color: "#334155",
  },
  section: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "1rem",
    background: "#f8fafc",
  },
  sectionTitle: {
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "0.2rem",
  },
  sectionSubtitle: {
    color: "#64748b",
    fontSize: "0.9rem",
    marginBottom: "0.8rem",
  },
  questionList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  questionItem: {
    display: "flex",
    gap: "0.7rem",
    alignItems: "flex-start",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "0.7rem",
    background: "#ffffff",
  },
  questionText: {
    fontWeight: 600,
    color: "#0f172a",
  },
  questionMeta: {
    fontSize: "0.82rem",
    color: "#64748b",
    marginTop: "0.2rem",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "0.95rem",
  },
  submitButton: {
    padding: "0.8rem 1.1rem",
    border: "none",
    borderRadius: "10px",
    background: "#4338ca",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "0.75rem 0.9rem",
    borderRadius: "10px",
    marginBottom: "0.8rem",
  },
  successBox: {
    background: "#ecfdf5",
    color: "#166534",
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
