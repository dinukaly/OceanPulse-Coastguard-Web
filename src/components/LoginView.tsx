import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Verify credentials and role authorization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-marine-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background nautical grid decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Decorative radar circle */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-blue-500/10 pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full border border-blue-500/10 pointer-events-none" />

      <div className="w-full max-w-md bg-marine-900/90 backdrop-blur-xl border border-marine-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        {/* Crest & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-900 border border-blue-400/30 shadow-lg mb-3">
            <Shield className="w-8 h-8 text-blue-200" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-wider uppercase">
            OceanPulse Command
          </h2>
          <p className="text-xs text-blue-300/80 font-medium mt-0.5">
            Maritime Rescue Coordination Centre (MRCC)
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-marine-950 border border-marine-800 text-[11px] text-radar-lime">
            <span className="w-1.5 h-1.5 rounded-full bg-radar-lime animate-pulse" />
            <span>OPERATIONAL MARITIME SURVEILLANCE</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Station Officer Email:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="coastguard.hq@oceanpulse.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-marine-950 border border-marine-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Command Access Password:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-marine-950 border border-marine-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Command Center'}
          </button>
        </form>

      </div>
    </div>
  );
};
