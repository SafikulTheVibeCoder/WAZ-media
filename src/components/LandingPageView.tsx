import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_PRESETS } from '../data/quotes';
import { BUILTIN_PRESETS } from '../data/presets';
import { ThemeConfig } from '../types';
import {
  Sparkles,
  Layers,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Share2,
  Download,
  Palette,
  Layout,
  ExternalLink,
  ChevronRight,
  Star,
  Zap,
} from 'lucide-react';

export const LandingPageView: React.FC = () => {
  const {
    currentUser,
    isSuperAdmin,
    isApproved,
    setIsAuthModalOpen,
    setCurrentView,
    loadQuoteToPoster,
  } = useApp();

  const [demoTheme, setDemoTheme] = useState<string>('golden');
  const [demoSize, setDemoSize] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [activeTab, setActiveTab] = useState<'poster' | 'presets' | 'library' | 'rbac'>('poster');

  const selectedThemeObj = THEME_PRESETS.find((t: ThemeConfig) => t.id === demoTheme) || THEME_PRESETS[0];

  return (
    <div className="space-y-16 py-4 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* HERO SECTION */}
      <section className="relative text-center pt-8 pb-12 px-4 sm:px-6 rounded-3xl bg-gradient-to-b from-[#1c140d] via-[#140e0a] to-[#0d0a08] border border-[#38281b] overflow-hidden shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#241a12] border border-[#d4af37]/40 text-[#f7df94] text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>প্রফেশনাল ইসলামিক সোশ্যাল মিডিয়া স্টুডিও • SaaS v2.5</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#f4eee2] max-w-4xl mx-auto leading-tight">
          কুরআন ও সুন্নাহর বাণী ছড়িয়ে দিন{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#edd390] via-[#d4af37] to-[#aa8323]">
            দৃষ্টিনন্দন পোস্টার ডিজাইনে
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-[#baa791] max-w-2xl mx-auto mt-4 sm:mt-6 leading-relaxed font-normal">
          সহীহ হাদিস ও কুরআনের আয়াত ব্রাউজ করুন, রয়্যাল ইসলামিক ক্যালিগ্রাফি স্টাইলে ১-ক্লিকে পোস্টার তৈরি করুন এবং সোশ্যাল মিডিয়ায় শেয়ার করুন।
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8 max-w-md mx-auto">
          <button
            onClick={() => {
              if (currentUser && isApproved) {
                setCurrentView('poster');
              } else if (currentUser) {
                setCurrentView('dashboard');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 py-3.5 px-7 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-sm shadow-xl transition active:scale-[0.98]"
          >
            <span>{currentUser ? (isApproved ? 'পোস্টার স্টুডিও খুলুন' : 'ড্যাশবোর্ডে যান') : 'Get Started / Request Access'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const demoElement = document.getElementById('interactive-demo');
              demoElement?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#201710] hover:bg-[#2b1f16] text-[#e0d2bf] border border-[#3b2a1a] font-semibold text-sm transition"
          >
            <span>লাইভ ডেমো পরীক্ষা করুন</span>
            <ChevronRight className="w-4 h-4 text-[#d4af37]" />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-8 border-t border-[#261b12] text-xs text-[#877461]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            যাচাইকৃত সহীহ হাদিস লাইব্রেরি
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            রোল বেসড এক্সেস কন্ট্রোল (RBAC)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ফায়ারবেস ক্লাউড ডেটাবেজ ও স্টোরেজ
          </span>
        </div>
      </section>

      {/* INTERACTIVE DEMO SHOWCASE SECTION */}
      <section id="interactive-demo" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
            ইন্টারেক্টিভ ডেমো
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f4eee2] mt-1">
            সফটওয়্যারটির শক্তিশালী ফিচারসমূহ এক্সপ্লোর করুন
          </h2>
          <p className="text-xs sm:text-sm text-[#877461] mt-2">
            অনুমোদনের আগেই ডেমো প্রিভিউতে দেখে নিন কিভাবে প্রতিটি মডিউল কাজ করে
          </p>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-[#140e0a] border border-[#2d2117] rounded-2xl max-w-xl mx-auto">
          <button
            onClick={() => setActiveTab('poster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'poster'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow'
                : 'text-[#baa791] hover:text-[#f4eee2]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>লাইভ পোস্টার ইঞ্জিন</span>
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'presets'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow'
                : 'text-[#baa791] hover:text-[#f4eee2]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>স্টাইল প্রিসেট সেভার</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow'
                : 'text-[#baa791] hover:text-[#f4eee2]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>কুরআন ও হাদিস ব্রাউজার</span>
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'rbac'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow'
                : 'text-[#baa791] hover:text-[#f4eee2]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>এডমিন ও রোল সিকিউরিটি</span>
          </button>
        </div>

        {/* TAB 1: LIVE POSTER ENGINE DEMO */}
        {activeTab === 'poster' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#17110c] border border-[#2d2117] rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">ফিচার ১</span>
                <h3 className="text-xl font-bold text-[#f4eee2] mt-1">তাৎক্ষণিক পোস্টার জেনারেটর</h3>
                <p className="text-xs text-[#9b8976] mt-2 leading-relaxed">
                  পছন্দমতো যেকোনো থিম নির্বাচন করুন। রয়্যাল ফ্রেম, মেহরাব বর্ডার এবং নিখুঁত বাংলা ও আরবি টাইপোগ্রাফি সরাসরি লাইভ ক্যানভাসে রেন্ডার হয়।
                </p>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="text-xs font-semibold text-[#baa791] block mb-2">
                  লাইভ থিম পরিবর্তন করে দেখুন:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.slice(0, 8).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setDemoTheme(t.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-medium transition ${
                        demoTheme === t.id
                          ? 'bg-[#2a1d13] border-[#d4af37] text-[#f7df94]'
                          : 'bg-[#120e0a] border-[#2d2117] text-[#877461] hover:border-[#44301d]'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/30 shadow-sm"
                        style={{ backgroundColor: t.accent }}
                      />
                      <span className="truncate w-full text-center text-[10px]">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div>
                <label className="text-xs font-semibold text-[#baa791] block mb-2">
                  সোশ্যাল মিডিয়া সাইজ:
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDemoSize('1:1')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition ${
                      demoSize === '1:1'
                        ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f7df94]'
                        : 'bg-[#120e0a] border-[#2d2117] text-[#877461]'
                    }`}
                  >
                    1:1 Square (FB/Insta)
                  </button>
                  <button
                    onClick={() => setDemoSize('4:5')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition ${
                      demoSize === '4:5'
                        ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f7df94]'
                        : 'bg-[#120e0a] border-[#2d2117] text-[#877461]'
                    }`}
                  >
                    4:5 Portrait
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (currentUser && isApproved) {
                      setCurrentView('poster');
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow-md transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{currentUser && isApproved ? 'পোস্টার স্টুডিওতে যান' : 'পূর্ণ অ্যাক্সেস পেতে সাইন-ইন / রিকোয়েস্ট করুন'}</span>
                </button>
              </div>
            </div>

            {/* Poster Preview Window */}
            <div className="lg:col-span-7 flex justify-center">
              <div
                className={`relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col justify-between text-center border transition-all duration-300 ${
                  demoSize === '1:1' ? 'aspect-square' : 'aspect-[4/5]'
                }`}
                style={{
                  background: selectedThemeObj.previewBg,
                  borderColor: selectedThemeObj.border,
                  color: selectedThemeObj.text,
                }}
              >
                {/* Top Corner Decor */}
                <div className="flex items-center justify-between opacity-70">
                  <span className="text-[10px] tracking-widest uppercase font-bold" style={{ color: selectedThemeObj.accent }}>
                    WAZ MEDIA
                  </span>
                  <span className="text-[10px] opacity-60">আল-কুরআন</span>
                </div>

                {/* Content */}
                <div className="space-y-3 my-auto">
                  <p
                    className="font-arabic text-base sm:text-lg leading-relaxed dir-rtl"
                    style={{ color: selectedThemeObj.ar }}
                  >
                    فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا
                  </p>
                  <p className="text-sm sm:text-base font-semibold leading-relaxed px-2">
                    "নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।"
                  </p>
                  <p className="text-[11px] font-medium" style={{ color: selectedThemeObj.accent }}>
                    — সূরা আশ-শারহ, আয়াত: ৫-৬ —
                  </p>
                </div>

                {/* Footer Watermark */}
                <div className="text-[9px] opacity-60 pt-2 border-t border-black/10">
                  @wazmedia.bd • Islamic Media Studio
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRESET SAVER DEMO */}
        {activeTab === 'presets' && (
          <div className="bg-[#17110c] border border-[#2d2117] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="max-w-2xl">
              <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">ফিচার ২</span>
              <h3 className="text-xl font-bold text-[#f4eee2] mt-1">স্টাইল প্রিসেট সংরক্ষণ ও অটো-অ্যাপ্লাই সিস্টেম</h3>
              <p className="text-xs text-[#9b8976] mt-2 leading-relaxed">
                আপনার পেজ বা ব্র্যান্ডের সিগনেচার স্টাইল (ফন্ট, সাইজ, মেহরাব বর্ডার, রঙ ও লোগোর অবস্থান) একবার প্রিসেট হিসেবে সেভ করুন। এরপর নতুন যেকোনো আয়াত বা হাদিস নির্বাচন করলেই সেই ফরম্যাটে স্বয়ংক্রিয়ভাবে পোস্টার তৈরি হয়ে যাবে।
              </p>
            </div>

            {/* Presets Grid Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BUILTIN_PRESETS.slice(0, 3).map((preset) => (
                <div
                  key={preset.id}
                  className="p-5 rounded-2xl bg-[#120e0a] border border-[#2d2117] hover:border-[#d4af37]/50 transition space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#f7df94]">{preset.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#f7df94]">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#877461]">{preset.description}</p>
                  <div
                    className="h-16 rounded-xl border border-[#3b2a1a] flex items-center justify-center p-3 text-center text-xs font-semibold"
                    style={{ background: preset.previewGradient }}
                  >
                    <span className="text-[#f7df94]">নমুনা প্রিভিউ স্টাইল</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: QURAN & HADITH API BROWSER */}
        {activeTab === 'library' && (
          <div className="bg-[#17110c] border border-[#2d2117] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="max-w-2xl">
              <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">ফিচার ৩</span>
              <h3 className="text-xl font-bold text-[#f4eee2] mt-1">সহীহ হাদিস ও পূর্ণাঙ্গ আল-কুরআন এপিআই ব্রাউজার</h3>
              <p className="text-xs text-[#9b8976] mt-2 leading-relaxed">
                সহীহ বুখারী, মুসলিম এবং আল-কুরআনের পূর্ণাঙ্গ ১১৪টি সূরার আয়াত অনুসন্ধান করুন এবং ব্রাউজার থেকেই সরাসরি ১-ক্লিকে "পোস্টার তৈরি করুন" বাটনে ক্লিক করে পোস্টার স্টুডিওতে লোড করুন।
              </p>
            </div>

            {/* Sample Quran/Hadith Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#120e0a] border border-[#2d2117] space-y-3">
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full font-bold">
                  কুরআনুল কারীম
                </span>
                <p className="text-xs text-[#baa791]">
                  "হে ঈমানদারগণ! তোমরা ধৈর্য ও সালাতের মাধ্যমে সাহায্য প্রার্থনা করো। নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।"
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-[#261b12] text-xs">
                  <span className="text-[#877461]">সূরা আল-বাকারা, আয়াত: ১৫৩</span>
                  <button
                    onClick={() => {
                      if (currentUser && isApproved) {
                        setCurrentView('captions');
                      } else {
                        setIsAuthModalOpen(true);
                      }
                    }}
                    className="text-[#d4af37] hover:underline font-semibold"
                  >
                    পোস্টার তৈরি করুন &rarr;
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#120e0a] border border-[#2d2117] space-y-3">
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full font-bold">
                  সহীহ আল-বুখারী
                </span>
                <p className="text-xs text-[#baa791]">
                  "নিশ্চয়ই সকল কাজের ফলাফল নিয়তের ওপর নির্ভরশীল, আর প্রতিটি মানুষ কেবল তাই পাবে যা সে নিয়ত করেছে।"
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-[#261b12] text-xs">
                  <span className="text-[#877461]">হাদিস নম্বর: ১</span>
                  <button
                    onClick={() => {
                      if (currentUser && isApproved) {
                        setCurrentView('captions');
                      } else {
                        setIsAuthModalOpen(true);
                      }
                    }}
                    className="text-[#d4af37] hover:underline font-semibold"
                  >
                    পোস্টার তৈরি করুন &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RBAC & SUPER ADMIN SECURITY */}
        {activeTab === 'rbac' && (
          <div className="bg-[#17110c] border border-[#2d2117] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="max-w-2xl">
              <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">ফিচার ৪</span>
              <h3 className="text-xl font-bold text-[#f4eee2] mt-1">রোল-বেসড অ্যাক্সেস কন্ট্রোল (RBAC) ও সুপার এডমিন</h3>
              <p className="text-xs text-[#9b8976] mt-2 leading-relaxed">
                কনটেন্টের বিশুদ্ধতা ও প্ল্যাটফর্মের সুরক্ষা নিশ্চিত করতে তিন স্তরের ব্যবহারকারী কাঠামো রয়েছে:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#120e0a] border border-[#2d2117] space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-[#f4eee2]">1. বেসিক ইউজার (Basic)</h4>
                <p className="text-xs text-[#877461] leading-relaxed">
                  নতুন নিবন্ধনকারী। ডেমো ও পাবলিক ব্রাউজ করতে পারেন; পোস্টার তৈরি ও সেভের জন্য এডমিনের অনুমোদন প্রয়োজন।
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#120e0a] border border-emerald-900/40 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-emerald-300">2. অনুমোদিত ক্রিয়েটর (Approved)</h4>
                <p className="text-xs text-[#877461] leading-relaxed">
                  সুপার এডমিন কর্তৃক অনুমোদিত। আনলিমিটেড পোস্টার জেনারেট, ক্লাউড প্রিসেট সেভিং ও এইচডি এক্সপোর্ট সুবিধা পান।
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#120e0a] border border-[#d4af37]/40 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#241a12] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37]">
                  <Crown className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-[#f7df94]">3. সুপার এডমিন (Super Admin)</h4>
                <p className="text-xs text-[#877461] leading-relaxed">
                  ইউজার অ্যাকাউন্ট অনুমোদন, রোল আপগ্রেড, ডেটা নিয়ন্ত্রণ ও সামগ্রিক প্ল্যাটফর্ম পরিচালনার পূর্ণ অধিকার।
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SUBSCRIPTION / ACCESS TIERS PREVIEW */}
      <section className="space-y-6 pt-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
            প্ল্যান ও অ্যাক্সেস মডেল
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f4eee2] mt-1">
            ভবিষ্যৎ সাবস্ক্রিপশন ও অ্যাক্সেস টিয়ার
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1 */}
          <div className="p-6 rounded-3xl bg-[#140e0a] border border-[#2d2117] flex flex-col justify-between space-y-6 shadow-xl">
            <div>
              <span className="text-xs font-semibold text-[#877461] uppercase tracking-wider block">ফ্রি ট্রায়াল</span>
              <h3 className="text-xl font-bold text-[#f4eee2] mt-1">বেসিক ডেমো</h3>
              <p className="text-xs text-[#877461] mt-2">নতুন ব্যবহারকারী ও পরীক্ষামূলক অনবোর্ডিং</p>
              <div className="text-2xl font-extrabold text-[#f7df94] mt-4">৳ ০ <span className="text-xs font-normal text-[#877461]">/ আজীবন</span></div>

              <ul className="space-y-2.5 mt-6 text-xs text-[#baa791]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> হাদিস ও কুরআন ব্রাউজার ভিউ</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ইন্টারেক্টিভ ডেমো ও প্রিভিউ</li>
                <li className="flex items-center gap-2 text-[#736353]"><Clock className="w-3.5 h-3.5 text-amber-400" /> পোস্টার সেভিং এডমিন অনুমোদন সাপেক্ষ</li>
              </ul>
            </div>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#201710] hover:bg-[#2b1f16] text-[#baa791] hover:text-[#f4eee2] border border-[#38281b] text-xs font-semibold transition"
            >
              সাইন-ইন করুন
            </button>
          </div>

          {/* Tier 2 (Featured) */}
          <div className="relative p-6 rounded-3xl bg-gradient-to-b from-[#201710] to-[#16100b] border-2 border-[#d4af37] flex flex-col justify-between space-y-6 shadow-2xl">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] font-bold text-[10px] uppercase tracking-wider shadow">
              সবচেয়ে জনপ্রিয়
            </span>

            <div>
              <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider block">অনুমোদিত ক্রিয়েটর</span>
              <h3 className="text-xl font-bold text-[#f7df94] mt-1">প্রো ক্রিয়েটর স্টুডিও</h3>
              <p className="text-xs text-[#baa791] mt-2">ইসলামিক সোশ্যাল মিডিয়া কনটেন্ট ক্রিয়েটরদের জন্য</p>
              <div className="text-2xl font-extrabold text-[#f7df94] mt-4">অনুমোদিত <span className="text-xs font-normal text-emerald-400">অ্যাক্সেস</span></div>

              <ul className="space-y-2.5 mt-6 text-xs text-[#f4eee2]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" /> আনলিমিটেড পোস্টার তৈরি ও সম্পাদনা</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" /> স্টাইল প্রিসেট সংরক্ষণ ও অটো-অ্যাপ্লাই</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" /> এইচডি পিএনজি ও জেপেগ এক্সপোর্ট</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" /> কাস্টম ব্র্যান্ড লোগো ক্লাউড স্টোরেজ</li>
              </ul>
            </div>

            <button
              onClick={() => {
                if (currentUser && isApproved) {
                  setCurrentView('poster');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow-md transition"
            >
              {currentUser && isApproved ? 'পোস্টার তৈরি শুরু করুন' : 'অ্যাক্সেসের জন্য অনুরোধ জানান'}
            </button>
          </div>

          {/* Tier 3 */}
          <div className="p-6 rounded-3xl bg-[#140e0a] border border-[#2d2117] flex flex-col justify-between space-y-6 shadow-xl">
            <div>
              <span className="text-xs font-semibold text-[#877461] uppercase tracking-wider block">প্রতিষ্ঠান / ব্র্যান্ড</span>
              <h3 className="text-xl font-bold text-[#f4eee2] mt-1">এন্টারপ্রাইজ / মিডিয়া</h3>
              <p className="text-xs text-[#877461] mt-2">বৃহৎ ইসলামিক পেইজ ও দাতব্য প্রতিষ্ঠানের জন্য</p>
              <div className="text-2xl font-extrabold text-[#f7df94] mt-4">কাস্টম <span className="text-xs font-normal text-[#877461]">সাপোর্ট</span></div>

              <ul className="space-y-2.5 mt-6 text-xs text-[#baa791]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> মাল্টি-ইউজার পারমিশন ম্যানেজমেন্ট</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> প্রাইভেট ক্লাউড ডেটাবেজ ব্যাকআপ</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ডেডিকেটেড সুপার এডমিন সাপোর্ট</li>
              </ul>
            </div>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#201710] hover:bg-[#2b1f16] text-[#baa791] hover:text-[#f4eee2] border border-[#38281b] text-xs font-semibold transition"
            >
              যোগাযোগ করুন
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
