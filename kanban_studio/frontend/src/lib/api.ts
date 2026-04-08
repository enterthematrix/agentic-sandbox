import type { BoardData } from "@/lib/kanban";

export async function fetchBoard(): Promise<BoardData> {
  const res = await fetch("/api/board");
  if (!res.ok) {
    throw new Error(`Failed to fetch board: ${res.status}`);
  }
  return res.json();
}

export async function saveBoard(board: BoardData): Promise<void> {
  const res = await fetch("/api/board", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(board),
  });
  if (!res.ok) {
    throw new Error(`Failed to save board: ${res.status}`);
  }
}
