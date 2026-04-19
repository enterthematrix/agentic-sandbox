import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterAll } from "vitest";
import { initialData } from "@/lib/kanban";
import Home from "./page";

// Mock the API so KanbanBoard doesn't hang on fetch after login
vi.mock("@/lib/api", () => ({
  fetchBoard: vi.fn().mockResolvedValue(initialData),
  saveBoard: vi.fn().mockResolvedValue(undefined),
}));

describe("Home Page Authentication", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "fake-token" }),
    }) as any;
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("renders LoginForm when not authenticated", () => {
    render(<Home />);
    expect(screen.getByText("Welcome To")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter username...")).toBeInTheDocument();
  });

  it("renders KanbanBoard when authenticated via localStorage", async () => {
    localStorage.setItem("kanban_token", "fake-token");
    render(<Home />);
    
    // The checkToken runs in a useEffect, so we need to wait
    await waitFor(() => {
      expect(screen.queryByText("Welcome To")).not.toBeInTheDocument();
    });

    // Wait for board to finish loading from (mocked) API
    await waitFor(() =>
      expect(screen.getAllByTestId(/column-/i)).toHaveLength(5)
    );
  });

  it("handles login flow correctly", async () => {
    render(<Home />);

    const usernameInput = screen.getByPlaceholderText("Enter username...");
    const passwordInput = screen.getByPlaceholderText("Enter password...");
    const loginButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(usernameInput, { target: { value: "user" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(localStorage.getItem("kanban_token")).toBe("fake-token");
    });
    
    // Wait for board to load after login
    await waitFor(() =>
      expect(screen.getAllByTestId(/column-/i)).toHaveLength(5)
    );
  });
});

