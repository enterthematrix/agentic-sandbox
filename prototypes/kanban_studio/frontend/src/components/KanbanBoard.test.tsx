import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { KanbanBoard } from "@/components/KanbanBoard";

// Use a static board fixture inside the factory to avoid hoisting issues
vi.mock("@/lib/api", () => {
  const board = {
    columns: [
      { id: "col-backlog", title: "Backlog", cardIds: ["card-1"] },
      { id: "col-discovery", title: "Discovery", cardIds: [] },
      { id: "col-progress", title: "In Progress", cardIds: [] },
      { id: "col-review", title: "Review", cardIds: [] },
      { id: "col-done", title: "Done", cardIds: [] },
    ],
    cards: {
      "card-1": { id: "card-1", title: "Align roadmap themes", details: "Details." },
    },
  };
  return {
    fetchBoard: vi.fn().mockResolvedValue(board),
    saveBoard: vi.fn().mockResolvedValue(undefined),
  };
});

import { fetchBoard, saveBoard } from "@/lib/api";

const getFirstColumn = async () => {
  const columns = await screen.findAllByTestId(/column-/i);
  return columns[0];
};

describe("KanbanBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state then renders board from API", async () => {
    render(<KanbanBoard />);
    expect(screen.getByText(/loading board/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByTestId(/column-/i)).toHaveLength(5)
    );
    expect(fetchBoard).toHaveBeenCalledOnce();
  });

  it("renders five columns after load", async () => {
    render(<KanbanBoard />);
    await waitFor(() =>
      expect(screen.getAllByTestId(/column-/i)).toHaveLength(5)
    );
  });

  it("renames a column and triggers a debounced save", async () => {
    render(<KanbanBoard />);
    const column = await getFirstColumn();
    const input = within(column).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(input).toHaveValue("New Name");
    await waitFor(() => expect(saveBoard).toHaveBeenCalled(), { timeout: 1000 });
  });

  it("adds and removes a card, triggering saves", async () => {
    render(<KanbanBoard />);
    const column = await getFirstColumn();

    await userEvent.click(
      within(column).getByRole("button", { name: /add a card/i })
    );
    await userEvent.type(within(column).getByPlaceholderText(/card title/i), "New card");
    await userEvent.type(within(column).getByPlaceholderText(/details/i), "Notes");
    await userEvent.click(within(column).getByRole("button", { name: /add card/i }));

    expect(within(column).getByText("New card")).toBeInTheDocument();

    await userEvent.click(
      within(column).getByRole("button", { name: /delete new card/i })
    );
    expect(within(column).queryByText("New card")).not.toBeInTheDocument();

    await waitFor(() => expect(saveBoard).toHaveBeenCalled(), {
      timeout: 1500,
    });
  });
});
