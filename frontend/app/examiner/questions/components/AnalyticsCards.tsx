"use client";

type Props = {
  questions: any[];
};

export default function AnalyticsCards({ questions }: Props) {
  const total = questions.length;
  const easy = questions.filter(q => q.difficulty === "easy").length;
  const medium = questions.filter(q => q.difficulty === "medium").length;
  const hard = questions.filter(q => q.difficulty === "hard").length;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
      gap: "15px",
      marginBottom: "20px"
    }}>
      <div style={cardStyle}>📚<br/>Total<br/><b>{total}</b></div>
      <div style={cardStyle}>🟢<br/>Easy<br/><b>{easy}</b></div>
      <div style={cardStyle}>🟡<br/>Medium<br/><b>{medium}</b></div>
      <div style={cardStyle}>🔴<br/>Hard<br/><b>{hard}</b></div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "10px",
  padding: "15px",
  textAlign: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};