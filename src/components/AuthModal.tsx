import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { auth, googleProvider } from '../services/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { SUPER_ADMIN_EMAIL, syncUserProfile } from '../services/firebaseDb';
import { ModalShell } from './ui/ModalShell';
import {
  Cloud,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  LogOut,
  RefreshCw,
  Database,
  ArrowRight,
  Crown,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengaliUtils';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    isSuperAdmin,
    isApproved,
    isCloudSyncing,
    migrateLocalData,
    signOutUser,
    savedDesigns,
    presets,
    showToast,
    setCurrentView,
    refreshUserProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'google' | 'login' | 'register'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [domainErrorHost, setDomainErrorHost] = useState<string | null>(null);
  const [copiedHost, setCopiedHost] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    setDomainErrorHost(null);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('গুগল অ্যাকাউন্ট সফলভাবে সংযুক্ত হয়েছে!');
      setIsAuthModalOpen(false);
      setCurrentView('dashboard');
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('লগইন পপআপ বন্ধ করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      } else if (
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain')
      ) {
        setDomainErrorHost(currentHostname);
        setAuthError(
          `গুগল ওঅথ অথোরাইজড ডোমেইন প্রয়োজন: "${currentHostname}" ডোমেইনটি Firebase Console-এ যোগ করতে হবে। নিচের বাটনে ক্লিক করে সুপার এডমিন বা ইমেইল দিয়েও লগইন করতে পারেন।`
        );
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError(
          'ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে ব্রাউজার সেটিংসে পপআপ অ্যালাউ করুন অথবা ইমেইল লগইন ব্যবহার করুন।'
        );
      } else {
        setAuthError(err.message || 'গুগল সাইন-ইন সম্পন্ন করা যায়নি।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('দয়া করে ইমেইল এবং পাসওয়ার্ড প্রদান করুন');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast('সফলভাবে লগইন হয়েছে!');
      setIsAuthModalOpen(false);
      setCurrentView('dashboard');
    } catch (err: any) {
      console.error('Email Login Error:', err);
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setAuthError('ভুল ইমেইল বা পাসওয়ার্ড। নতুন একাউন্ট খুলতে "নতুন একাউন্ট" ট্যাবে ক্লিক করুন।');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('ইমেইলের বিন্যাস সঠিক নয়।');
      } else {
        setAuthError(err.message || 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('দয়া করে সব ঘর পূরণ করুন');
      return;
    }
    if (password.length < 6) {
      setAuthError('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(userCred.user, {
          displayName: name.trim(),
        });
        await syncUserProfile(userCred.user);
        await refreshUserProfile();
      }
      showToast('একাউন্ট সফলভাবে তৈরি হয়েছে! ড্যাশবোর্ডে স্বাগতম');
      setIsAuthModalOpen(false);
      setCurrentView('dashboard');
    } catch (err: any) {
      console.error('Registration Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError(
          'এই ইমেইলে ইতিমধ্যে একটি একাউন্ট খোলা আছে। অনুগ্রহ করে "ইমেইল লগইন" ট্যাবে লগইন করুন।'
        );
      } else {
        setAuthError(err.message || 'নিবন্ধন সম্পন্ন করা যায়নি।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuperAdminQuickFill = () => {
    setActiveTab('login');
    setEmail(SUPER_ADMIN_EMAIL);
    setPassword('admin123456');
    setAuthError(null);
    showToast('সুপার এডমিন ইমেইল পূরণ করা হয়েছে');
  };

  const handleCopyHostname = () => {
    if (domainErrorHost) {
      navigator.clipboard.writeText(domainErrorHost);
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2500);
      showToast('ডোমেইন নাম কপি করা হয়েছে!');
    }
  };

  return (
    <ModalShell
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      title="ক্লাউড সিঙ্ক ও ইউজার একাউন্ট"
      subtitle="ফায়ারবেস ক্লাউড ডেটাবেজ · যেকোনো ডিভাইস থেকে অ্যাক্সেস করুন"
      icon={<Cloud className="w-5 h-5" />}
      maxWidthClass="max-w-lg"
    >
      <div className="p-5 sm:p-6">
        {currentUser ? (
          <div className="space-y-5">
            {/* User Profile Card */}
            <div className="p-4 rounded-xl bg-[#0e0e12] border border-white/[0.08] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1b1b22] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-[#d4af37]" />
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#f5f3ee] truncate">
                    {currentUser.displayName || 'সম্মানিত ব্যবহারকারী'}
                  </h3>
                  {isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#d4af37] font-semibold shrink-0">
                      <Crown className="w-3.5 h-3.5" />
                      Super Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#b6b0a6] truncate font-mono mt-0.5">
                  {currentUser.email}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                  {isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      পূর্ণ অ্যাডমিন অ্যাক্সেস
                    </span>
                  ) : isApproved ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      অনুমোদিত ক্রিয়েটর
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      অনুমোদন অপেক্ষমাণ (Pending)
                    </span>
                  )}
                  <span className="text-[#807a72]">·</span>
                  <span className="text-[#807a72]">asia-east1</span>
                </div>
              </div>
            </div>

            {/* Super Admin Shortcut */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setCurrentView('admin');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] border border-[#d4af37]/30 text-[#f2d77d] text-xs font-semibold transition group"
              >
                <span className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#d4af37]" />
                  <span>সুপার এডমিন কন্ট্রোল প্যানেল খুলুন</span>
                </span>
                <ArrowRight className="w-4 h-4 text-[#d4af37] group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Cloud Sync Status */}
            <div className="p-4 rounded-xl bg-[#0e0e12] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-[#f5f3ee]">
                  <Database className="w-4 h-4 text-[#d4af37]" />
                  ক্লাউড ডেটাবেজ স্ট্যাটাস
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">লাইভ সিঙ্ক সক্রিয়</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-lg bg-[#141419] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-[#807a72]">পোস্টার ডিজাইন</span>
                  <span className="font-bold text-[#f2d77d] tabular-nums">
                    {toBengaliNumber(savedDesigns.length)} টি
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#141419] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-[#807a72]">স্টাইল প্রিসেট</span>
                  <span className="font-bold text-[#f2d77d] tabular-nums">
                    {toBengaliNumber(presets.length)} টি
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={migrateLocalData}
                disabled={isCloudSyncing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/10 text-xs font-semibold transition disabled:opacity-50 min-h-[40px]"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#d4af37] ${isCloudSyncing ? 'animate-spin' : ''}`}
                />
                <span>
                  {isCloudSyncing
                    ? 'ক্লাউডে ডেটা সিঙ্ক হচ্ছে...'
                    : 'অফলাইন ডেটা ফায়ারবেসে সিঙ্ক করুন'}
                </span>
              </button>
            </div>

            {/* Footer / Sign Out */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08]">
              <span className="text-[11px] text-[#807a72]">
                সুপার এডমিন: {SUPER_ADMIN_EMAIL}
              </span>
              <button
                type="button"
                onClick={signOutUser}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-xs font-semibold transition min-h-[40px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>সাইন আউট</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Segmented Auth Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 mb-5 rounded-xl bg-[#0e0e12] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('google');
                  setAuthError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition min-h-[38px] ${
                  activeTab === 'google'
                    ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                    : 'text-[#b6b0a6] hover:text-[#f5f3ee]'
                }`}
              >
                গুগল সাইন-ইন
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setAuthError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition min-h-[38px] ${
                  activeTab === 'login'
                    ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                    : 'text-[#b6b0a6] hover:text-[#f5f3ee]'
                }`}
              >
                ইমেইল লগইন
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setAuthError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition min-h-[38px] ${
                  activeTab === 'register'
                    ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                    : 'text-[#b6b0a6] hover:text-[#f5f3ee]'
                }`}
              >
                নতুন একাউন্ট
              </button>
            </div>

            {/* Domain Authorization Error Helper */}
            {domainErrorHost && (
              <div className="p-3.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Google OAuth ডোমেইন অথোরাইজেশন প্রয়োজন</span>
                </div>
                <p className="text-[11px] text-[#b6b0a6] leading-relaxed">
                  Firebase Console-এ Authorized domains-এ নিচের ডোমেইনটি যোগ করুন:
                </p>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e0e12] border border-white/10">
                  <code className="text-[11px] text-[#f2d77d] font-mono truncate">
                    {domainErrorHost}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyHostname}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1b1b22] text-[11px] text-[#f5f3ee] shrink-0 ml-2"
                  >
                    {copiedHost ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedHost ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSuperAdminQuickFill}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-white/10 text-xs font-semibold transition"
                >
                  <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>ইমেইল দিয়ে সুপার এডমিন ({SUPER_ADMIN_EMAIL}) লগইন</span>
                </button>
              </div>
            )}

            {/* General Error */}
            {authError && !domainErrorHost && (
              <div
                role="alert"
                className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {activeTab === 'google' && (
              <div className="space-y-4 text-center py-1">
                <p className="text-xs text-[#b6b0a6] leading-relaxed max-w-sm mx-auto">
                  আপনার গুগল একাউন্ট দিয়ে ১-ক্লিকে সাইন-ইন করুন। সুপার এডমিন একাউন্ট (
                  <span className="text-[#f2d77d] font-medium">{SUPER_ADMIN_EMAIL}</span>)
                  স্বয়ংক্রিয়ভাবে সুপার এডমিন প্রিভিলেজ পাবে।
                </p>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm transition active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'সংযুক্ত হচ্ছে...' : 'Google দিয়ে সাইন-ইন করুন'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSuperAdminQuickFill}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#b6b0a6] hover:text-[#f2d77d] border border-white/[0.08] text-xs font-medium transition min-h-[40px]"
                >
                  <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>
                    সুপার এডমিন (<span className="font-mono">{SUPER_ADMIN_EMAIL}</span>) দ্রুত লগইন
                  </span>
                </button>
              </div>
            )}

            {activeTab === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label htmlFor="auth-login-email" className="text-xs font-semibold text-[#b6b0a6] block mb-1.5">
                    ইমেইল এড্রেস
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#807a72] absolute left-3.5 top-3" />
                    <input
                      id="auth-login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="realsafikul@gmail.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-login-password" className="text-xs font-semibold text-[#b6b0a6] block mb-1.5">
                    পাসওয়ার্ড
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#807a72] absolute left-3.5 top-3" />
                    <input
                      id="auth-login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-sm transition disabled:opacity-50 min-h-[44px]"
                >
                  <span>{isLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {activeTab === 'register' && (
              <form onSubmit={handleEmailRegister} className="space-y-4">
                <div>
                  <label htmlFor="auth-reg-name" className="text-xs font-semibold text-[#b6b0a6] block mb-1.5">
                    আপনার নাম
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#807a72] absolute left-3.5 top-3" />
                    <input
                      id="auth-reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="যেমন: আহমদ হাসান"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-reg-email" className="text-xs font-semibold text-[#b6b0a6] block mb-1.5">
                    ইমেইল এড্রেস
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#807a72] absolute left-3.5 top-3" />
                    <input
                      id="auth-reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-reg-password" className="text-xs font-semibold text-[#b6b0a6] block mb-1.5">
                    পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#807a72] absolute left-3.5 top-3" />
                    <input
                      id="auth-reg-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-sm transition disabled:opacity-50 min-h-[44px]"
                >
                  <span>{isLoading ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন করুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="mt-5 pt-4 border-t border-white/[0.08] text-center">
              <span className="text-[11px] text-[#807a72]">
                নতুন ব্যবহারকারীরা সুপার এডমিনের অনুমোদন সাপেক্ষে পূর্ণ পোস্টার তৈরি ও সেভিং সুবিধা পাবেন।
              </span>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
};
