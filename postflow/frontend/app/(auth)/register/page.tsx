"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmEmail, setConfirmEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else if (data.session) {
      // Auto-confirmed (email confirmation disabled in Supabase dashboard)
      router.replace("/dashboard");
    } else {
      // Email confirmation required
      setConfirmEmail(true);
    }
  };

  if (confirmEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#d4edda] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-[#3a6b3e]" />
          </div>
          <h2 className="text-lg font-bold text-brand-dark mb-2">Check your email</h2>
          <p className="text-sm text-brand-gray mb-4">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" className="text-brand-rust font-semibold hover:underline text-sm">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-brand-dark mb-1">Create account</h1>
          <p className="text-sm text-brand-gray mb-6">Start scheduling your posts</p>

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
                <input id="email" type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  required className="input-base pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-brand-gray mb-1.5">
                Password <span className="text-brand-gray/50">(min. 6 characters)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                <input id="password" type="password" autoComplete="new-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  required minLength={6} className="input-base pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-xs font-medium text-brand-gray mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                <input id="confirm" type="password" autoComplete="new-password" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••"
                  required className="input-base pl-10" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-brand-gray mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-rust font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
