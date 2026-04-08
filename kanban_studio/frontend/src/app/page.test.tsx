import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Home from "./page";

// Mock resize observer for DnD kit
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

describe("Home Page Authentication", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders LoginForm when not authenticated", () => {
    render(<Home />);
    expect(screen.getByText("Welcome To")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter username...")).toBeInTheDocument();
  });

  it("renders KanbanBoard when authenticated via localStorage", () => {
    localStorage.setItem("kanban_auth", "true");
    render(<Home />);
    expect(screen.queryByText("Welcome To")).not.toBeInTheDocument();
    expect(screen.getByText("One board. Five columns. Zero clutter.")).toBeInTheDocument();
  });

  it("handles login flow correctly", () => {
    render(<Home />);
    
    // Simulate Login
    const usernameInput = screen.getByPlaceholderText("Enter username...");
    const passwordInput = screen.getByPlaceholderText("Enter password...");
    const loginButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(usernameInput, { target: { value: "user" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.click(loginButton);

    expect(localStorage.getItem("kanban_auth")).toBe("true");
    expect(screen.getByText("One board. Five columns. Zero clutter.")).toBeInTheDocument();
  });
});
