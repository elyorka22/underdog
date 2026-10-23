"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-root admin-login">
      <form onSubmit={onSubmit}>
        <h1 style={{ margin: 0 }}>UnderDog Admin</h1>
        <p className="admin-muted" style={{ margin: 0 }}>
          Sign in with ADMIN_PASSWORD (or ADMIN_TOKEN fallback).
        </p>
        <input
          className="admin-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
        />
        {error ? <div className="admin-bad">{error}</div> : null}
        <button className="admin-btn primary" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
