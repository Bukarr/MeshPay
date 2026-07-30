import React, { useState } from 'react';
import { Lock, Mail, User, ShieldCheck, KeyRound, Sparkles, X, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { UserProfile } from '../types';
import { saveUserProfile } from '../lib/storage';
import { generateSvgAvatar } from '../lib/avatarHelper';
import { INITIAL_USER_PROFILE } from '../data/mockData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
}) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('adewale.lawson@meshpay.io');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Adewale Lawson');
  const [userTag, setUserTag] = useState('$adewale_l');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score, label: 'Medium', color: 'bg-amber-500' };
    return { score, label: 'Strong (Secure)', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Log in with existing profile or default
      const profile: UserProfile = {
        ...INITIAL_USER_PROFILE,
        email: email,
        name: fullName || 'Adewale Lawson'
      };
      saveUserProfile(profile);
      onAuthSuccess(profile);
      onClose();
    }, 800);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password || !fullName) {
      setError('Please provide all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newProfile: UserProfile = {
        name: fullName,
        email: email,
        phone: '08012345678',
        tag: userTag.startsWith('$') ? userTag : `$${userTag}`,
        avatar: generateSvgAvatar(fullName),
        usdBalance: 1000.00,
        ngnBalance: 500000.00,
        virtualAccountNgn: '9' + Math.floor(100000000 + Math.random() * 900000000),
        virtualAccountUsd: '4' + Math.floor(10000000001 + Math.random() * 90000000000),
        bankName: 'MeshPay Account',
        tier: 'Tier 3 (Verified)',
        pin: '1234',
        biometricEnabled: true,
        kycVerified: true,
        publicKey: 'mp_sec_0x' + Math.random().toString(36).substring(2, 10)
      };

      saveUserProfile(newProfile);
      onAuthSuccess(newProfile);
      onClose();
    }, 1000);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(`Password reset link dispatched to ${email}. Check your inbox!`);
    }, 900);
  };

  const handleQuickDemoLogin = () => {
    saveUserProfile(INITIAL_USER_PROFILE);
    onAuthSuccess(INITIAL_USER_PROFILE);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800">
        {/* Header Branding */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">MeshPay Account</h3>
              <p className="text-xs text-slate-300">Secure Cross-Border & Offline Vault</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
            <button
              onClick={() => {
                setTab('signin');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === 'signin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === 'signup' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => {
                setTab('forgot');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === 'forgot' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@meshpay.io"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to MeshPay'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: SIGN UP */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adewale Lawson"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="adewale@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Create MeshPay Tag</label>
                <input
                  type="text"
                  value={userTag}
                  onChange={(e) => setUserTag(e.target.value)}
                  placeholder="$adewale_l"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-600"
                />

                {/* Password Strength Indicator */}
                {password && (
                  <div className="pt-1 space-y-1">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 rounded-full ${
                            step <= strength.score ? strength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 block">
                      Strength: <span className="text-slate-800">{strength.label}</span>
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Account...' : 'Create Account & Open Vault'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {tab === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-600">
                Enter your registered MeshPay email. We will send a secure password reset link to re-encrypt your key vault.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@flashpay.io"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Sending Link...' : 'Dispatch Reset Link'}
                <KeyRound className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Fast Quick Demo Sign In */}
          <div className="pt-2 border-t border-slate-200 text-center space-y-2">
            <span className="text-[11px] text-slate-400 block font-medium">Hackathon Fast-Track</span>
            <button
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Quick Login as Demo User (Adewale Lawson)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
