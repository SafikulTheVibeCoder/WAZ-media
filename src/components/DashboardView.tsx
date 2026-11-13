import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { EmptyState } from './ui/EmptyState';
import { INITIAL_QUOTES, THEME_PRESETS } from '../data/quotes';
import { QuoteItem } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { generateLocalFacebookPost } from '../utils/seoUtils';
import {
  Sparkles,
  Copy,
  RefreshCw,
  Palette,
  Download,
  FolderHeart,
  BookmarkCheck,
  Layers,
  ArrowRight,
  Bookmark,
  Check,
  Calendar,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    setCurrentView,
    loadQuoteToPoster,
    savedDesigns,
    stats,
    incrementStat,
    showToast,
    loadDesignForEdit,
    startNewDesign,
    toggleFavorite,
    isFavorite,
    setPoster,
    brand,
    presets,
    applyPreset,
  } = useApp();

  const [selectedCat, setSelectedCat] = useState('সব');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredQuotes =
    selectedCat === 'সব'
      ? INITIAL_QUOTES
      : INITIAL_QUOTES.filter((q) => q.cats.includes(selectedCat));

  const activeQuote =
    filteredQuotes[currentQuoteIndex % filteredQuotes.length] || INITIAL_QUOTES[0];

  const handleNextQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % filteredQuotes.length);
    incrementStat('caps');
  };

  const handleCopyQuote = (quote: QuoteItem) => {
    const post = generateLocalFacebookPost(
      {
        bn: quote.bn,
        ar: quote.ar,
        ref: quote.ref,
        size: '1080x1080',
        theme: 'golden',
        font: 'Noto Sans Bengali',
        fontSize: 60,
        align: 'center',
        textColor: '#FFFFFF',
        accentColor: '#D4AF37',
        arabicColor: '#F7DF94',
        bgType: 'theme',
        bgDataUrl: null,
        bgPattern: 'geometric',
        overlay: 0.25,
        borderStyle: 'double',
        decorCorner: true,
        decorDivider: true,
        showAr: Boolean(quote.ar),
        showBismillah: true,
        autoFit: true,
        refPos: 'below',
      },
      brand
    );
    navigator.clipboard.writeText(post.fbCaption);
    setCopiedId(quote.id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('সম্পূর্ণ এসইও ফেসবুক পোস্ট কপি হয়েছে');
  };

  const handleApplyPresetTemplate = (preset: {
    bn: string;
    ar: string;
    ref: string;
    theme: any;
    size: any;
  }) => {
    const th = THEME_PRESETS.find((t) => t.id === preset.theme);
    setPoster((prev) => ({
      ...prev,
      ...preset,
      ...(th ? { textColor: th.text, accentColor: th.accent, arabicColor: th.ar } : {}),
      showAr: !!preset.ar,
      showBismillah: true,
    }));
    setCurrentView('poster');
    showToast('টেমপ্লেট সফলভাবে লোড হয়েছে');
  };

  const statItems = [
    {
      label: 'সংরক্ষিত ডিজাইন',
      value: toBengaliNumber(savedDesigns.length),
      icon: FolderHeart,
    },
    {
      label: 'ডাউনলোডকৃত পোস্টার',
      value: toBengaliNumber(stats.exports),
      icon: Download,
    },
    {
      label: 'মোট বাণী ও ক্যাপশন',
      value: toBengaliNumber(stats.caps + INITIAL_QUOTES.length),
      icon: Layers,
    },
    {
      label: 'যাচাইকৃত রেফারেন্স',
      value: toBengaliNumber(INITIAL_QUOTES.length),
      icon: BookmarkCheck,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Header
        title="স্বাগতম, WAZ MEDIA স্টুডিওতে"
        subtitle="যাচাইকৃত কুরআন ও সহীহ হাদিস থেকে ক্যাপশন তৈরি করুন এবং মুহূর্তেই সোশ্যাল মিডিয়া পোস্টার বানান।"
        actionButton={
          <button
            type="button"
            onClick={() => {
              startNewDesign();
              setCurrentView('poster');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs sm:text-sm transition active:scale-[0.98] min-h-[40px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>নতুন পোস্টার বানান</span>
          </button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-[#141419] border border-white/[0.08] rounded-xl p-4 sm:p-5 flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-[#1b1b22] border border-white/[0.08] flex items-center justify-center text-[#d4af37] shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-bold text-[#f5f3ee] tabular-nums leading-none">
                  {item.value}
                </div>
                <div className="text-xs text-[#807a72] mt-1.5 truncate">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Media Planner CTA Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#141419] border border-[#d4af37]/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/25 flex items-center justify-center text-[#d4af37] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#f5f3ee]">
              বাল্ক সোশ্যাল মিডিয়া ও হিজরি ক্যালেন্ডার প্ল্যানার
            </h2>
            <p className="text-xs text-[#b6b0a6] mt-0.5 max-w-2xl leading-relaxed">
              হিজরি ও গ্রেগোরিয়ান ক্যালেন্ডারের সাথে সিঙ্ক করে ১ সপ্তাহ বা ১ মাসের পোস্টার সিডিউল তৈরি করুন স্বয়ংক্রিয়ভাবে।
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentView('planner')}
          className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition inline-flex items-center justify-center gap-2 shrink-0 min-h-[42px]"
        >
          <span>প্ল্যানার ওপেন করুন</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Split: Quick Quote Generator + Recent Designs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Quick Quote Generator */}
        <section className="lg:col-span-7 bg-[#141419] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-[#f5f3ee]">দ্রুত ক্যাপশন ও বাণী</h2>
              <span className="text-xs font-medium text-[#d4af37]">
                {activeQuote.type === 'quran'
                  ? 'কুরআনুল কারীম'
                  : activeQuote.type === 'hadith'
                  ? 'সহীহ হাদিস'
                  : 'ইসলামিক বাণী'}
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-1.5 py-3 overflow-x-auto no-scrollbar">
              {['সব', 'সবর ও শোকর', 'তাওবা ও ক্ষমা', 'সালাত ও ইবাদত', 'জুমার দিন'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCat(cat);
                    setCurrentQuoteIndex(0);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition min-h-[34px] ${
                    selectedCat === cat
                      ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                      : 'bg-[#1b1b22] text-[#b6b0a6] hover:text-[#f5f3ee]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quote Display */}
            <div className="my-4 p-5 sm:p-6 rounded-xl bg-[#0e0e12] border border-white/[0.06] flex flex-col items-center text-center">
              {activeQuote.ar && (
                <p
                  dir="rtl"
                  className="font-arabic text-xl sm:text-2xl text-[#f2d77d] leading-loose mb-3"
                >
                  {activeQuote.ar}
                </p>
              )}
              <p className="font-bengali text-base sm:text-lg text-[#f5f3ee] font-medium leading-relaxed max-w-xl">
                “{activeQuote.bn}”
              </p>
              <span className="mt-3 text-xs text-[#d4af37] font-medium">
                — {activeQuote.ref} —
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyQuote(activeQuote)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] text-xs font-medium border border-white/[0.08] transition min-h-[40px]"
              >
                {copiedId === activeQuote.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                )}
                <span>{copiedId === activeQuote.id ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleFavorite(activeQuote.id)}
                aria-label="পছন্দের তালিকায় রাখুন"
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${
                  isFavorite(activeQuote.id)
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                    : 'bg-[#1b1b22] border-white/[0.08] text-[#807a72] hover:text-[#d4af37]'
                }`}
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={handleNextQuote}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#b6b0a6] hover:text-[#f5f3ee] text-xs font-medium border border-white/[0.08] transition min-h-[40px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>পরবর্তী বাণী</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => loadQuoteToPoster(activeQuote)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] text-xs font-bold transition min-h-[40px]"
            >
              <Palette className="w-4 h-4" />
              <span>পোস্টার তৈরি করুন</span>
            </button>
          </div>
        </section>

        {/* Right: Recent Designs */}
        <section className="lg:col-span-5 bg-[#141419] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-[#f5f3ee]">সাম্প্রতিক পোস্টার</h2>
              <button
                type="button"
                onClick={() => setCurrentView('saved')}
                className="text-xs text-[#d4af37] hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>সবগুলো দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {savedDesigns.length === 0 ? (
              <EmptyState
                className="border-0 bg-transparent py-8 px-2"
                icon={<Palette className="w-6 h-6" />}
                title="এখনো কোনো পোস্টার সংরক্ষণ করা হয়নি"
                description="পোস্টার স্টুডিওতে যান এবং নিজের পছন্দমতো ডিজাইন বানিয়ে সংরক্ষণ করুন।"
                action={
                  <button
                    type="button"
                    onClick={() => setCurrentView('poster')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-white/10 transition min-h-[40px]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ডিজাইন শুরু করুন</span>
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {savedDesigns.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => loadDesignForEdit(item)}
                    className="group text-left bg-[#0e0e12] rounded-xl overflow-hidden border border-white/[0.08] hover:border-[#d4af37]/50 transition"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-black/40">
                      <img
                        src={item.thumb}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-[#f5f3ee] truncate">{item.title}</p>
                      <span className="text-[11px] text-[#807a72] font-mono">
                        {item.poster.size.replace('x', '×')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2 text-xs">
            <span className="text-[#807a72]">ব্র্যান্ড ও লোগো পরিবর্তন করতে চান?</span>
            <button
              type="button"
              onClick={() => setCurrentView('brand')}
              className="text-[#f2d77d] hover:underline font-semibold shrink-0"
            >
              ব্র্যান্ড ম্যানেজার →
            </button>
          </div>
        </section>
      </div>

      {/* Quick Poster Templates */}
      <section className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-bold text-[#f5f3ee]">দ্রুত পোস্টার টেমপ্লেট</h2>
          <p className="text-xs text-[#807a72] mt-0.5">
            এক ক্লিকেই বিশেষ দিনের কিংবা নির্দিষ্ট বিষয়ের পোস্টার তৈরি করুন
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              tag: 'জুমার স্পেশাল',
              title: 'জুমার দিনের বরকত ও ফজিলত',
              meta: 'এমারেল্ড রওজা · ১:১ স্কয়ার',
              bn: 'সূর্য উদিত হওয়া দিনগুলোর মধ্যে সর্বোত্তম দিন হলো জুমার দিন।',
              ar: 'خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ',
              ref: 'সহিহ মুসলিম, হাদিস: ৮৫৪',
              theme: 'emerald',
              size: '1080x1080',
            },
            {
              tag: 'কুরআনের বাণী',
              title: 'ধৈর্য ও বিপদে স্বস্তির আশা',
              meta: 'গোল্ডেন নূর · ৪:৫ পোর্ট্রেট',
              bn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
              ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
              ref: 'সূরা আশ-শারহ, আয়াত: ৫-৬',
              theme: 'golden',
              size: '1080x1350',
            },
            {
              tag: 'পিতা-মাতার জন্য দোয়া',
              title: 'মা-বাবার প্রতি ভালোবাসা ও সম্মান',
              meta: 'নীল গম্বুজ · ১:১ পোস্ট',
              bn: 'হে আমার রব! তাদের উভয়ের প্রতি দয়া করুন, যেমন করে শৈশবে তারা আমাকে লালন-পালন করেছিলেন।',
              ar: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
              ref: 'সূরা আল-ইসরা, আয়াত: ২৪',
              theme: 'sapphire',
              size: '1080x1080',
            },
            {
              tag: 'তাওবাহ ও মাগফিরাত',
              title: 'আল্লাহর সীমাহীন ক্ষমা ও দয়া',
              meta: 'রয়্যাল অবসিডিয়ান · ৯:১৬ স্টোরি',
              bn: 'তোমরা আল্লাহর রহমত থেকে নিরাশ হয়ো না। নিশ্চয়ই আল্লাহ সমস্ত গুনাহ ক্ষমা করে দেন।',
              ar: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
              ref: 'সূরা আয-যুমার, আয়াত: ৫৩',
              theme: 'black',
              size: '1080x1920',
            },
          ].map((tpl) => (
            <button
              key={tpl.tag}
              type="button"
              onClick={() => handleApplyPresetTemplate(tpl)}
              className="text-left p-4 rounded-xl border border-white/[0.08] bg-[#0e0e12] hover:border-[#d4af37]/50 hover:bg-[#18181f] transition flex flex-col justify-between gap-3"
            >
              <div>
                <div className="text-[11px] font-bold text-[#d4af37] mb-1">{tpl.tag}</div>
                <div className="text-sm font-semibold text-[#f5f3ee] line-clamp-2">
                  {tpl.title}
                </div>
              </div>
              <span className="text-[11px] text-[#807a72]">{tpl.meta}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Saved Style Presets */}
      <section className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#f5f3ee]">সংরক্ষিত ডিজাইন প্রিসেট</h2>
            <p className="text-xs text-[#807a72] mt-0.5">
              যেকোনো স্টাইল নির্বাচন করে এক ক্লিকে ক্যানভাসে প্রয়োগ করুন
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('poster')}
            className="text-xs text-[#d4af37] hover:underline font-semibold shrink-0"
          >
            পোস্টার স্টুডিও →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {presets.slice(0, 6).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                applyPreset(preset.id);
                setCurrentView('poster');
              }}
              className="text-left p-4 rounded-xl border border-white/[0.08] hover:border-[#d4af37]/50 bg-[#0e0e12] hover:bg-[#18181f] transition group flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#807a72] mb-1.5">
                  <span className="text-[#d4af37] font-semibold">
                    {preset.category || 'প্রিসেট'}
                  </span>
                  <span className="font-mono">{preset.config.size}</span>
                </div>
                <h3 className="text-sm font-semibold text-[#f5f3ee] group-hover:text-[#f2d77d] transition">
                  {preset.name}
                </h3>
                <p className="text-xs text-[#807a72] line-clamp-2 mt-1">
                  {preset.description || `${preset.config.font} · ${preset.config.theme}`}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-[11px] text-[#b6b0a6]">
                <span>{preset.config.font}</span>
                <span className="text-[#d4af37] font-semibold">প্রয়োগ করুন →</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
