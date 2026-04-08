import { useState } from "react";

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "user" && password === "password") {
      onLogin();
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">Welcome To</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">Kanban Studio</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-purple-800 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Hint: Use <span className="font-semibold text-gray-900">user</span> & <span className="font-semibold text-gray-900">password</span>
        </p>
      </div>
    </div>
  );
}
