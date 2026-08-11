"use client";

import React from "react";

type FormattedTextProps = {
  text: string;
  style?: React.CSSProperties;
  className?: string;
};

export default function FormattedText({ text, style, className }: FormattedTextProps) {
  if (!text) return null;

  // Helper to parse math symbols & LaTeX tokens
  const formatMathString = (raw: string) => {
    return raw
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
      .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\delta/g, "δ")
      .replace(/\\pi/g, "π")
      .replace(/\\theta/g, "θ")
      .replace(/\\lambda/g, "λ")
      .replace(/\\sum/g, "∑")
      .replace(/\\int/g, "∫")
      .replace(/\\infty/g, "∞")
      .replace(/\^2/g, "²")
      .replace(/\^3/g, "³")
      .replace(/\^n/g, "ⁿ");
  };

  // Helper to render code snippet block
  const renderCodeBlock = (code: string, lang?: string) => {
    const lines = code.trim().split("\n");

    return (
      <div
        style={{
          background: "#0f172a",
          color: "#f8fafc",
          borderRadius: "8px",
          padding: "0.85rem 1rem",
          margin: "0.6rem 0",
          fontFamily: "'Fira Code', 'Courier New', monospace",
          fontSize: "0.83rem",
          lineHeight: 1.5,
          overflowX: "auto",
          border: "1px solid #1e293b",
        }}
      >
        {lang && (
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", marginBottom: "0.4rem", letterSpacing: "0.5px" }}>
            {lang}
          </div>
        )}
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {lines.map((line, lIdx) => (
            <div key={lIdx}>{highlightLine(line)}</div>
          ))}
        </pre>
      </div>
    );
  };

  const highlightLine = (line: string) => {
    // Simple regex highlighting for common keywords, strings, comments
    if (line.trim().startsWith("//") || line.trim().startsWith("#")) {
      return <span style={{ color: "#64748b", fontStyle: "italic" }}>{line}</span>;
    }

    const tokens = line.split(/(\s+|[(),;={}[\]])/);
    const keywords = ["def", "class", "return", "if", "else", "for", "while", "import", "from", "public", "private", "void", "int", "string", "SELECT", "FROM", "WHERE", "JOIN", "function", "const", "let", "var"];

    return tokens.map((t, idx) => {
      if (keywords.includes(t)) {
        return <span key={idx} style={{ color: "#f43f5e", fontWeight: 700 }}>{t}</span>;
      }
      if (/^".*"$/.test(t) || /^'.*'$/.test(t)) {
        return <span key={idx} style={{ color: "#10b981" }}>{t}</span>;
      }
      if (/^\d+$/.test(t)) {
        return <span key={idx} style={{ color: "#fbbf24" }}>{t}</span>;
      }
      return t;
    });
  };

  // Check if text contains code block ```
  if (text.includes("```")) {
    const parts = text.split(/```/);
    return (
      <div style={style} className={className}>
        {parts.map((part, idx) => {
          if (idx % 2 === 1) {
            // Code block
            const firstLineEnd = part.indexOf("\n");
            let lang = "";
            let code = part;
            if (firstLineEnd !== -1) {
              const possibleLang = part.substring(0, firstLineEnd).trim();
              if (possibleLang && !possibleLang.includes(" ")) {
                lang = possibleLang;
                code = part.substring(firstLineEnd + 1);
              }
            }
            return <React.Fragment key={idx}>{renderCodeBlock(code, lang)}</React.Fragment>;
          } else {
            // Normal text with LaTeX math support
            return <span key={idx}>{formatMathString(part)}</span>;
          }
        })}
      </div>
    );
  }

  return (
    <div style={style} className={className}>
      {formatMathString(text)}
    </div>
  );
}
