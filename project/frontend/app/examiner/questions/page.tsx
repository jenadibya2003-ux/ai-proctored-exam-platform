"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import AnalyticsCards from "./components/AnalyticsCards";
import SearchBar from "./components/SearchBar";
import FilterPanel from "./components/FilterPanel";

type Question = {
  id: string;
  subject: string;
  question_type: string;
  difficulty: string;
  text: string;
  marks: number;
  negative_marks: number;
  model_answer?: string | null;
  expected_answer?: string | null;
  tags?: string[];
};

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

export default function QuestionBankPage() {
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [form, setForm] = useState({
    subject: "",
    question_type: "mcq",
    difficulty: "medium",
    text: "",
    model_answer: "",
    expected_answer: "",
    tags: "",
    marks: "1",
    max_marks: "",
    negative_marks: "0",
    options: "A, B, C",
  });
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created_count: number; errors: string[] } | null>(null);
  const [aiTopic, setAiTopic] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    async function loadQuestions() {
      const token = localStorage.getItem("access_token") || "";
      if (!token) {
        setError("Please sign in first.");
        setLoading(false);
        return;
      }

      const role = getUserRole(token);
      if (role !== "examiner" && role !== "admin") {
        setError("Only examiners and admins can manage questions.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/questions/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Unable to load questions");
        const data = await res.json();
        setQuestions(data);
      } catch {
        setError("Could not load the question bank.");
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const token = localStorage.getItem("access_token") || "";
    const options = form.options
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((text) => ({
        text,
        is_correct: text === form.expected_answer.trim(),
      }));
    const payload: Record<string, unknown> = {
      subject: form.subject,
      question_type: form.question_type,
      difficulty: form.difficulty,
      text: form.text,
      model_answer: form.model_answer || undefined,
      expected_answer: form.expected_answer || undefined,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      marks: Number(form.marks),
      negative_marks: Number(form.negative_marks),
    };

    if (form.question_type === "mcq" || form.question_type === "multi_select") {
      payload.options = options;
    }

    if (form.question_type === "image_upload") {
      payload.max_marks = Number(form.max_marks);
    }

    try {
      const url = editingId ? `${API_BASE}/questions/${editingId}` : `${API_BASE}/questions/`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Could not save the question.");
      }

      const saved = await res.json();

      if (editingId) {
        setQuestions((prev) => prev.map((q) => (q.id === editingId ? saved : q)));
        setEditingId(null);
      } else {
        setQuestions((prev) => [saved, ...prev]);
      }

      setForm({
        subject: "",
        question_type: "mcq",
        difficulty: "medium",
        text: "",
        model_answer: "",
        expected_answer: "",
        tags: "",
        marks: "1",
        max_marks: "",
        negative_marks: "0",
        options: "A, B, C",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the question.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(question: Question) {
    setEditingId(question.id);
    setForm({
      subject: question.subject,
      question_type: question.question_type,
      difficulty: question.difficulty,
      text: question.text,
      model_answer: question.model_answer || "",
      expected_answer: question.expected_answer || "",
      tags: (question.tags || []).join(", "),
      marks: String(question.marks),
      max_marks: "",
      negative_marks: String(question.negative_marks),
      options: "A, B, C",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm("Delete this question? This cannot be undone.")) return;

    const token = localStorage.getItem("access_token") || "";
    try {
      const res = await fetch(`${API_BASE}/questions/${questionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not delete the question.");
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch {
      setError("Could not delete the question.");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const token = localStorage.getItem("access_token") || "";
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/questions/extract-text`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Could not read this file.");
      }

      const data = await res.json();
      setForm((prev) => ({ ...prev, text: data.extracted_text }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not read this file.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }
  async function handleBulkImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkUploading(true);
    setBulkResult(null);

    const token = localStorage.getItem("access_token") || "";
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/questions/bulk-import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setBulkResult(data);

      const listRes = await fetch(`${API_BASE}/questions/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (listRes.ok) {
        setQuestions(await listRes.json());
      }
    } catch {
      setBulkResult({ created_count: 0, errors: ["Could not reach the server."] });
    } finally {
      setBulkUploading(false);
      e.target.value = "";
    }
  }
  async function generateWithAI() {
    if (!aiTopic.trim()) {
      setAiError("Please enter a topic first.");
      return;
    }

    setGeneratingAI(true);
    setAiError("");

    const token = localStorage.getItem("access_token") || "";

    try {
      const res = await fetch(`${API_BASE}/questions/generate-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: form.subject || "General",
          topic: aiTopic,
          question_type: form.question_type,
          difficulty: form.difficulty,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Could not generate a question.");
      }

      const data = await res.json();

      if (form.question_type === "mcq" || form.question_type === "multi_select") {
        const optionsText = (data.options || [])
          .map((o: { text: string; is_correct: boolean }) => o.text)
          .join(", ");
        const correctOption = (data.options || []).find(
          (o: { text: string; is_correct: boolean }) => o.is_correct
        );
        setForm((prev) => ({
          ...prev,
          text: data.text || prev.text,
          options: optionsText || prev.options,
          expected_answer: correctOption ? correctOption.text : prev.expected_answer,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          text: data.text || prev.text,
          model_answer: data.model_answer || prev.model_answer,
        }));
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Could not generate a question.");
    } finally {
     setGeneratingAI(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>Question bank</div>
            <h1 style={styles.title}>Manage questions</h1>
            <p style={styles.subtitle}>Create and review questions for exams.</p>
          </div>
          <Link href="/dashboard" style={styles.backLink}>Back to dashboard</Link>
        </div>

        {error ? <div style={styles.errorBox}>{error}</div> : null}

        <form onSubmit={handleCreate} style={styles.form}>
          <div style={styles.grid}>
            <label style={styles.field}>
              <span style={styles.label}>Subject</span>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required style={styles.input} />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Question type</span>
              <select value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value })} style={styles.input}>
                <option value="mcq">MCQ</option>
                <option value="multi_select">Multi select</option>
                <option value="short_answer">Short answer</option>
                <option value="long_answer">Long answer</option>
                <option value="image_upload">Image upload</option>
              </select>
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Difficulty</span>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} style={styles.input}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Marks</span>
              <input type="number" min="1" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} required style={styles.input} />
            </label>
            {form.question_type === "image_upload" ? (
              <label style={styles.field}>
                <span style={styles.label}>Max marks</span>
                <input type="number" min="1" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: e.target.value })} required style={styles.input} />
              </label>
            ) : null}
            <label style={styles.field}>
              <span style={styles.label}>Negative marks</span>
              <input type="number" min="0" value={form.negative_marks} onChange={(e) => setForm({ ...form, negative_marks: e.target.value })} style={styles.input} />
            </label>
          </div>

          <label style={styles.field}>
            <span style={styles.label}>Question text</span>
            <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required rows={4} style={styles.textarea} />
          </label>

          <div style={styles.uploadRow}>
            <label style={styles.uploadButton}>
              {uploading ? "Reading file..." : "Upload question from file (PDF, DOCX, TXT, image)"}
              <input
                type="file"
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                style={styles.hiddenFileInput}
                disabled={uploading}
              />
            </label>
            {uploadError ? <div style={styles.errorBox}>{uploadError}</div> : null}
          </div>

          <div style={styles.uploadRow}>
            <label style={styles.uploadButton}>
              {bulkUploading ? "Importing..." : "Bulk import questions from CSV"}
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkImport}
                style={styles.hiddenFileInput}
                disabled={bulkUploading}
              />
            </label>
            {bulkResult && (
              <div style={bulkResult.errors.length > 0 ? styles.errorBox : styles.successBox}>
                {bulkResult.created_count} questions created.
                {bulkResult.errors.length > 0 && (
                  <ul style={{ margin: "0.4rem 0 0 1rem" }}>
                    {bulkResult.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div style={styles.aiRow}>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Topic for AI (e.g., binary search trees)"
              style={styles.aiInput}
            />
            <button
              type="button"
              onClick={generateWithAI}
              disabled={generatingAI}
              style={styles.aiButton}
            >
              {generatingAI ? "Generating..." : "Generate with AI"}
            </button>
          </div>
          {aiError ? <div style={styles.errorBox}>{aiError}</div> : null}

          <div style={styles.grid}>
            <label style={styles.field}>
              <span style={styles.label}>Model answer</span>
              <input value={form.model_answer} onChange={(e) => setForm({ ...form, model_answer: e.target.value })} style={styles.input} />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Expected answer</span>
              <input value={form.expected_answer} onChange={(e) => setForm({ ...form, expected_answer: e.target.value })} style={styles.input} />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Tags</span>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} style={styles.input} />
            </label>
            {(form.question_type === "mcq" || form.question_type === "multi_select") ? (
              <label style={styles.field}>
                <span style={styles.label}>Options (comma separated)</span>
                <input value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} style={styles.input} />
              </label>
            ) : null}
          </div>

          <button type="submit" disabled={saving} style={styles.submitButton}>
            {saving
              ? editingId ? "Saving changes..." : "Creating question..."
              : editingId ? "Save changes" : "Create question"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({
                  subject: "",
                  question_type: "mcq",
                  difficulty: "medium",
                  text: "",
                  model_answer: "",
                  expected_answer: "",
                  tags: "",
                  marks: "1",
                  max_marks: "",
                  negative_marks: "0",
                  options: "A, B, C",
                });
              }}
              style={styles.cancelEditButton}
            >
              Cancel editing
            </button>
          )}
        </form>

<button
  type="button"
  onClick={() => setShowPreview(true)}
  style={styles.previewButton}
>
  Preview as student
</button>

{showPreview && (
  <div style={styles.previewOverlay}>
    <div style={styles.previewCard}>
      <div style={styles.previewHeader}>
        <span style={styles.previewBadge}>Student preview</span>
        <button onClick={() => setShowPreview(false)} style={styles.previewClose}>
          Close
        </button>
      </div>

      <div style={styles.previewMeta}>
        {form.subject || "Subject"} &middot; {form.marks || 0} mark
        {Number(form.marks) !== 1 ? "s" : ""}
      </div>
      <h3 style={styles.previewQuestionText}>
        {form.text || "Your question text will appear here..."}
      </h3>

      {(form.question_type === "mcq" || form.question_type === "multi_select") && (
        <div style={styles.previewOptionsList}>
          {form.options
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean)
            .map((opt, i) => (
              <label key={i} style={styles.previewOptionRow}>
                <input
                  type={form.question_type === "mcq" ? "radio" : "checkbox"}
                  name="preview-option"
                  disabled
                />
                {opt}
              </label>
            ))}
          {form.options.trim() === "" && (
            <p style={styles.previewEmptyText}>Add options above to preview them here.</p>
          )}
        </div>
      )}

      {form.question_type === "short_answer" && (
        <input
          type="text"
          disabled
          placeholder="Student types a short answer here..."
          style={styles.previewInput}
        />
      )}

      {form.question_type === "long_answer" && (
        <textarea
          disabled
          placeholder="Student types a longer, paragraph-style answer here..."
          rows={5}
          style={styles.previewTextarea}
        />
      )}

      {form.question_type === "image_upload" && (
        <div style={styles.previewUploadBox}>
          <span style={styles.previewUploadIcon}>📷</span>
          <span>Student uploads a photo/scan of their handwritten answer here</span>
        </div>
      )}
    </div>
  </div>
)}

        <AnalyticsCards questions={questions} />
        <SearchBar
          value={search}
          onChange={setSearch}
        />

        <FilterPanel
          subject={subjectFilter}
          setSubject={setSubjectFilter}
          difficulty={difficultyFilter}
          setDifficulty={setDifficultyFilter}
          type={typeFilter}
          setType={setTypeFilter}
        />

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Existing questions</div>
          {loading ? <div style={styles.emptyState}>Loading…</div> : null}
          {!loading && questions.length === 0 ? <div style={styles.emptyState}>No questions yet.</div> : null}
          <div style={styles.list}>
            {questions
              .filter((question) => {
                const keyword = search.toLowerCase();

                const matchesSearch =
                  question.text.toLowerCase().includes(keyword) ||
                  question.subject.toLowerCase().includes(keyword) ||
                  question.question_type.toLowerCase().includes(keyword) ||
                  question.difficulty.toLowerCase().includes(keyword) ||
                 (question.tags || []).join(" ").toLowerCase().includes(keyword);

                const matchesSubject =
                  subjectFilter === "" ||
                  question.subject.toLowerCase().includes(subjectFilter.toLowerCase());

                const matchesDifficulty =
                  difficultyFilter === "" ||
                  question.difficulty === difficultyFilter;

                const matchesType =
                  typeFilter === "" ||
                  question.question_type === typeFilter;

                return (
                  matchesSearch &&
                  matchesSubject &&
                  matchesDifficulty &&
                  matchesType
                );
             })
             .map((question) => (
              <div key={question.id} style={styles.card}>
                <div style={styles.cardTitle}>{question.text}</div>
                <div style={styles.cardMeta}>{question.subject} • {question.question_type} • {question.difficulty}</div>
                <div style={styles.cardMeta}>Marks: {question.marks} • Negative marks: {question.negative_marks}</div>
                <div style={styles.cardActions}>
                  <button onClick={() => startEdit(question)} style={styles.editButton}>Edit</button>
                  <button onClick={() => deleteQuestion(question.id)} style={styles.deleteButton}>Delete</button>
                </div>
              </div>
            ))}
          </div>
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
    marginBottom: "1.2rem",
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
  textarea: {
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "0.7rem 0.8rem",
    fontSize: "0.95rem",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
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
  cancelEditButton: {
    marginLeft: "0.6rem",
    padding: "0.8rem 1.1rem",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#334155",
    fontWeight: 600,
    cursor: "pointer",
  },
  cardActions: {
    display: "flex",
    gap: "0.6rem",
    marginTop: "0.6rem",
  },
  editButton: {
    padding: "0.4rem 0.8rem",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "#ffffff",
    color: "#334155",
    fontWeight: 600,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "0.4rem 0.8rem",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontWeight: 600,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  uploadRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  uploadButton: {
    display: "inline-block",
    padding: "0.7rem 1rem",
    border: "1.5px dashed #cbd5e1",
    borderRadius: "10px",
    background: "#f8fafc",
    color: "#4338ca",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    textAlign: "center",
  },
  hiddenFileInput: {
    display: "none",
  },
  aiRow: {
    display: "flex",
    gap: "0.6rem",
  },
  aiInput: {
    flex: 1,
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "0.7rem 0.8rem",
    fontSize: "0.9rem",
    outline: "none",
  },
  aiButton: {
    padding: "0.7rem 1.1rem",
    border: "none",
    borderRadius: "10px",
    background: "#4338ca",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
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
    marginBottom: "0.4rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    marginTop: "0.7rem",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "0.8rem",
    background: "#ffffff",
  },
  cardTitle: {
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "0.25rem",
  },
  cardMeta: {
    color: "#64748b",
    fontSize: "0.85rem",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "0.95rem",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "0.75rem 0.9rem",
    borderRadius: "10px",
    marginBottom: "0.8rem",
  },
  successBox: {
    background: "#f0fdf4",
    color: "#15803d",
    padding: "0.75rem 0.9rem",
    borderRadius: "10px",
    marginBottom: "0.8rem",
    fontSize: "0.85rem",
  },
  previewButton: {
    padding: "0.6rem 1rem",
    border: "1.5px solid #4338ca",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#4338ca",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.85rem",
    alignSelf: "flex-start",
  },
  previewOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 60,
    padding: "1rem",
  },  
  previewCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "1.6rem",
    maxWidth: "480px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  previewBadge: {
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#4338ca",
    background: "#eef2ff",
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
  },
  previewClose: {
    border: "none",
    background: "none",
    color: "#64748b",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  previewMeta: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginBottom: "0.4rem",
  },
  previewQuestionText: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 1rem 0",
  }, 
  previewOptionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  previewOptionRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.7rem",
    padding: "0.7rem 0.9rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "0.9rem",
    color: "#334155",
  },
  previewEmptyText: {
    fontSize: "0.85rem",
    color: "#94a3b8",
  },
  previewInput: {
    width: "100%",
    padding: "0.7rem 0.85rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  },
  previewTextarea: {
    width: "100%",
    padding: "0.7rem 0.85rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "0.9rem",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  previewUploadBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    padding: "2rem 1rem",
    border: "2px dashed #cbd5e1",
    borderRadius: "10px",
    color: "#64748b",
    fontSize: "0.85rem",
    textAlign: "center",
  },
  previewUploadIcon: {
    fontSize: "1.8rem",
  },
};
