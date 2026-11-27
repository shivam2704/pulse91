import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, LogOut, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, isSupabaseConfigured } from '../services/supabaseAuth';

export default function AuthModal({ isOpen, onClose, user, onAuthSuccess }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('SIGN_IN'); // 'SIGN_IN' or 'SIGN_UP'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'SIGN_IN') {
        const res = await signInWithEmail(email, password);
        setSuccessMsg('Successfully signed in.');
        if (onAuthSuccess) onAuthSuccess(res.user);
        setTimeout(() => onClose(), 600);
      } else {
        const res = await signUpWithEmail(email, password);
        setSuccessMsg('Account created successfully! Check your email to confirm registration.');
        if (onAuthSuccess) onAuthSuccess(res.user);
        setTimeout(() => onClose(), 1200);
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const session = await signInWithGoogle();
      if (session?.user) {
        setSuccessMsg('Successfully signed in with Google.');
        if (onAuthSuccess) onAuthSuccess(session.user);
        setTimeout(() => onClose(), 500);
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('provider is not enabled')) {
        setError('Google Sign-In abhi Supabase Dashboard me disabled hai. Email/Password se sign in karein ya Supabase Auth → Providers me Google enable karein.');
      } else {
        setError(msg || 'Google sign-in failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      if (onAuthSuccess) onAuthSuccess(null);
      onClose();
    } catch (err) {
      setError(err?.message || 'Sign-out failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c101a] border border-[#20293d] rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2336]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                {user ? 'Account Settings' : mode === 'SIGN_IN' ? 'Sign In to Pulse91' : 'Create Account'}
              </h3>
              <p className="text-xs text-gray-400">
                {user ? user.email : 'Sync your portfolio & connect your broker'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#161d2d] hover:bg-[#20293d] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If Already Logged In */}
        {user ? (
          <div className="mt-5 space-y-4">
            <div className="bg-[#121724] border border-[#1e2638] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">STATUS</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  AUTHENTICATED
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">USER ID</span>
                <span className="text-gray-300 truncate max-w-[200px]" title={user.id}>
                  {user.id}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">EMAIL</span>
                <span className="text-white font-medium">{user.email}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed font-mono">
              🛡️ Your Demat sandbox, orders, and connected broker keys are strictly isolated to your user ID.
            </p>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="mt-5 space-y-4">
            {!isSupabaseConfigured && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs font-mono leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Supabase URL or Key not set in environment. Running in local fallback mode.
                </span>
              </div>
            )}

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 p-1 bg-[#121724] border border-[#1b2336] rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setMode('SIGN_IN'); setError(null); }}
                className={`py-1.5 rounded-lg transition-colors ${mode === 'SIGN_IN' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('SIGN_UP'); setError(null); }}
                className={`py-1.5 rounded-lg transition-colors ${mode === 'SIGN_UP' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#141a29] border border-[#222b40] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#141a29] border border-[#222b40] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 placeholder:text-gray-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'SIGN_IN' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Google OAuth Option */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1b2336]"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-[#0c101a] px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading || !isSupabaseConfigured}
              className="w-full flex items-center justify-center gap-2 bg-[#141a29] hover:bg-[#1a2236] text-gray-200 border border-[#222b40] py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              )}
              <span>{googleLoading ? 'Waiting for Google sign-in...' : 'Continue with Google'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
