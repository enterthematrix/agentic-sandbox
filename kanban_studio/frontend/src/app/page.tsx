"use client";

import { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LoginForm } from "@/components/LoginForm";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("kanban_token");
      setIsAuthenticated(!!token);
    };
    checkToken();
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem("kanban_token", token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("kanban_token");
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
