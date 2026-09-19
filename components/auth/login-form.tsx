"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/admin/dashboard";
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-7 shadow-2xl">
      <label className="block text-sm font-semibold">Email</label>
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-black"
        placeholder="admin@example.com"
      />

      <label className="mt-5 block text-sm font-semibold">Password</label>
      <input
        required
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-black"
        placeholder="••••••••"
      />

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <button
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
