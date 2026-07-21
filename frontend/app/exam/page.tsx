"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

type Question = {
  id: string;
  question_type: "mcq" | "multi_select" | "short_answer" | "long_answer" | "image_upload";
  text: string;
  marks: number;
  options: { id: string; text: string }[];
};

type SubmitState = "idle" | "confirming" | "submitted";
type QuestionStatus = "unanswered" | "answered" | "marked";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const EXAM_DURATION_SECONDS = 30 * 60;

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

export default function ExamPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examToken, setExamToken] = useState("");

  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [key: string]: boolean }>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [resultData, setResultData] = useState<{ total_score: number; max_score: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceStatus, setFaceStatus] = useState<"ok" | "no-face" | "multiple-faces" | "loading">("loading");
  const [proctorWarnings, setProctorWarnings] = useState<string[]>([]);

  useEffect(() => {
    async function loadExam() {
      const loginToken = localStorage.getItem("access_token");
      if (!loginToken) {
        setError("You're not logged in. Please log in again.");
        setLoading(false);
        return;
      }

      const role = getUserRole(loginToken);
      if (role && role !== "student") {
        setError(
          "You signed in as an examiner or admin. This exam screen is for students only."
        );
        setLoading(false);
        return;
      }

      const examId = localStorage.getItem("active_exam_id") || "";
      const existingExamToken = localStorage.getItem("exam_token") || "";

      if (!examId) {
        setError("No exam is selected. Please choose an exam first.");
        setLoading(false);
        return;
      }

      try {
        let newExamToken = existingExamToken;
        if (!newExamToken) {
          const startRes = await fetch(`${API_BASE}/exams/${examId}/start`, {
            method: "POST",
            headers: { Authorization: `Bearer ${loginToken}` },
          });

          if (!startRes.ok) {
            const body = await startRes.json().catch(() => ({}));
            setError(body.detail || "Could not start the exam session.");
            setLoading(false);
            return;
          }

          const startData = await startRes.json();
          newExamToken = startData.access_token;
          localStorage.setItem("exam_token", newExamToken);
        }

        setExamToken(newExamToken);

        const qRes = await fetch(`${API_BASE}/exams/${examId}/questions`, {
          headers: { Authorization: `Bearer ${newExamToken}` },
        });

        if (!qRes.ok) {
          setError("Could not load exam questions.");
          setLoading(false);
          return;
        }

        const qData: Question[] = await qRes.json();
        setQuestions(qData);
        setLoading(false);
      } catch {
        setError("Could not reach the server. Is the backend running?");
        setLoading(false);
      }
    }

    loadExam();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("paste", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("paste", block);
    };
  }, []);

  useEffect(() => {
    async function setupProctoring() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        setModelsLoaded(true);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setProctorWarnings((prev) => [...prev, "Could not access webcam or load face detection."]);
      }
    }
    setupProctoring();
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;

    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (detections.length === 0) {
        setFaceStatus("no-face");
      } else if (detections.length > 1) {
        setFaceStatus("multiple-faces");
        setProctorWarnings((prev) => [
          ...prev,
          `Multiple faces detected at ${new Date().toLocaleTimeString()}`,
        ]);
      } else {
        setFaceStatus("ok");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [modelsLoaded]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        setProctorWarnings((prev) => [
          ...prev,
          `Tab switch detected at ${new Date().toLocaleTimeString()}`,
        ]);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  if (loading) {
    return (
      <div style={styles.centerScreen}>
        <p style={styles.loadingText}>Loading your exam...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centerScreen}>
        <p style={styles.errorText}>{error}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={styles.centerScreen}>
        <p style={styles.loadingText}>This exam has no questions yet.</p>
      </div>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const urgency =
    secondsLeft <= 60 ? "#dc2626" : secondsLeft <= 300 ? "#d97706" : "#0f172a";

  const currentQuestion = questions[currentIndex];

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  }

  function toggleMarkForReview() {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  }

  function getStatus(index: number): QuestionStatus {
    const q = questions[index];
    if (markedForReview[q.id]) return "marked";
    if (answers[q.id]) return "answered";
    return "unanswered";
  }

  function goToNext() {
    setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
  }

  const isMCQ =
    currentQuestion.question_type === "mcq" ||
    currentQuestion.question_type === "multi_select";

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const markedCount = questions.filter((q) => markedForReview[q.id]).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.badge}>AI-PROCTORED</div>
        <span style={styles.examTitle}>Exam in progress</span>
        <div style={{ ...styles.timer, color: urgency }}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
      </header>

      <div style={styles.body}>
        <aside style={styles.sidebar}>
          <video ref={videoRef} autoPlay muted playsInline style={styles.webcamPreview} />
          <div
            style={{
              ...styles.faceStatusTag,
              ...(faceStatus === "ok" ? styles.faceStatusOk : {}),
              ...(faceStatus === "no-face" ? styles.faceStatusWarn : {}),
              ...(faceStatus === "multiple-faces" ? styles.faceStatusDanger : {}),
            }}
          >
            {faceStatus === "loading" && "Starting camera..."}
            {faceStatus === "ok" && "Face detected"}
            {faceStatus === "no-face" && "No face detected"}
            {faceStatus === "multiple-faces" && "Multiple faces!"}
          </div>

          <div style={styles.sidebarTitle}>Questions</div>

          <div style={styles.navGrid}>
            {questions.map((q, i) => {
              const status = getStatus(i);
              const isActive = i === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    ...styles.navItem,
                    ...(isActive ? styles.navItemActive : {}),
                    ...(status === "answered" && !isActive ? styles.navItemAnswered : {}),
                    ...(status === "marked" && !isActive ? styles.navItemMarked : {}),
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div style={styles.legend}>
            <div style={styles.legendRow}>
              <span style={{ ...styles.legendDot, background: "#22c55e" }} />
              Answered ({answeredCount})
            </div>
            <div style={styles.legendRow}>
              <span style={{ ...styles.legendDot, background: "#cbd5e1" }} />
              Unanswered ({unansweredCount})
            </div>
            <div style={styles.legendRow}>
              <span style={{ ...styles.legendDot, background: "#a855f7" }} />
              Marked for review ({markedCount})
            </div>
          </div>
        </aside>

        <main style={styles.questionArea}>
          <div style={styles.questionCard}>
            <div style={styles.questionMeta}>
              Question {currentIndex + 1} of {questions.length} &middot; {currentQuestion.marks} mark
              {currentQuestion.marks !== 1 ? "s" : ""}
            </div>
            <h2 style={styles.questionText}>{currentQuestion.text}</h2>

            {isMCQ && (
              <div style={styles.optionsList}>
                {currentQuestion.options.map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      ...styles.optionRow,
                      ...(answers[currentQuestion.id] === opt.id ? styles.optionRowSelected : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      checked={answers[currentQuestion.id] === opt.id}
                      onChange={() => setAnswer(opt.id)}
                      style={styles.radio}
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            )}

            {!isMCQ && currentQuestion.question_type !== "image_upload" && (
              <div>
                <textarea
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  style={styles.textarea}
                  rows={6}
                />
                <div style={styles.wordCount}>
                  {(answers[currentQuestion.id] || "").trim().split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            )}

            {currentQuestion.question_type === "image_upload" && (
              <p style={styles.wordCount}>
                Image upload questions aren't supported in this version yet.
              </p>
            )}
          </div>

          <div style={styles.actionRow}>
            <button
              onClick={toggleMarkForReview}
              style={{
                ...styles.markButton,
                ...(markedForReview[currentQuestion.id] ? styles.markButtonActive : {}),
              }}
            >
              {markedForReview[currentQuestion.id] ? "Unmark review" : "Mark for review"}
            </button>

            <div style={styles.actionRowRight}>
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                style={{
                  ...styles.navButton,
                  ...(currentIndex === 0 ? styles.navButtonDisabled : {}),
                }}
              >
                Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <>
                  <button onClick={() => {}} style={styles.navButton}>
                    Save
                  </button>
                  <button
                    onClick={goToNext}
                    style={{ ...styles.navButton, ...styles.navButtonPrimary }}
                  >
                    Save &amp; Next
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSubmitState("confirming")}
                  style={{ ...styles.navButton, ...styles.submitButton }}
                >
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {submitState === "confirming" && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Submit your exam?</h3>
            <p style={styles.modalText}>
              You've answered {answeredCount} of {questions.length} questions
              {markedCount > 0 ? `, and marked ${markedCount} for review` : ""}.
              Once submitted, you can't change your answers.
            </p>
            <div style={styles.modalButtons}>
              <button onClick={() => setSubmitState("idle")} style={styles.modalCancelButton}>
                Keep reviewing
              </button>
              <button
                onClick={async () => {
                  try {
                    const examId = localStorage.getItem("active_exam_id") || "";
                    const res = await fetch(`${API_BASE}/exams/${examId}/submit`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${examToken}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ answers }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setResultData({ total_score: data.total_score, max_score: data.max_score });
                      setSubmitState("submitted");
                    } else {
                      alert("Submission failed. Please try again.");
                    }
                  } catch {
                    alert("Could not reach the server.");
                  }
                }}
                style={styles.modalConfirmButton}
              >
                Yes, submit
              </button>
            </div>
          </div>
        </div>
      )}

      {submitState === "submitted" && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Exam submitted</h3>
            {resultData ? (
              <>
                <p style={styles.modalText}>
                  Your objective-question score has been calculated automatically.
                  Subjective answers will be graded separately.
                </p>
                <div style={styles.scoreBox}>
                  <span style={styles.scoreNumber}>
                    {resultData.total_score} / {resultData.max_score}
                  </span>
                  <span style={styles.scoreLabel}>points scored</span>
                </div>
              </>
            ) : (
              <p style={styles.modalText}>
                Your answers have been recorded. You'll see your results once they're published.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  centerScreen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  loadingText: { fontSize: "1rem", color: "#475569" },
  errorText: { fontSize: "1rem", color: "#b91c1c", maxWidth: "400px", textAlign: "center" },
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.7rem 1.5rem",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  webcamPreview: {
    width: "100%",
    height: "140px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    objectFit: "cover",
    background: "#0f172a",
    marginBottom: "0.6rem",
    display: "block",
  },
  badge: {
    fontSize: "0.6rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    color: "#4338ca",
    background: "#eef2ff",
    padding: "0.2rem 0.45rem",
    borderRadius: "999px",
    marginBottom: "0.2rem",
    display: "inline-block",
  },
  faceStatusTag: {
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    background: "#f1f5f9",
    color: "#64748b",
    display: "block",
    textAlign: "center",
    marginBottom: "1rem",
  },
  faceStatusOk: { background: "#dcfce7", color: "#15803d" },
  faceStatusWarn: { background: "#fef3c7", color: "#92400e" },
  faceStatusDanger: { background: "#fee2e2", color: "#b91c1c" },
  examTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#0f172a",
  },
  timer: {
    fontSize: "1.3rem",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
  body: {
    display: "flex",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "1.5rem",
    gap: "1.5rem",
  },
  sidebar: {
    width: "210px",
    flexShrink: 0,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.2rem",
    height: "fit-content",
  },
  sidebarTitle: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#64748b",
    marginBottom: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  navGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "0.5rem",
  },
  navItem: {
    padding: "0.5rem 0",
    fontSize: "0.85rem",
    fontWeight: 600,
    border: "1.5px solid #e2e8f0",
    borderRadius: "6px",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
  },
  navItemActive: { borderColor: "#4338ca", color: "#4338ca", background: "#eef2ff" },
  navItemAnswered: { borderColor: "#22c55e", color: "#15803d", background: "#f0fdf4" },
  navItemMarked: { borderColor: "#a855f7", color: "#7e22ce", background: "#faf5ff" },
  legend: {
    marginTop: "1.2rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.75rem",
    color: "#64748b",
  },
  legendDot: { width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" },
  questionArea: { flex: 1, display: "flex", flexDirection: "column", gap: "1rem" },
  questionCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.8rem",
  },
  questionMeta: { fontSize: "0.8rem", color: "#64748b", marginBottom: "0.6rem" },
  questionText: { fontSize: "1.15rem", fontWeight: 600, color: "#0f172a", margin: "0 0 1.3rem 0" },
  optionsList: { display: "flex", flexDirection: "column", gap: "0.6rem" },
  optionRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.7rem",
    padding: "0.75rem 1rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: "#334155",
  },
  optionRowSelected: { borderColor: "#4338ca", background: "#eef2ff", color: "#3730a3" },
  radio: { accentColor: "#4338ca" },
  textarea: {
    width: "100%",
    padding: "0.8rem",
    fontSize: "0.9rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  wordCount: { marginTop: "0.4rem", fontSize: "0.75rem", color: "#94a3b8", textAlign: "right" },
  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1rem 1.2rem",
  },
  actionRowRight: { display: "flex", gap: "0.6rem" },
  markButton: {
    padding: "0.65rem 1.1rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    border: "1.5px solid #a855f7",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#7e22ce",
    cursor: "pointer",
  },
  markButtonActive: { background: "#a855f7", color: "#ffffff" },
  navButton: {
    padding: "0.65rem 1.2rem",
    fontSize: "0.88rem",
    fontWeight: 600,
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
  },
  navButtonPrimary: { background: "#4338ca", color: "#ffffff", border: "none" },
  navButtonDisabled: { opacity: 0.4, cursor: "not-allowed" },
  submitButton: { background: "#16a34a", color: "#ffffff", border: "none" },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  modalCard: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "1.8rem",
    maxWidth: "380px",
    width: "90%",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
  },
  modalTitle: { fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.6rem 0" },
  modalText: { fontSize: "0.9rem", color: "#475569", lineHeight: 1.5, margin: "0 0 1.4rem 0" },
  modalButtons: { display: "flex", gap: "0.7rem", justifyContent: "flex-end" },
  modalCancelButton: {
    padding: "0.6rem 1.1rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
  },
  modalConfirmButton: {
    padding: "0.6rem 1.1rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    background: "#16a34a",
    color: "#ffffff",
    cursor: "pointer",
  },
  scoreBox: {
    marginTop: "0.5rem",
    padding: "1rem",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    textAlign: "center",
  },
  scoreNumber: { display: "block", fontSize: "1.8rem", fontWeight: 800, color: "#15803d" },
  scoreLabel: { fontSize: "0.8rem", color: "#166534" },
};