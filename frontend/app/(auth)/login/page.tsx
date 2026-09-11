'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Sparkles, Mail, Lock, ArrowRight, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.auth.login(email, password);
      login(token, user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Floating blobs */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
      <div className="absolute bottom-[-15%] right-[-10%] h-[450px] w-[450px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, #ec4899, transparent 70%)' }} />
      <div className="absolute top-[40%] right-[20%] h-[300px] w-[300px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
      <div className="absolute bottom-[20%] left-[15%] h-[250px] w-[250px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #f97316, transparent 70%)' }} />

      <div className="relative w-full max-w-md px-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4 glossy" style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%)',
            boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(236,72,153,0.2)'
          }}>
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-1">Job Automation</h1>
          <p className="text-sm" style={{ color: 'rgba(192,132,252,0.6)' }}>Platform · Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="rainbow-border rounded-2xl">
          <div className="rounded-2xl p-8 glossy" style={{
            background: 'rgba(5,5,20,0.8)',
            backdropFilter: 'blur(20px)',
          }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: 'rgba(192,132,252,0.8)' }}>Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(168,85,247,0.5)' }} />
                  <Input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: 'rgba(192,132,252,0.8)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(168,85,247,0.5)' }} />
                  <Input
                    type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} className="relative w-full glossy rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed" style={{
                background: loading
                  ? 'rgba(124,58,237,0.4)'
                  : 'linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%)',
                boxShadow: loading ? 'none' : '0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(236,72,153,0.15)',
              }}>
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" /> Sign In <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </span>
              </button>

              <p className="text-center text-sm" style={{ color: 'rgba(148,163,184,0.6)' }}>
                No account?{' '}
                <Link href="/register" className="font-medium transition-colors" style={{ color: '#c084fc' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f472b6')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c084fc')}>
                  Create one free →
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
