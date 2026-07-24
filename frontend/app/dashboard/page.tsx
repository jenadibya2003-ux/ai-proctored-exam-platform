"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

const examinerStyles: { [key: string]: CSSProperties } = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    background: "#f1f5f9",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  sidebar: {
    width: "240px",
    flexShrink: 0,
    background: "#0f172a",
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column",
    padding: "1.5rem 1rem",
  },
  profileBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    paddingBottom: "1.4rem",
    borderBottom: "1px solid #1e293b",
    marginBottom: "1.2rem",
  },
  avatar: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "#4338ca",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.3rem",
    fontWeight: 700,
    marginBottom: "0.6rem",
  },
  profileName: {
    fontWeight: 700,
    fontSize: "0.95rem",
    color: "#ffffff",
  },
  profileEmail: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    marginTop: "0.1rem",
    wordBreak: "break-all",
  },
  roleChip: {
    marginTop: "0.5rem",
    fontSize: "0.65rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#c7d2fe",
    background: "#312e81",
    padding: "0.2rem 0.55rem",
    borderRadius: "999px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    flex: 1,
  },
  navItem: {
    textAlign: "left",
    padding: "0.65rem 0.8rem",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    fontSize: "0.88rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  navItemActive: {
    background: "#1e293b",
    color: "#ffffff",
    fontWeight: 700,
  },
  logoutButton: {
    marginTop: "1rem",
    padding: "0.7rem",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "transparent",
    color: "#f87171",
    fontWeight: 600,
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: "2.2rem 2.5rem",
    maxWidth: "900px",
  },
  pageTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 0.4rem 0",
  },
  pageSubtitle: {
    fontSize: "0.92rem",
    color: "#64748b",
    lineHeight: 1.6,
    marginBottom: "1.4rem",
    maxWidth: "600px",
  },
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  overviewCard: {
    textAlign: "left",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.1rem",
    background: "#ffffff",
    cursor: "pointer",
  },
  overviewCardTitle: {
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "0.3rem",
  },
  overviewCardText: {
    fontSize: "0.82rem",
    color: "#64748b",
  },
  primaryButton: {
    display: "inline-block",
    padding: "0.75rem 1.1rem",
    background: "#4338ca",
    color: "#ffffff",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  demoNotice: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "0.9rem 1rem",
    borderRadius: "10px",
    fontSize: "0.85rem",
    lineHeight: 1.5,
    maxWidth: "600px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  listRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.8rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    background: "#ffffff",
  },
  rowTitle: {
    fontWeight: 700,
    color: "#0f172a",
    fontSize: "0.9rem",
  },
  rowMeta: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "0.15rem",
  },
  suspicionTag: {
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  smallLink: {
    color: "#4338ca",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "0.85rem",
  },
};

const styles: { [key: string]: CSSProperties } = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    padding: "1.5rem",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  shell: {
    width: "100%",
    maxWidth: "760px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "2rem",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  badge: {
    display: "inline-block",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#4338ca",
    background: "#eef2ff",
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    marginBottom: "0.8rem",
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 0.35rem 0",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#64748b",
    margin: 0,
    lineHeight: 1.6,
  },
  logoutButton: {
    border: "none",
    background: "#f1f5f9",
    color: "#0f172a",
    padding: "0.7rem 0.95rem",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1rem",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "1rem",
    background: "#f8fafc",
  },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 0.35rem 0",
  },
  cardText: {
    fontSize: "0.92rem",
    color: "#475569",
    margin: "0 0 0.9rem 0",
    lineHeight: 1.5,
  },
  primaryButton: {
    display: "inline-block",
    padding: "0.75rem 1rem",
    background: "#4338ca",
    color: "#ffffff",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  secondaryButton: {
    display: "inline-block",
    padding: "0.75rem 1rem",
    background: "#e2e8f0",
    color: "#0f172a",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 600,
  },
  buttonGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
  },
  roleChip: {
    display: "inline-block",
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 700,
    textTransform: "capitalize",
  },
  examList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    marginBottom: "0.9rem",
  },
  examItem: {
    display: "flex",
    gap: "0.6rem",
    alignItems: "flex-start",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.6rem",
    background: "#ffffff",
  },
  examItemTitle: {
    fontWeight: 700,
    color: "#0f172a",
    fontSize: "0.9rem",
  },
  examItemMeta: {
    color: "#64748b",
    fontSize: "0.8rem",
    marginTop: "0.15rem",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "0.6rem 0.8rem",
    borderRadius: "8px",
    marginBottom: "0.6rem",
    fontSize: "0.85rem",
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Role = "student" | "examiner" | "admin" | "user";

type Exam = {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
};

type ExaminerSection =
  | "overview"
  | "profile"
  | "students"
  | "questions"
  | "exams"
  | "mock"
  | "assign"
  | "monitoring"
  | "evaluation"
  | "results";

export default function DashboardPage() {
  const [role, setRole] = useState<Role>("user");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [examsLoading, setExamsLoading] = useState(true);
  const [examError, setExamError] = useState("");

  const [activeSection, setActiveSection] = useState<ExaminerSection>("overview");
  const [studentSection, setStudentSection] = useState("dashboard");

  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    const storedRole = localStorage.getItem("user_role") as Role | null;

    if (storedRole) {
      setRole(storedRole);
    }

    try {
      const payload = token.split(".")[1];
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(atob(normalized));
      if (!storedRole) setRole(decoded.role || "user");
    } catch {
      if (!storedRole) setRole("user");
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setFullName(data.full_name || "");
          setEmail(data.email || "");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadExams() {
      const token = localStorage.getItem("access_token") || "";
      if (!token) {
        setExamsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/exams/student`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data: Exam[] = await res.json();
        setExams(data);
        if (data[0]) setSelectedExamId(data[0].id);
      } catch {
        setExamError("Could not load exams.");
      } finally {
        setExamsLoading(false);
      }
    }
    if (role === "student") loadExams();
  }, [role]);

  async function startSelectedExam() {
    const token = localStorage.getItem("access_token") || "";
    if (!selectedExamId) {
      setExamError("Please select an exam.");
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
      setExamError(err instanceof Error ? err.message : "Could not start exam.");
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("exam_token");
    localStorage.removeItem("active_exam_id");
    window.location.href = "/";
  };

  // ---------- Examiner: full sidebar dashboard ----------
  if (role === "examiner") {
    const navItems: { key: ExaminerSection; label: string }[] = [
      { key: "overview", label: "Dashboard" },
      { key: "profile", label: "Profile" },
      { key: "students", label: "Students" },
      { key: "questions", label: "Question Bank" },
      { key: "exams", label: "Exams" },
      { key: "mock", label: "Mock Exam" },
      { key: "assign", label: "Assign Exams" },
      { key: "monitoring", label: "Live Monitoring" },
      { key: "evaluation", label: "AI Evaluation" },
      { key: "results", label: "Results" },
   ];

    return (
      <div style={examinerStyles.shell}>
        <aside style={examinerStyles.sidebar}>
          <div style={examinerStyles.profileBox}>
            <div style={examinerStyles.avatar}>
              {(fullName || email || "E").charAt(0).toUpperCase()}
            </div>
            <div style={examinerStyles.profileName}>{fullName || "Examiner"}</div>
            <div style={examinerStyles.profileEmail}>{email}</div>
            <div style={examinerStyles.roleChip}>Examiner</div>
          </div>

          <nav style={examinerStyles.nav}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                style={{
                  ...examinerStyles.navItem,
                  ...(activeSection === item.key ? examinerStyles.navItemActive : {}),
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button onClick={handleLogout} style={examinerStyles.logoutButton}>
            Sign out
          </button>
        </aside>

        <main style={examinerStyles.main}>
          {activeSection === "overview" && (
            <div>
              <h1 style={examinerStyles.pageTitle}>Welcome back{fullName ? `, ${fullName}` : ""}</h1>
              <p style={examinerStyles.pageSubtitle}>
                Manage your question bank, build exams, monitor live sessions,
                and review results — all from this dashboard.
              </p>
              <div style={examinerStyles.overviewGrid}>
                <button onClick={() => setActiveSection("questions")} style={examinerStyles.overviewCard}>
                  <div style={examinerStyles.overviewCardTitle}>Question Bank</div>
                  <div style={examinerStyles.overviewCardText}>Create and manage questions</div>
                </button>
                <button onClick={() => setActiveSection("exams")} style={examinerStyles.overviewCard}>
                  <div style={examinerStyles.overviewCardTitle}>Exams</div>
                  <div style={examinerStyles.overviewCardText}>Build and configure exams</div>
                </button>
                <button onClick={() => setActiveSection("evaluation")} style={examinerStyles.overviewCard}>
                  <div style={examinerStyles.overviewCardTitle}>AI Evaluation</div>
                  <div style={examinerStyles.overviewCardText}>Review and grade subjective answers</div>
                </button>
                <button onClick={() => setActiveSection("monitoring")} style={examinerStyles.overviewCard}>
                  <div style={examinerStyles.overviewCardTitle}>Live Monitoring</div>
                  <div style={examinerStyles.overviewCardText}>Watch active exam sessions</div>
                </button>
              </div>
            </div>
          )}

          {activeSection === "questions" && (
            <SectionRedirect
              title="Question Bank"
              description="Create MCQ, short/long answer, and image-upload questions with difficulty, tags, and marks."
              href="/examiner/questions"
              buttonLabel="Open Question Bank"
            />
          )}

          {activeSection === "exams" && (
            <SectionRedirect
              title="Exams"
              description="Create exams, choose questions from your bank, and configure duration, randomization, negative marking, and proctoring rules."
              href="/examiner/create"
              buttonLabel="Create / Manage Exams"
            />
          )}

          {activeSection === "mock" && (
            <div>
              <h1 style={examinerStyles.pageTitle}>Mock Exam</h1>
              <p style={examinerStyles.pageSubtitle}>
                Let students try a short practice run before the real exam, so
                they're familiar with the interface, timer, and proctoring
                checks beforehand.
              </p>
              <div style={examinerStyles.demoNotice}>
                This feature is planned but not yet built. When ready, you'll
                be able to mark any exam as a &quot;mock&quot; exam that
                doesn&apos;t count toward final results.
              </div>
            </div>
          )}

          {activeSection === "assign" && (
            <div>
              <h1 style={examinerStyles.pageTitle}>Assign Exams</h1>
              <p style={examinerStyles.pageSubtitle}>
                Every exam you create already supports per-student randomized
                papers — when &quot;Randomize questions&quot; is enabled, each
                student receives their own shuffled question order and
                selection, deterministically generated from their student ID.
              </p>
              <div style={examinerStyles.demoNotice}>
                To control this, open an exam in &quot;Exams&quot; and check
                the randomization mode (&quot;per student&quot; vs
                &quot;shared&quot;) when creating it. A dedicated
                per-student assignment view (choosing exactly which students
                get which exam) is planned for a future update.
              </div>
            </div>
          )}

          {activeSection === "monitoring" && (
            <LiveMonitoringSection />
          )}

          {activeSection === "evaluation" && (
            <SectionRedirect
              title="AI Evaluation"
              description="MCQ answers are auto-graded instantly. Short and long answers are queued here for manual review and scoring."
              href="/examiner/grading"
              buttonLabel="Open Grading Portal"
            />
          )}

          {activeSection === "results" && (
            <ResultsSection />
          )}

          {activeSection === "profile" && (
            <div>
              <h1 style={examinerStyles.pageTitle}>Profile</h1>
              <p style={examinerStyles.pageSubtitle}>Your account details.</p>
              <div style={examinerStyles.list}>
                <div style={examinerStyles.listRow}>
                  <div style={examinerStyles.rowTitle}>Full name</div>
                  <div style={examinerStyles.rowMeta}>{fullName || "—"}</div>
                </div>
                <div style={examinerStyles.listRow}>
                  <div style={examinerStyles.rowTitle}>Email</div>
                  <div style={examinerStyles.rowMeta}>{email || "—"}</div>
                </div>
                <div style={examinerStyles.listRow}>
                  <div style={examinerStyles.rowTitle}>Role</div>
                  <div style={examinerStyles.rowMeta}>Examiner</div>
                </div>
              </div>
            </div>
          )}


{activeSection === "students" && (
  <div>
    <h1 style={examinerStyles.pageTitle}>Students</h1>
    <p style={examinerStyles.pageSubtitle}>
      A full student roster and per-student performance view is planned
      for a future update.
    </p>
    <div style={examinerStyles.demoNotice}>
      This section isn't built yet.
    </div>
  </div>
)}
        </main>
      </div>
    );
  }

  // ---------- Admin: unchanged simple card ----------
  if (role === "admin") {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <header style={styles.header}>
            <div>
              <div style={styles.badge}>AI-Proctored</div>
              <h1 style={styles.title}>Admin dashboard</h1>
              <p style={styles.subtitle}>
                You can oversee users, exams, and platform activity from here.
              </p>
            </div>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Sign out
            </button>
          </header>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Quick access</h2>
              <p style={styles.cardText}>
                Open the main actions for managing content and users.
              </p>
              <div style={styles.buttonGroup}>
                <Link href="/examiner/questions" style={styles.primaryButton}>Manage questions</Link>
                <Link href="/examiner/create" style={styles.secondaryButton}>Create exam</Link>
                <Link href="/examiner/grading" style={styles.secondaryButton}>Grade answers</Link>
                <Link href="/admin" style={styles.secondaryButton}>Full admin dashboard</Link>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Role</h2>
              <p style={styles.cardText}>Signed in as admin</p>
              <div style={styles.roleChip}>admin</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Student: sidebar dashboard (matches examiner layout) ----------
  const studentNavItems: { key: string; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "profile", label: "Profile" },
    { key: "mock", label: "Mock Tests" },
    { key: "exams", label: "My Exams" },
    { key: "performance", label: "Performance" },
    { key: "results", label: "Results" },
  ];
  return (
  <div style={examinerStyles.shell}>
    <aside style={examinerStyles.sidebar}>
      <div style={examinerStyles.profileBox}>
        <div style={examinerStyles.avatar}>
          {(fullName || email || "S").charAt(0).toUpperCase()}
        </div>
        <div style={examinerStyles.profileName}>{fullName || "Student"}</div>
        <div style={examinerStyles.profileEmail}>{email}</div>
        <div style={examinerStyles.roleChip}>Student</div>
      </div>

      <nav style={examinerStyles.nav}>
        {studentNavItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setStudentSection(item.key)}
            style={{
              ...examinerStyles.navItem,
              ...(studentSection === item.key ? examinerStyles.navItemActive : {}),
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <button onClick={handleLogout} style={examinerStyles.logoutButton}>
        Sign out
      </button>
    </aside>

    <main style={examinerStyles.main}>
      {studentSection === "dashboard" && (
        <div>
          <h1 style={examinerStyles.pageTitle}>Welcome back{fullName ? `, ${fullName}` : ""}</h1>
          <p style={examinerStyles.pageSubtitle}>
            Choose an open exam below and start when you're ready.
          </p>

          {examError ? <div style={styles.errorBox}>{examError}</div> : null}
          {examsLoading ? (
            <p style={examinerStyles.pageSubtitle}>Loading available exams...</p>
          ) : exams.length === 0 ? (
            <div style={examinerStyles.demoNotice}>No exams are currently available.</div>
          ) : (
            <div style={styles.examList}>
              {exams.map((exam) => (
                <label key={exam.id} style={styles.examItem}>
                  <input
                    type="radio"
                    name="exam"
                    checked={selectedExamId === exam.id}
                    onChange={() => setSelectedExamId(exam.id)}
                  />
                  <div>
                    <div style={styles.examItemTitle}>{exam.title}</div>
                    <div style={styles.examItemMeta}>
                      {exam.subject} &middot; {exam.duration_minutes} min
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          <button onClick={startSelectedExam} style={examinerStyles.primaryButton}>
            Start selected exam
          </button>
        </div>
      )}

      {studentSection === "profile" && (
        <div>
          <h1 style={examinerStyles.pageTitle}>Profile</h1>
          <p style={examinerStyles.pageSubtitle}>Your account details.</p>
          <div style={examinerStyles.list}>
            <div style={examinerStyles.listRow}>
              <div style={examinerStyles.rowTitle}>Full name</div>
              <div style={examinerStyles.rowMeta}>{fullName || "—"}</div>
            </div>
            <div style={examinerStyles.listRow}>
              <div style={examinerStyles.rowTitle}>Email</div>
              <div style={examinerStyles.rowMeta}>{email || "—"}</div>
            </div>
            <div style={examinerStyles.listRow}>
              <div style={examinerStyles.rowTitle}>Role</div>
              <div style={examinerStyles.rowMeta}>Student</div>
            </div>
          </div>
        </div>
      )}

      {studentSection === "mock" && (
        <div>
          <h1 style={examinerStyles.pageTitle}>Mock Tests</h1>
          <p style={examinerStyles.pageSubtitle}>
            Practice runs to get familiar with the exam interface and
            proctoring checks before the real exam.
          </p>
          <div style={examinerStyles.demoNotice}>
            This feature isn't built yet.
          </div>
        </div>
      )}

      {studentSection === "exams" && (
        <div>
          <h1 style={examinerStyles.pageTitle}>My Exams</h1>
          <p style={examinerStyles.pageSubtitle}>
            All exams currently open and available to you.
          </p>
          {exams.length === 0 ? (
            <div style={examinerStyles.demoNotice}>No exams available right now.</div>
          ) : (
            <div style={examinerStyles.list}>
              {exams.map((exam) => (
                <div key={exam.id} style={examinerStyles.listRow}>
                  <div>
                    <div style={examinerStyles.rowTitle}>{exam.title}</div>
                    <div style={examinerStyles.rowMeta}>
                      {exam.subject} &middot; {exam.duration_minutes} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {studentSection === "performance" && (
        <div>
          <h1 style={examinerStyles.pageTitle}>Performance</h1>
          <p style={examinerStyles.pageSubtitle}>
            Track your scores and progress across exams over time.
          </p>
          <div style={examinerStyles.demoNotice}>
            This feature isn't built yet.
          </div>
        </div>
      )}

      {studentSection === "results" && (
        <div>
          <h1 style={examinerStyles.pageTitle}>Results</h1>
          <p style={examinerStyles.pageSubtitle}>
            View your final scores once exams are graded.
          </p>
          <Link href="/results" style={examinerStyles.primaryButton}>
            View my results
          </Link>
        </div>
      )}
    </main>
  </div>
  );
}



// ---------- Reusable small components for examiner sections ----------

function SectionRedirect({
  title,
  description,
  href,
  buttonLabel,
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <div>
      <h1 style={examinerStyles.pageTitle}>{title}</h1>
      <p style={examinerStyles.pageSubtitle}>{description}</p>
      <Link href={href} style={examinerStyles.primaryButton}>
        {buttonLabel}
      </Link>
    </div>
  );
}

function LiveMonitoringSection() {
  const [sessions, setSessions] = useState<
    { student_name: string; exam_title: string; answered_count: number; suspicion_score: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("access_token") || "";
      try {
        const res = await fetch(`${API_BASE}/exams/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSessions(data.live_sessions || []);
        }
      } catch {
        // ignore, show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 style={examinerStyles.pageTitle}>Live Monitoring</h1>
      <p style={examinerStyles.pageSubtitle}>
        Students currently taking an exam right now.
      </p>
      {loading ? (
        <p style={examinerStyles.pageSubtitle}>Loading...</p>
      ) : sessions.length === 0 ? (
        <div style={examinerStyles.demoNotice}>
          No students are currently taking an exam.
        </div>
      ) : (
        <div style={examinerStyles.list}>
          {sessions.map((s, i) => (
            <div key={i} style={examinerStyles.listRow}>
              <div>
                <div style={examinerStyles.rowTitle}>{s.student_name}</div>
                <div style={examinerStyles.rowMeta}>
                  {s.exam_title} &middot; {s.answered_count} answered
                </div>
              </div>
              <div
                style={{
                  ...examinerStyles.suspicionTag,
                  color: s.suspicion_score > 50 ? "#dc2626" : "#15803d",
                }}
              >
                Suspicion: {s.suspicion_score}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsSection() {
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("access_token") || "";
      try {
        const res = await fetch(`${API_BASE}/exams/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setExams(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 style={examinerStyles.pageTitle}>Results</h1>
      <p style={examinerStyles.pageSubtitle}>
        Select an exam to review submissions and scores, or open the grading
        portal to score subjective answers directly.
      </p>
      {loading ? (
        <p style={examinerStyles.pageSubtitle}>Loading exams...</p>
      ) : exams.length === 0 ? (
        <div style={examinerStyles.demoNotice}>No exams created yet.</div>
      ) : (
        <div style={examinerStyles.list}>
          {exams.map((exam) => (
            <div key={exam.id} style={examinerStyles.listRow}>
              <div style={examinerStyles.rowTitle}>{exam.title}</div>
              <Link href="/examiner/grading" style={examinerStyles.smallLink}>
                Review answers
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
