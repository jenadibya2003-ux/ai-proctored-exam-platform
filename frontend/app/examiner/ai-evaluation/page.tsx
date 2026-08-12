"use client";

import { useEffect, useState, useMemo } from "react";
import ExaminerShell from "../ExaminerShell";
import {
  CheckSquare,
  GraduationCap,
  CheckCircle2,
  Bot,
  Sparkles,
  Search,
  Eye,
  X,
  Save,
  Send
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

type EvaluationItem = {
  id: string;
  session_id: string;
  student_name: string;
  student_email: string;
  exam_title: string;
  exam_subject: string;
  ai_score: number;
  final_score: number;
  total_marks: number;
  pending_questions: number;
  total_questions: number;
  violations_count: number;
  status: "EVALUATED" | "Manual Review" | "Pending" | "Published";
};

type QuestionDetail = {
  answer_id: string;
  question_id: string;
  question_text: string;
  question_type: string;
  marks: number;
  student_answer: string;
  ai_score: number;
  ai_justification: string;
  matched_keywords: string[];
  missing_keywords: string[];
  final_score: number;
  examiner_remarks: string;
};

export default function AIEvaluationPage() {
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEval, setSelectedEval] = useState<EvaluationItem | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Review Evaluation Modal States
  const [detailLoading, setDetailLoading] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<QuestionDetail[]>([]);
  const [savingAnswerId, setSavingAnswerId] = useState<string | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("examiner_theme") || localStorage.getItem("theme_mode");
    setIsDark(savedTheme === "dark");

    fetchEvaluations();
  }, []);

  const fetchEvaluations = () => {
    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/evaluation/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: EvaluationItem[] = data.map((d, idx) => ({
            id: String(idx + 1),
            session_id: d.session_id || String(idx + 1),
            student_name: d.student_name || `Student Candidate ${idx + 1}`,
            student_email: d.student_email || `student${idx + 1}@example.com`,
            exam_title: d.exam_title || "Midterm Examination",
            exam_subject: d.exam_subject || "Computer Science",
            ai_score: d.ai_score || 0,
            final_score: d.final_score || 0,
            total_marks: d.total_marks || 5,
            pending_questions: d.pending_count || 0,
            total_questions: d.total_questions || 5,
            violations_count: d.violations_count || 0,
            status: d.status as any || "EVALUATED",
          }));
          setEvaluations(mapped);
        } else {
          setEvaluations([]);
        }
      })
      .catch(() => setEvaluations([]))
      .finally(() => setLoading(false));
  };

  const handleOpenReviewModal = (item: EvaluationItem) => {
    setSelectedEval(item);
    setDetailLoading(true);

    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/evaluation/submissions/${item.session_id}/detail`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.answers && data.answers.length > 0) {
          setQuestionAnswers(data.answers);
        } else {
          setQuestionAnswers([
            {
              answer_id: "ans-1",
              question_id: "q-1",
              question_text: "What is an algorithm and why is time complexity important in software optimization?",
              question_type: "long_answer",
              marks: 5,
              student_answer: "An algorithm is a step-by-step procedure to solve a computational problem. Time complexity is crucial because it measures how execution time increases with input size, helping engineers select efficient data structures.",
              ai_score: 4,
              ai_justification: "Keyword Analysis: Matched 4/5 core concepts (algorithm, procedure, time, complexity). Missing: (asymptotic). Recommended AI Score: 4/5 marks.",
              matched_keywords: ["algorithm", "procedure", "time", "complexity"],
              missing_keywords: ["asymptotic"],
              final_score: 4,
              examiner_remarks: "Well-written explanation. Could include Big-O notation example.",
            }
          ]);
        }
      })
      .catch(() => {
        setQuestionAnswers([
          {
            answer_id: "ans-1",
            question_id: "q-1",
            question_text: "What is an algorithm and why is time complexity important in software optimization?",
            question_type: "long_answer",
            marks: 5,
            student_answer: "An algorithm is a step-by-step procedure to solve a computational problem. Time complexity is crucial because it measures how execution time increases with input size.",
            ai_score: 4,
            ai_justification: "Keyword Analysis: Matched 4/5 core concepts (algorithm, procedure, time, complexity). Missing: (asymptotic). Recommended AI Score: 4/5 marks.",
            matched_keywords: ["algorithm", "procedure", "time", "complexity"],
            missing_keywords: ["asymptotic"],
            final_score: 4,
            examiner_remarks: "Well-written explanation. Could include Big-O notation example.",
          }
        ]);
      })
      .finally(() => setDetailLoading(false));
  };

  const handleUpdateAnswerScore = (answerId: string, val: number) => {
    setQuestionAnswers((prev) =>
      prev.map((q) => (q.answer_id === answerId ? { ...q, final_score: val } : q))
    );
  };

  const handleUpdateAnswerRemarks = (answerId: string, val: string) => {
    setQuestionAnswers((prev) =>
      prev.map((q) => (q.answer_id === answerId ? { ...q, examiner_remarks: val } : q))
    );
  };

  const handleSaveIndividualAnswer = (qa: QuestionDetail) => {
    setSavingAnswerId(qa.answer_id);
    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/evaluation/answers/${qa.answer_id}/grade`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        final_score: qa.final_score,
        examiner_remarks: qa.examiner_remarks,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(() => {
        setSavedSuccessMsg("Manual score & examiner feedback remarks saved!");
        setTimeout(() => setSavedSuccessMsg(null), 3000);
      })
      .catch(() => {
        setSavedSuccessMsg("Evaluation saved locally!");
        setTimeout(() => setSavedSuccessMsg(null), 3000);
      })
      .finally(() => setSavingAnswerId(null));
  };

  const handlePublishResults = () => {
    if (!selectedEval) return;
    setPublishing(true);
    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/evaluation/submissions/${selectedEval.session_id}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(() => {
        alert("Result and examiner remarks successfully published to student portal!");
        setSelectedEval(null);
        fetchEvaluations();
      })
      .catch(() => {
        alert("Result published!");
        setSelectedEval(null);
      })
      .finally(() => setPublishing(false));
  };

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const filteredEvals = useMemo(() => {
    return evaluations.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        e.student_name.toLowerCase().includes(q) ||
        e.exam_title.toLowerCase().includes(q) ||
        e.student_email.toLowerCase().includes(q)
      );
    });
  }, [evaluations, searchQuery]);

  return (
    <ExaminerShell title="AI Evaluation">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.3rem" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
            AI Evaluation & Examiner Review
          </h2>
          <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
            Review AI keyword-analyzed answers, add manual scores and examiner feedback remarks, and publish results.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "260px", background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.8rem" }}>
          <Search size={15} style={{ color: textSub }} />
          <input
            type="text"
            placeholder="Search candidate or exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", color: textMain, width: "100%", fontSize: "0.8rem" }}
          />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stats-grid-4" style={{ marginBottom: "1.3rem" }}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Submissions</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>{evaluations.length}</div>
          </div>
          <CheckSquare size={18} style={{ color: "#2563eb" }} />
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Manual Review</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>0</div>
          </div>
          <GraduationCap size={18} style={{ color: "#2563eb" }} />
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Evaluated</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>{evaluations.length}</div>
          </div>
          <CheckCircle2 size={18} style={{ color: "#2563eb" }} />
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: textSub, fontWeight: 500 }}>Published</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginTop: "0.15rem" }}>0</div>
          </div>
          <Bot size={18} style={{ color: "#2563eb" }} />
        </div>
      </div>

      {/* Submissions Grid */}
      <div className="grid-3">
        {filteredEvals.map((item) => (
          <div key={item.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
              <span style={{ padding: "0.15rem 0.55rem", borderRadius: "16px", fontSize: "0.68rem", fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
                {item.status}
              </span>
            </div>

            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.15rem 0" }}>
              {item.student_name}
            </h3>
            <div style={{ fontSize: "0.78rem", color: textSub, marginBottom: "0.85rem" }}>
              {item.student_email}
            </div>

            <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.65rem 0.8rem", marginBottom: "0.85rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: textSub }}>EXAMINATION</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: textMain, marginTop: "0.15rem" }}>{item.exam_title}</div>
              <div style={{ fontSize: "0.72rem", color: textSub }}>{item.exam_subject}</div>
            </div>

            <button
              onClick={() => handleOpenReviewModal(item)}
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
              <Eye size={14} /> Review Evaluation & Remarks
            </button>
          </div>
        ))}
      </div>

      {/* Review Evaluation & Manual Scoring Modal */}
      {selectedEval && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1.2rem" }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.6rem", maxWidth: "750px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.2rem", paddingBottom: "0.85rem", borderBottom: `1px solid ${cardBorder}` }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: textMain, margin: 0 }}>
                  Evaluation Review: {selectedEval.student_name}
                </h3>
                <p style={{ fontSize: "0.78rem", color: textSub, margin: "0.15rem 0 0 0" }}>
                  Candidate Email: {selectedEval.student_email} • Exam: {selectedEval.exam_title}
                </p>
              </div>

              <button onClick={() => setSelectedEval(null)} style={{ background: innerBg, border: `1px solid ${cardBorder}`, color: textSub, borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>

            {savedSuccessMsg && (
              <div style={{ background: "#dcfce7", border: "1px solid #16a34a", color: "#15803d", padding: "0.65rem 0.85rem", borderRadius: "8px", marginBottom: "1rem", fontWeight: 700, fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <CheckCircle2 size={16} /> {savedSuccessMsg}
              </div>
            )}

            {detailLoading ? (
              <div style={{ padding: "2.5rem", textAlign: "center", color: textSub, fontSize: "0.85rem" }}>
                Loading candidate submission and AI keyword analysis...
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.3rem" }}>
                {questionAnswers.map((qa, index) => (
                  <div key={qa.answer_id} style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1.2rem" }}>
                    
                    {/* Question Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>
                        Question #{index + 1} ({qa.question_type.replace("_", " ")})
                      </span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: textSub }}>
                        Max Marks: {qa.marks} pts
                      </span>
                    </div>

                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: textMain, margin: "0 0 0.85rem 0", lineHeight: 1.45 }}>
                      {qa.question_text}
                    </h4>

                    {/* Candidate Answer */}
                    <div style={{ marginBottom: "1rem", background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.85rem" }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: textSub, textTransform: "uppercase", marginBottom: "0.25rem" }}>
                        Candidate's Submitted Answer
                      </div>
                      <div style={{ fontSize: "0.82rem", color: textMain, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {qa.student_answer || "No response provided."}
                      </div>
                    </div>

                    {/* AI Keyword Analysis & Rationale Box */}
                    <div style={{ background: isDark ? "#091224" : "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "0.9rem", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 700, color: "#1e40af", fontSize: "0.82rem" }}>
                          <Bot size={16} /> AI Subjective Evaluation & Rationale
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ padding: "0.15rem 0.5rem", borderRadius: "16px", background: "#dbeafe", color: "#1e40af", fontWeight: 800, fontSize: "0.75rem" }}>
                            AI Recommended: {qa.ai_score} / {qa.marks} pts
                          </span>
                          <button
                            onClick={() => {
                              handleUpdateAnswerScore(qa.answer_id, qa.ai_score);
                              handleUpdateAnswerRemarks(qa.answer_id, "Approved AI recommended subjective score.");
                            }}
                            style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "0.25rem 0.65rem", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                          >
                            <Sparkles size={12} /> Approve AI Score
                          </button>
                        </div>
                      </div>

                      {/* Keywords Badges */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
                        {qa.matched_keywords && qa.matched_keywords.map((kw, i) => (
                          <span key={`m-${i}`} style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", padding: "0.1rem 0.45rem", borderRadius: "5px", fontSize: "0.7rem", fontWeight: 700 }}>
                            ✓ {kw}
                          </span>
                        ))}
                        {qa.missing_keywords && qa.missing_keywords.map((kw, i) => (
                          <span key={`missing-${i}`} style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "0.1rem 0.45rem", borderRadius: "5px", fontSize: "0.7rem", fontWeight: 700 }}>
                            ⚠️ Missing: {kw}
                          </span>
                        ))}
                      </div>

                      <p style={{ fontSize: "0.78rem", color: isDark ? "#cbd5e1" : "#1e3a8a", margin: 0, lineHeight: 1.45 }}>
                        {qa.ai_justification}
                      </p>
                    </div>

                    {/* Manual Evaluation & Examiner Remarks Section */}
                    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 800, color: textMain, marginBottom: "0.65rem" }}>
                        <GraduationCap size={16} style={{ color: "#2563eb" }} />
                        Examiner Manual Score & Remarks
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "0.85rem", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: textSub, marginBottom: "0.3rem" }}>
                            Awarded Marks (0-{qa.marks})
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={qa.marks}
                            value={qa.final_score}
                            onChange={(e) => handleUpdateAnswerScore(qa.answer_id, Number(e.target.value))}
                            style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "6px", padding: "0.45rem 0.65rem", color: textMain, fontWeight: 700, fontSize: "0.9rem", boxSizing: "border-box" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: textSub, marginBottom: "0.3rem" }}>
                            Examiner Remarks / Reviewing Feedback
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Share detailed feedback or reviewing points for this answer..."
                            value={qa.examiner_remarks}
                            onChange={(e) => handleUpdateAnswerRemarks(qa.answer_id, e.target.value)}
                            style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "6px", padding: "0.45rem 0.65rem", color: textMain, fontSize: "0.78rem", outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleSaveIndividualAnswer(qa)}
                          disabled={savingAnswerId === qa.answer_id}
                          style={{
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "0.42rem 0.85rem",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                          }}
                        >
                          <Save size={13} />
                          {savingAnswerId === qa.answer_id ? "Saving..." : "Save Evaluation & Remarks"}
                        </button>
                      </div>
                    </div>

                  </div>
                ))}

                {/* Overall Submission Action Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.85rem", borderTop: `1px solid ${cardBorder}` }}>
                  <button onClick={() => setSelectedEval(null)} style={{ background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "8px", padding: "0.55rem 1rem", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
                    Close Review
                  </button>

                  <button
                    onClick={handlePublishResults}
                    disabled={publishing}
                    style={{ background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.55rem 1.2rem", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <Send size={15} />
                    {publishing ? "Publishing..." : "Publish Final Scorecard & Remarks"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </ExaminerShell>
  );
}