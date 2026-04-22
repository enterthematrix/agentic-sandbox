const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface FormData {
  purpose: string;
  effective_date: string;
  mnda_term: string;
  confidentiality_term: string;
  governing_law: string;
  jurisdiction: string;
}

export interface Session {
  id: string;
  document_type: string;
  form_data: FormData;
  created_at: string;
  updated_at: string;
}

export interface PopulatedDocument {
  content: string;
  filename: string;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatResponse {
  message: string;
  form_data?: FormData;
  is_complete: boolean;
}

export interface TemplateInfo {
  name: string;
  description: string;
  filename: string;
  supported: boolean;
}

export interface TemplateListResponse {
  templates: TemplateInfo[];
  total: number;
}

export async function generateDocument(
  documentType: string,
  formData: FormData
): Promise<PopulatedDocument> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_type: documentType,
      form_data: formData,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to generate document: ${res.statusText}`);
  }

  return res.json();
}

export async function createSession(
  documentType: string,
  formData: FormData
): Promise<Session> {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_type: documentType,
      form_data: formData,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create session: ${res.statusText}`);
  }

  return res.json();
}

export async function sendChatMessage(
  messages: ChatMessage[],
  documentType: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      document_type: documentType,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to send chat message: ${res.statusText}`);
  }

  return res.json();
}

export async function getTemplates(): Promise<TemplateListResponse> {
  const res = await fetch(`${API_BASE}/api/templates`);

  if (!res.ok) {
    throw new Error(`Failed to fetch templates: ${res.statusText}`);
  }

  return res.json();
}
