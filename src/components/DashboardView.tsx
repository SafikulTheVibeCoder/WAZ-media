import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { INITIAL_QUOTES, THEME_PRESETS, CATEGORIES } from '../data/quotes';
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
  Share2,
  Bookmark,
  Check
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

  // Filtered quotes based on selected category
  const filteredQuotes = selectedCat === 'সব'
    ? INITIAL_QUOTES
    : INITIAL_QUOTES.filter(q => q.cats.includes(selectedCat));

  const activeQuote = filteredQuotes[currentQuoteIndex % filteredQuotes.length] || INITIAL_QUOTES[0];

  const handleNextQuote = () => {
    setCurrentQuoteIndex(prev => (prev + 1) % filteredQuotes.length);
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
    setPoster(prev => ({
      ...prev,
      ...preset,
      showAr: !!preset.ar,
      showBismillah: true
    }));
    setCurrentView('poster');
    showToast('টেমপ্লেট সফলভাবে লোড হয়েছে');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Header
        title="স্বাগতম, WAZ MEDIA স্টুডিওতে"
        subtitle="যাচাইকৃত বিশুদ্ধ কুরআন ও সহীহ হাদিস থেকে ক্যাপশন তৈরি করুন এবং সেকেন্ডের মধ্যে নিখুঁত সোশ্যাল মিডিয়া পোস্টার বানান।"
        actionButton={
          <button
            onClick={() => {
              startNewDesign();
              setCurrentView('poster');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-semibold text-sm shadow-lg transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>নতুন পোস্টার বানান</span>
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18120d] border border-[#2d2117] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[#d4af37]/40 transition">
          <div className="w-12 h-12 rounded-xl bg-[#281b10] flex items-center justify-center text-[#d4af37] shrink-0 border border-[#44301d]">
            <FolderHeart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#f7df94]">
              {toBengaliNumber(savedDesigns.length)}
            </div>
            <div className="text-xs text-[#a9947c] mt-0.5">সংরক্ষিত ডিজাইন</div>
          </div>
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#d4af37]/5 rounded-full blur-xl group-hover:bg-[#d4af37]/10 transition-all pointer-events-none" />
        </div>

        <div className="bg-[#18120d] border border-[#2d2117] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[#d4af37]/40 transition">
          <div className="w-12 h-12 rounded-xl bg-[#281b10] flex items-center justify-center text-[#d4af37] shrink-0 border border-[#44301d]">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#f7df94]">
              {toBengaliNumber(stats.exports)}
            </div>
            <div className="text-xs text-[#a9947c] mt-0.5">ডাউনলোডকৃত পোস্টার</div>
          </div>
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#d4af37]/5 rounded-full blur-xl group-hover:bg-[#d4af37]/10 transition-all pointer-events-none" />
        </div>

        <div className="bg-[#18120d] border border-[#2d2117] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[#d4af37]/40 transition">
          <div className="w-12 h-12 rounded-xl bg-[#281b10] flex items-center justify-center text-[#d4af37] shrink-0 border border-[#44301d]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#f7df94]">
              {toBengaliNumber(stats.caps + INITIAL_QUOTES.length)}
            </div>
            <div className="text-xs text-[#a9947c] mt-0.5">মোট বাণী ও ক্যাপশন</div>
          </div>
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#d4af37]/5 rounded-full blur-xl group-hover:bg-[#d4af37]/10 transition-all pointer-events-none" />
        </div>

        <div className="bg-[#18120d] border border-[#2d2117] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[#d4af37]/40 transition">
          <div className="w-12 h-12 rounded-xl bg-[#281b10] flex items-center justify-center text-[#d4af37] shrink-0 border border-[#44301d]">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#f7df94]">
              {toBengaliNumber(INITIAL_QUOTES.length)}
            </div>
            <div className="text-xs text-[#a9947c] mt-0.5">যাচাইকৃত রেফারেন্স</div>
          </div>
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#d4af37]/5 rounded-full blur-xl group-hover:bg-[#d4af37]/10 transition-all pointer-events-none" />
        </div>
      </div>

      {/* Main split: Instant Generator Card + Recent Designs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Quote Generator */}
        <div className="lg:col-span-7 bg-[#17110c] border border-[#2d2117] rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#2d2117]/60">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse"></span>
              <h2 className="text-lg font-semibold text-[#f4eee2]">দ্রুত ক্যাপশন ও বাণী</h2>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#271d15] text-[#d4af37] border border-[#3f2f1d]">
              {activeQuote.type === 'quran' ? 'কুরআনুল কারীম' : activeQuote.type === 'hadith' ? 'সহীহ হাদিস' : 'ইসলামিক বাণী'}
            </span>
          </div>

          {/* Quick Categories Bar */}
          <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar">
            {['সব', 'সবর ও শোকর', 'তাওবা ও ক্ষমা', 'সালাত ও ইবাদত', 'জুমার দিন'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCat(cat);
                  setCurrentQuoteIndex(0);
                }}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition ${
                  selectedCat === cat
                    ? 'bg-[#d4af37] text-[#140e0a] font-semibold'
                    : 'bg-[#221811] text-[#9b8976] hover:text-[#f4eee2] hover:bg-[#2b1f16]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Card Content Display */}
          <div className="my-5 p-6 rounded-xl bg-gradient-to-b from-[#1c140d] to-[#16100a] border border-[#2d2117] flex flex-col items-center text-center">
            {activeQuote.ar && (
              <p 
                dir="rtl" 
                className="font-arabic text-2xl sm:text-3xl text-[#f7df94] leading-relaxed mb-4 tracking-wide"
              >
                {activeQuote.ar}
              </p>
            )}
            <p className="font-bengali text-lg sm:text-xl text-[#f3ebd9] font-medium leading-relaxed max-w-xl">
              “{activeQuote.bn}”
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#d4af37] font-semibold bg-[#2a1d13] px-3.5 py-1.5 rounded-full border border-[#4d361c]">
              <span>{activeQuote.ref}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyQuote(activeQuote)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#221811] hover:bg-[#2e2016] text-[#e0d2bf] text-xs font-medium border border-[#3a2a1d] transition"
                title="ক্যাপশন কপি করুন"
              >
                {copiedId === activeQuote.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                <span>{copiedId === activeQuote.id ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>

              <button
                onClick={() => toggleFavorite(activeQuote.id)}
                className={`p-2 rounded-lg border text-xs transition ${
                  isFavorite(activeQuote.id)
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]'
                    : 'bg-[#221811] border-[#3a2a1d] text-[#877461] hover:text-[#d4af37]'
                }`}
                title="পছন্দের তালিকায় রাখুন"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={handleNextQuote}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#221811] hover:bg-[#2e2016] text-[#e0d2bf] text-xs font-medium border border-[#3a2a1d] transition"
                title="পরবর্তী বাণী"
              >
                <RefreshCw className="w-4 h-4 text-[#a9947c]" />
                <span>আরেকটি দেখুন</span>
              </button>
            </div>

            <button
              onClick={() => loadQuoteToPoster(activeQuote)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e6c878] text-[#140e0a] text-xs font-bold transition shadow"
            >
              <Palette className="w-4 h-4" />
              <span>এই বাণী দিয়ে পোস্টার তৈরি</span>
            </button>
          </div>
        </div>

        {/* Right Column: Recent Designs or Blank state */}
        <div className="lg:col-span-5 bg-[#17110c] border border-[#2d2117] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#2d2117]/60">
              <h2 className="text-lg font-semibold text-[#f4eee2]">সাম্প্রতিক পোস্টার</h2>
              <button
                onClick={() => setCurrentView('saved')}
                className="text-xs text-[#d4af37] hover:underline flex items-center gap-1"
              >
                সবগুলো দেখুন
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {savedDesigns.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-[#201710] flex items-center justify-center text-[#7e6d5b] mx-auto mb-3">
                  <Palette className="w-8 h-8 opacity-60" />
                </div>
                <p className="text-sm text-[#baa791] font-medium">এখনো কোনো পোস্টার সংরক্ষণ করা হয়নি</p>
                <p className="text-xs text-[#7e6d5b] mt-1 max-w-xs mx-auto">
                  পোস্টার স্টুডিওতে যান এবং নিজের পছন্দমতো ডিজাইন বানিয়ে সংরক্ষণ করুন।
                </p>
                <button
                  onClick={() => setCurrentView('poster')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#241a12] text-[#f7df94] border border-[#3f2f1d] hover:border-[#d4af37]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  এখনই ডিজাইন শুরু করুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 mt-4">
                {savedDesigns.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadDesignForEdit(item)}
                    className="group relative bg-[#1f1610] rounded-xl overflow-hidden border border-[#2f2216] hover:border-[#d4af37] cursor-pointer transition shadow-md"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-black/40">
                      <img
                        src={item.thumb}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-[#e8dcbe] truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-[#877461]">
                        {item.poster.size.replace('x', '×')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 p-3.5 rounded-xl bg-[#1f1610] border border-[#2d2117] flex items-center justify-between">
            <span className="text-xs text-[#a9947c]">ব্র্যান্ড ও ওয়াটারমার্ক সেটিংস পরিবর্তন করতে চান?</span>
            <button
              onClick={() => setCurrentView('brand')}
              className="text-xs text-[#f7df94] hover:underline font-semibold"
            >
              ব্র্যান্ড ম্যানেজার →
            </button>
          </div>
        </div>
      </div>

      {/* Featured Template Cards */}
      <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#f4eee2]">দ্রুত পোস্টার টেমপ্লেট</h2>
          <p className="text-xs text-[#9b8976] mt-0.5">এক ক্লিকেই বিশেষ দিনের কিংবা নির্দিষ্ট বিষয়ের পোস্টার তৈরি করুন</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Template 1: Jummah Mubarak */}
          <div 
            onClick={() => handleApplyPresetTemplate({
              bn: 'সূর্য উদিত হওয়া দিনগুলোর মধ্যে সর্বোত্তম দিন হলো জুমার দিন।',
              ar: 'خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ',
              ref: 'সহিহ মুসলিম, হাদিস: ৮৫৪',
              theme: 'emerald',
              size: '1080x1080'
            })}
            className="cursor-pointer p-4 rounded-xl border border-[#2d2117] bg-gradient-to-br from-[#0c2e22] to-[#04150f] hover:border-[#d4af37] transition group shadow"
          >
            <div className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-1">জুমার স্পেশাল</div>
            <div className="text-sm font-semibold text-white line-clamp-2">জুমার দিনের বরকত ও ফজিলত</div>
            <p className="text-[11px] text-[#93c5b3] mt-2">এমারেল্ড রওজা থিম • স্কয়ার সাইজ</p>
          </div>

          {/* Template 2: Sabr */}
          <div 
            onClick={() => handleApplyPresetTemplate({
              bn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
              ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
              ref: 'সূরা আশ-শারহ, আয়াত: ৫-৬',
              theme: 'golden',
              size: '1080x1350'
            })}
            className="cursor-pointer p-4 rounded-xl border border-[#2d2117] bg-gradient-to-br from-[#3b2b10] to-[#1a1205] hover:border-[#d4af37] transition group shadow"
          >
            <div className="text-xs font-bold text-[#f7df94] uppercase tracking-wider mb-1">কুরআনের বাণী</div>
            <div className="text-sm font-semibold text-white line-clamp-2">ধৈর্য ও বিপদে স্বস্তির আশা</div>
            <p className="text-[11px] text-[#e3c78a] mt-2">গোল্ডেন নূর থিম • ৪:৫ পোর্ট্রেট</p>
          </div>

          {/* Template 3: Parents */}
          <div 
            onClick={() => handleApplyPresetTemplate({
              bn: 'হে আমার রব! তাদের উভয়ের প্রতি দয়া করুন, যেমন করে শৈশবে তারা আমাকে লালন-পালন করেছিলেন।',
              ar: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
              ref: 'সূরা আল-ইসরা, আয়াত: ২৪',
              theme: 'sapphire',
              size: '1080x1080'
            })}
            className="cursor-pointer p-4 rounded-xl border border-[#2d2117] bg-gradient-to-br from-[#12233b] to-[#060e19] hover:border-[#d4af37] transition group shadow"
          >
            <div className="text-xs font-bold text-[#60a5fa] uppercase tracking-wider mb-1">পিতা-মাতার জন্য দোয়া</div>
            <div className="text-sm font-semibold text-white line-clamp-2">মা-বাবার প্রতি ভালোবাসা ও সম্মান</div>
            <p className="text-[11px] text-[#93c5fd] mt-2">নীল গম্বুজ থিম • ১:১ পোস্ট</p>
          </div>

          {/* Template 4: Istighfar */}
          <div 
            onClick={() => handleApplyPresetTemplate({
              bn: 'তোমরা আল্লাহর রহমত থেকে নিরাশ হয়ো না। নিশ্চয়ই আল্লাহ সমস্ত গুনাহ ক্ষমা করে দেন।',
              ar: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
              ref: 'সূরা আয-যুমার, আয়াত: ৫৩',
              theme: 'black',
              size: '1080x1920'
            })}
            className="cursor-pointer p-4 rounded-xl border border-[#2d2117] bg-gradient-to-br from-[#241a12] to-[#0d0a07] hover:border-[#d4af37] transition group shadow"
          >
            <div className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider mb-1">তাওবাহ ও মাগফিরাত</div>
            <div className="text-sm font-semibold text-white line-clamp-2">আল্লাহর সীমাহীন ক্ষমা ও দয়া</div>
            <p className="text-[11px] text-[#d6b794] mt-2">রয়্যাল অবসিডিয়ান • ৯:১৬ স্টোরি</p>
          </div>
        </div>
      </div>

      {/* Saved Style Presets Section */}
      <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#f4eee2] flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#d4af37]" />
              <span>সংরক্ষিত ডিজাইন প্রিসেট (Saved Style Presets)</span>
            </h2>
            <p className="text-xs text-[#9b8976] mt-0.5">
              পূর্বে সংরক্ষিত যেকোনো ডিজাইনের স্টাইল নির্বাচন করে এক ক্লিকেই ক্যানভাসে প্রয়োগ করুন
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentView('poster');
            }}
            className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 font-semibold"
          >
            পোস্টার স্টুডিও →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {presets.slice(0, 6).map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                applyPreset(preset.id);
                setCurrentView('poster');
              }}
              className="p-4 rounded-xl border border-[#2d2117] hover:border-[#d4af37] bg-[#1a120b] hover:bg-[#221811] cursor-pointer transition group shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#271d15] text-[#d4af37] border border-[#3f2f1d]">
                    {preset.category || 'প্রিসেট'}
                  </span>
                  <span className="text-[10px] text-[#877461]">
                    {preset.config.size}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-[#f4eee2] group-hover:text-[#f7df94] transition mb-1">
                  {preset.name}
                </h4>
                <p className="text-xs text-[#877461] line-clamp-2">
                  {preset.description || `${preset.config.font} • ${preset.config.theme}`}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#231a12] text-[11px] text-[#baa791]">
                <span>ফন্ট: {preset.config.font}</span>
                <span className="text-[#d4af37] group-hover:underline font-medium">প্রয়োগ করুন →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
