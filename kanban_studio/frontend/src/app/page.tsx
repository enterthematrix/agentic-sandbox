"use client";

import { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LoginForm } from "@/components/LoginForm";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem("kanban_auth");
    setIsAuthenticated(storedAuth === "true");
  }, []);

  const handleLogin = () => {
    localStorage.setItem("kanban_auth", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("kanban_auth");
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return null; // Avoid hydration mismatch
  }

  return isAuthenticated ? (
    <KanbanBoard onLogout={handleLogout} />
  ) : (
    <LoginForm onLogin={handleLogin} />
  );
}
