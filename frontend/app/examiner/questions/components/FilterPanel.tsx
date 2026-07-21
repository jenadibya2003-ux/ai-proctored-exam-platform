"use client";

type Props = {
  subject: string;
  setSubject: (v: string) => void;

  difficulty: string;
  setDifficulty: (v: string) => void;

  type: string;
  setType: (v: string) => void;
};

export default function FilterPanel({
  subject,
  setSubject,
  difficulty,
  setDifficulty,
  type,
  setType,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        gap: "15px",
        marginBottom: "25px",
      }}
    >
      <input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      >
        <option value="">All Difficulties</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="">All Types</option>
        <option value="mcq">MCQ</option>
        <option value="multi_select">MSQ</option>
        <option value="short_answer">Short Answer</option>
        <option value="long_answer">Long Answer</option>
        <option value="image_upload">Image Upload</option>
      </select>
    </div>
  );
}