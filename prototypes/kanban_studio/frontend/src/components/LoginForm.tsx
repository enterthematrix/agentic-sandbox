import { useState } from "react";

interface LoginFormProps {
  onLogin: (token: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onLogin(data.access_token);
      } else {
        const errData = await res.json().catch(() => ({ detail: "Invalid credentials" }));
        setError(errData.detail || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login attempt failed:", err);
      setError("Failed to connect to server");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[var(--shadow)] border border-[var(--stroke)]">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">Welcome To</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--navy-dark)]">Kanban Studio</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-[var(--gray-text)] uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="w-full rounded-lg border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3 text-sm focus:border-[var(--primary-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-blue)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--gray-text)] uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="w-full rounded-lg border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3 text-sm focus:border-[var(--primary-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-blue)]"
            />
          </div>

          {error && <p className="text-sm text-red-600 text-center font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--primary-blue)] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 focus:outline-none transition-colors"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--gray-text)]">
          Hint: Use <span className="font-semibold text-[var(--navy-dark)]">user</span> & <span className="font-semibold text-[var(--navy-dark)]">password</span>
        </p>
      </div>
    </div>
  );
}
