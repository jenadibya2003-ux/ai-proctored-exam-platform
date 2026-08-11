"use client";

import { useEffect, useState } from "react";
import AdminDashboardView from "../admin/dashboard/page";
import StudentDashboardPage from "../student/dashboard/page";
import ExaminerDashboardPage from "../examiner/dashboard/page";

type Role = "admin" | "examiner" | "student" | "user";

export default function DashboardPage() {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("user_role") as Role | null;
    const token = localStorage.getItem("access_token") || "";

    if (storedRole) {
      setRole(storedRole);
      return;
    }

    try {
      const payload = token.split(".")[1];
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(atob(normalized));
      setRole(decoded.role || "student");
    } catch {
      setRole("student");
    }
  }, []);

  if (!role) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#ffffff", fontFamily: "Inter, sans-serif" }}>
        Loading dashboard...
      </div>
    );
  }

  if (role === "examiner") {
    return <ExaminerDashboardPage />;
  }

  if (role === "admin") {
    return <AdminDashboardView />;
  }

  return <StudentDashboardPage />;
}