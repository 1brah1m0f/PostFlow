'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [noAccount, setNoAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNoAccount(false);
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.detail === 'NO_ACCOUNT') { setNoAccount(true); return; }
        throw new Error(data.detail === 'WRONG_PASSWORD' ? 'Incorrect password.' : 'Login failed.');
      }
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — photo */}
      <div className="hidden lg:block w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&h=1600&fit=crop"
          alt="Workspace"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pf-brown/80 via-pf-brown/10 to-transparent" />
        <div className="absolute bottom-12 left-10 right-10">
          <p className="text-pf-cream text-xl font-medium leading-relaxed">
            "Organized creativity isn't about restricting ideas; it's about building a solid foundation so they can actually take flight."
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 bg-pf-cream flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm space-y-8">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#A6B366">
              <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,.04.75C2.63,12.81,5.06,8.5,17,8Z"/>
            </svg>
            <span className="font-bold text-pf-brown text-base tracking-tight">PostFlow</span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-pf-brown tracking-tight">Welcome back</h1>
            <p className="text-sm text-pf-brown/60">Sign in to continue organizing your workflow.</p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-pf-brown/60 uppercase tracking-wider">Email address</label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-pf-tan/40 rounded-lg text-sm text-pf-brown placeholder-pf-brown/30 outline-none focus:border-pf-green focus:ring-2 focus:ring-pf-green/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-pf-brown/60 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs text-pf-brown/40 hover:text-pf-rust transition-colors">Forgot password?</a>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-pf-tan/40 rounded-lg text-sm text-pf-brown placeholder-pf-brown/30 outline-none focus:border-pf-green focus:ring-2 focus:ring-pf-green/20 transition-all tracking-widest"
              />
            </div>

            {noAccount && (
              <div className="p-3 bg-pf-tan/20 border border-pf-tan rounded-lg text-xs text-pf-brown">
                No account found with this email.{' '}
                <Link href="/register" className="font-semibold text-pf-rust underline">Create an account →</Link>
              </div>
            )}
            {error && <p className="text-xs text-pf-rust">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pf-green hover:bg-pf-green/80 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-xs text-center text-pf-brown/50">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold text-pf-rust hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
