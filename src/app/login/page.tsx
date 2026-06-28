'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@example.com');
  const [name, setName] = useState('Workspace Owner');
  const [role, setRole] = useState<'owner' | 'editor' | 'viewer'>('owner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickSelect = async (selEmail: string, selName: string, selRole: 'owner' | 'editor' | 'viewer') => {
    setEmail(selEmail);
    setName(selName);
    setRole(selRole);
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: selEmail,
        name: selName,
        role: selRole,
        redirect: false,
      });

      if (result?.error) {
        setError('Login failed. Please check credentials.');
        setLoading(false);
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        name,
        role,
        redirect: false,
      });

      if (result?.error) {
        setError('Login failed. Please check credentials.');
        setLoading(false);
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden font-sans">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-650/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-650/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
            <Icon name="file" size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            EdTech DocSync
          </h1>
          <p className="text-sm text-slate-400 mt-2 text-center">
            Collaborative Local-First Document Workspace
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <Icon name="user" size={16} className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-500 text-sm">@</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Workspace Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['owner', 'editor', 'viewer'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-3 border rounded-xl text-xs font-medium capitalize transition ${
                    role === r
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-600/10 hover:shadow-purple-500/20 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Icon name="spinner" size={20} />
            ) : (
              <>
                <Icon name="shield" size={16} />
                <span>Enter Document Workspace</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
            Quick Sandbox Roles
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleQuickSelect('owner@example.com', 'Workspace Owner', 'owner')}
              className="w-full flex items-center justify-between p-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 rounded-xl text-left text-xs transition"
            >
              <div>
                <p className="font-semibold text-slate-300">Owner User</p>
                <p className="text-[10px] text-slate-500">owner@example.com</p>
              </div>
              <span className="text-[10px] bg-red-950/60 border border-red-800/40 text-red-400 px-2 py-0.5 rounded-full uppercase font-medium">
                Owner
              </span>
            </button>
            <button
              onClick={() => handleQuickSelect('editor@example.com', 'Workspace Editor', 'editor')}
              className="w-full flex items-center justify-between p-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 rounded-xl text-left text-xs transition"
            >
              <div>
                <p className="font-semibold text-slate-300">Editor User</p>
                <p className="text-[10px] text-slate-500">editor@example.com</p>
              </div>
              <span className="text-[10px] bg-blue-950/60 border border-blue-800/40 text-blue-400 px-2 py-0.5 rounded-full uppercase font-medium">
                Editor
              </span>
            </button>
            <button
              onClick={() => handleQuickSelect('viewer@example.com', 'Workspace Viewer', 'viewer')}
              className="w-full flex items-center justify-between p-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 rounded-xl text-left text-xs transition"
            >
              <div>
                <p className="font-semibold text-slate-300">Viewer User</p>
                <p className="text-[10px] text-slate-500">viewer@example.com</p>
              </div>
              <span className="text-[10px] bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-medium">
                Viewer
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
