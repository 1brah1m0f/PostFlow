"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.replace("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-rust flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-brand-dark tracking-tight">PostFlow</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-xl font-bold text-brand-dark mb-1">Welcome back</h1>
          <p className="text-sm text-brand-gray mb-6">Sign in to your account</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-brand-rust text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-brand-gray mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-base pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-brand-gray mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-base pl-10"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-brand-gray mt-4">
          No account?{" "}
          <Link href="/register" className="text-brand-rust font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
