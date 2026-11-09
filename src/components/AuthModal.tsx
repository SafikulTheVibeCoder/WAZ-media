import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  auth,
  googleProvider,
} from '../services/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { SUPER_ADMIN_EMAIL } from '../services/firebaseDb';
import {
  X,
  Cloud,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  LogOut,
  RefreshCw,
  Globe,
  Database,
  Shield,
  Layers,
  Sparkles,
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
    userProfile,
    isSuperAdmin,
    isApproved,
    isCloudSyncing,
    migrateLocalData,
    signOutUser,
    savedDesigns,
    presets,
    showToast,
    setCurrentView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'google' | 'login' | 'register'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [domainErrorHost, setDomainErrorHost] = useState<string | null>(null);
  const [copiedHost, setCopiedHost] = useState(false);

  if (!isAuthModalOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    setDomainErrorHost(null);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('গুগল অ্যাকাউন্ট সফলভাবে সংযুক্ত হয়েছে!');
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('লগইন পপআপ বন্ধ করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setDomainErrorHost(currentHostname);
        setAuthError(
          `গুগল ওঅথ অথোরাইজড ডোমেইন প্রয়োজন: "${currentHostname}" ডোমেইনটি Firebase Console-এ যোগ করতে হবে। নিচের বাটনে ক্লিক করে সুপার এডমিন বা ইমেইল দিয়েও লগইন করতে পারেন।`
        );
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে ব্রাউজার সেটিংসে পপআপ অ্যালাউ করুন অথবা ইমেইল লগইন ব্যবহার করুন।');
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
    } catch (err: any) {
      console.error('Email Login Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
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
      }
      showToast('একাউন্ট সফলভাবে তৈরি হয়েছে!');
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Registration Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('এই ইমেইলে ইতিমধ্যে একটি একাউন্ট খোলা আছে। অনুগ্রহ করে "ইমেইল লগইন" ট্যাবে লগইন করুন।');
      } else {
        setAuthError(err.message || 'নিবন্ধন সম্পন্ন করা যায়নি।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Super Admin Login Helper
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#16100b] border border-[#3b2a1a] rounded-3xl p-6 sm:p-7 shadow-2xl text-[#f4eee2] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Background Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#1e4a38]/15 rounded-full blur-3xl pointer-events-none -ml-10 -mb-10" />

        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#201710] hover:bg-[#2b1f16] border border-[#38281b] flex items-center justify-center text-[#9b8976] hover:text-[#f4eee2] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#8c6d1f]/10 border border-[#d4af37]/40 flex items-center justify-center text-[#f7df94] shadow-inner">
            <Cloud className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f7df94] flex items-center gap-2">
              ক্লাউড সিঙ্ক ও ইউজার একাউন্ট
              <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium">
                ফায়ারবেস
              </span>
            </h2>
            <p className="text-xs text-[#9b8976] mt-0.5">
              বিশ্বের যে কোনো স্থান ও ডিভাইস থেকে সংরক্ষিত পোস্টার ও প্রিসেট অ্যাক্সেস করুন
            </p>
          </div>
        </div>

        {/* AUTHENTICATED STATE */}
        {currentUser ? (
          <div className="space-y-5">
            {/* User Info Card with RBAC Badge */}
            <div className="p-4 rounded-2xl bg-[#1d150e] border border-[#38281b] flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#281c12] border border-[#443120] overflow-hidden flex items-center justify-center shrink-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-7 h-7 text-[#d4af37]" />
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[#f4eee2] truncate">
                    {currentUser.displayName || 'সম্মানিত ব্যবহারকারী'}
                  </h3>
                  {isSuperAdmin && (
                    <span className="flex items-center gap-1 text-[10px] bg-[#d4af37]/20 text-[#f7df94] border border-[#d4af37]/40 px-2 py-0.5 rounded-full font-bold shrink-0">
                      <Crown className="w-3 h-3 text-[#d4af37]" />
                      Super Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#baa791] truncate font-mono">{currentUser.email}</p>

                {/* Role and Access Status Pills */}
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px]">
                  {isSuperAdmin ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      পূর্ণ অ্যাডমিন অ্যাক্সেস
                    </span>
                  ) : isApproved ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      অনুমোদিত ক্রিয়েটর
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-300 font-semibold bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 animate-pulse" />
                      অনুমোদন অপেক্ষমাণ (Pending)
                    </span>
                  )}

                  <span className="text-[#6e5d4e]">•</span>
                  <span className="text-[#877461]">asia-east1</span>
                </div>
              </div>
            </div>

            {/* Super Admin Control Panel Shortcut Button */}
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setCurrentView('admin');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37]/20 to-[#8c6d1f]/20 hover:from-[#d4af37]/30 hover:to-[#8c6d1f]/30 border border-[#d4af37]/50 text-[#f7df94] text-xs font-bold transition shadow-md group"
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-[#d4af37]" />
                  <span>সুপার এডমিন কন্ট্রোল প্যানেল খুলুন (ব্যবহারকারী নিয়ন্ত্রণ)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#d4af37] group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Cloud Sync Metrics & Action */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1c150f] to-[#140e0a] border border-[#38281b] space-y-3">
              <div className="flex items-center justify-between text-xs text-[#baa791]">
                <span className="flex items-center gap-1.5 font-medium text-[#f7df94]">
                  <Database className="w-4 h-4 text-[#d4af37]" />
                  ক্লাউড ডেটাবেজ স্ট্যাটাস
                </span>
                <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  লাইভ সিঙ্ক সক্রিয়
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#140e0a] border border-[#2b1f15] flex items-center justify-between">
                  <span className="text-[#877461]">পোস্টার ডিজাইন</span>
                  <span className="font-bold text-[#f7df94]">{toBengaliNumber(savedDesigns.length)} টি</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#140e0a] border border-[#2b1f15] flex items-center justify-between">
                  <span className="text-[#877461]">স্টাইল প্রিসেট</span>
                  <span className="font-bold text-[#f7df94]">{toBengaliNumber(presets.length)} টি</span>
                </div>
              </div>

              {/* Migrate offline/local data to cloud button */}
              <button
                onClick={migrateLocalData}
                disabled={isCloudSyncing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#241a12] hover:bg-[#2d2117] text-[#f7df94] border border-[#443120] text-xs font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#d4af37] ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isCloudSyncing
                    ? 'ক্লাউডে ডেটা সিঙ্ক হচ্ছে...'
                    : 'অফলাইন ডেটা ফায়ারবেসে সিঙ্ক করুন (১-ক্লিক)'}
                </span>
              </button>
            </div>

            {/* Sign Out Button */}
            <div className="pt-2 flex justify-between items-center">
              <span className="text-[11px] text-[#7d6b59]">
                সুপার এডমিন: {SUPER_ADMIN_EMAIL}
              </span>
              <button
                onClick={signOutUser}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#20160f] hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-[#3b271d] hover:border-rose-900/50 text-xs font-medium transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>সাইন আউট</span>
              </button>
            </div>
          </div>
        ) : (
          /* UNAUTHENTICATED STATE */
          <div>
            {/* Tabs */}
            <div className="flex p-1 mb-4 rounded-2xl bg-[#120e0a] border border-[#2b1f15]">
              <button
                onClick={() => {
                  setActiveTab('google');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                  activeTab === 'google'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow-sm'
                    : 'text-[#baa791] hover:text-[#f4eee2]'
                }`}
              >
                গুগল সাইন-ইন
              </button>
              <button
                onClick={() => {
                  setActiveTab('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow-sm'
                    : 'text-[#baa791] hover:text-[#f4eee2]'
                }`}
              >
                ইমেইল লগইন
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow-sm'
                    : 'text-[#baa791] hover:text-[#f4eee2]'
                }`}
              >
                নতুন একাউন্ট
              </button>
            </div>

            {/* Domain Authorization Error Helper Box */}
            {domainErrorHost && (
              <div className="p-3.5 mb-4 rounded-2xl bg-amber-950/60 border border-amber-800/60 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Google OAuth ডোমেইন অথোরাইজেশন প্রয়োজন</span>
                </div>
                <p className="text-[11px] text-[#baa791] leading-relaxed">
                  Firebase Console এ Authentication &gt; Settings &gt; Authorized domains-এ নিচের ডোমেইনটি যোগ করতে হবে:
                </p>
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#120e0a] border border-[#3b2a1a]">
                  <code className="text-[11px] text-[#f7df94] font-mono truncate">{domainErrorHost}</code>
                  <button
                    onClick={handleCopyHostname}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#201710] hover:bg-[#2b1f16] text-[10px] text-[#baa791] border border-[#3b2a1a] shrink-0 ml-2"
                  >
                    {copiedHost ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHost ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                  </button>
                </div>
                <div className="pt-1">
                  <button
                    onClick={handleSuperAdminQuickFill}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#261c13] hover:bg-[#312318] text-[#f7df94] border border-[#443120] text-[11px] font-semibold transition"
                  >
                    <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>ইমেইল দিয়ে সুপার এডমিন (realsafikul@gmail.com) লগইন করুন</span>
                  </button>
                </div>
              </div>
            )}

            {/* General Error Message */}
            {authError && !domainErrorHost && (
              <div className="p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                <span>{authError}</span>
              </div>
            )}

            {/* Tab 1: Google 1-Click Sign-In */}
            {activeTab === 'google' && (
              <div className="space-y-4 text-center py-2">
                <p className="text-xs text-[#baa791] leading-relaxed max-w-sm mx-auto">
                  আপনার গুগল একাউন্ট দিয়ে ১-ক্লিকে সাইন-ইন করুন। সুপার এডমিন একাউন্ট (<span className="text-[#f7df94] font-semibold">{SUPER_ADMIN_EMAIL}</span>) স্বয়ংক্রিয়ভাবে সুপার এডমিন প্রিভিলেজ পাবে।
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm shadow-lg transition active:scale-[0.98] disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                </div>

                {/* Super Admin Quick Access Option */}
                <div className="pt-2">
                  <button
                    onClick={handleSuperAdminQuickFill}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1d150e] hover:bg-[#261c13] text-[#baa791] hover:text-[#f7df94] border border-[#38281b] text-xs font-medium transition"
                  >
                    <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>সুপার এডমিন (<span className="text-[#f7df94] font-mono">{SUPER_ADMIN_EMAIL}</span>) দ্রুত লগইন</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Email Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#baa791] block mb-1">
                    ইমেইল এড্রেস
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#877461] absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="realsafikul@gmail.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#baa791] block mb-1">
                    পাসওয়ার্ড
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#877461] absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  <span>{isLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Tab 3: Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleEmailRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#baa791] block mb-1">
                    আপনার নাম
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#877461] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="যেমন: আহমদ হাসান"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#baa791] block mb-1">
                    ইমেইল এড্রেস
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#877461] absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#baa791] block mb-1">
                    পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#877461] absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  <span>{isLoading ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন করুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Access control note */}
            <div className="mt-5 pt-4 border-t border-[#241a12] text-center">
              <span className="text-[11px] text-[#786653]">
                নতুন ব্যবহারকারীরা সুপার এডমিনের অনুমোদন সাপেক্ষে পূর্ণ পোস্টার তৈরি ও সেভিং সুবিধা পাবেন।
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
