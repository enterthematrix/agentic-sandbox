import type { BoardData, Card } from "@/lib/kanban";

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("kanban_token") : null;
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

export async function fetchBoard(): Promise<BoardData> {
  const res = await fetch("/api/board", {
    headers: getAuthHeader()
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch board: ${res.status}`);
  }
  return res.json();
}

export async function saveBoard(board: BoardData): Promise<void> {
  const res = await fetch("/api/board", {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeader()
    },
    body: JSON.stringify(board),
  });
  if (!res.ok) {
    throw new Error(`Failed to save board: ${res.status}`);
  }
}

export async function addCardToApi(columnId: string, title: string, details: string): Promise<Card> {
  const res = await fetch("/api/board/cards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader()
    },
    body: JSON.stringify({ column_id: columnId, title, details }),
  });
  if (!res.ok) {
    throw new Error(`Failed to add card: ${res.status}`);
  }
  return res.json();
}

