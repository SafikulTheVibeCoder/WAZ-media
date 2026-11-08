import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { INITIAL_QUOTES, CATEGORIES } from '../data/quotes';
import { SURAH_LIST, SurahMeta } from '../data/surahList';
import { fetchAyahByNumber, fetchFullSurah, searchQuranByKeyword, AyahResult } from '../services/quranApi';
import { QuoteItem, ContentType } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { generateLocalFacebookPost } from '../utils/seoUtils';
import {
  Search,
  Copy,
  Check,
  Palette,
  Bookmark,
  BookOpen,
  Filter,
  Share2,
  Sparkles,
  RefreshCw,
  Globe,
  Layers,
  FileText,
  ChevronDown,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';

export const CaptionsView: React.FC = () => {
  const { loadQuoteToPoster, showToast, toggleFavorite, isFavorite, incrementStat, brand } = useApp();

  // Mode: curated highlights vs full Quran browser vs Hadith explorer
  const [activeTabMode, setActiveTabMode] = useState<'curated' | 'quran' | 'hadith'>('curated');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quran Browser State
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(2); // Default to Surah Al-Baqarah
  const [inputAyahNumber, setInputAyahNumber] = useState<string>('153'); // Default to Ayah 153
  const [quranAyahs, setQuranAyahs] = useState<AyahResult[]>([]);
  const [isFetchingQuran, setIsFetchingQuran] = useState(false);
  const [quranViewMode, setQuranViewMode] = useState<'single' | 'full'>('single');

  // Hadith Explorer State
  const [hadithTopic, setHadithTopic] = useState('সবর ও শোকর');
  const [dynamicHadiths, setDynamicHadiths] = useState<QuoteItem[]>([]);
  const [isFetchingHadith, setIsFetchingHadith] = useState(false);

  // API Search State
  const [apiSearchResults, setApiSearchResults] = useState<AyahResult[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [hasSearchedApi, setHasSearchedApi] = useState(false);

  // Initial load for default Ayah (Surah 2:153)
  useEffect(() => {
    let isMounted = true;
    fetchAyahByNumber(2, 153).then((res) => {
      if (isMounted && res) {
        setQuranAyahs([res]);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter curated quotes
  const filteredCuratedQuotes = useMemo(() => {
    return INITIAL_QUOTES.filter((q) => {
      if (onlyFavorites && !isFavorite(q.id)) return false;
      if (selectedCategory !== 'সব' && !q.cats.includes(selectedCategory)) return false;
      if (selectedType !== 'all' && q.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchBn = q.bn.toLowerCase().includes(query);
        const matchAr = q.ar.includes(query);
        const matchRef = q.ref.toLowerCase().includes(query);
        const matchTopic = q.topic?.toLowerCase().includes(query);
        const matchCats = q.cats.some((c) => c.toLowerCase().includes(query));
        return matchBn || matchAr || matchRef || matchTopic || matchCats;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, selectedType, onlyFavorites, isFavorite]);

  // Handle Fetching Specific Ayah
  const handleFetchAyah = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const ayahNum = parseInt(inputAyahNumber, 10);
    const surahMeta = SURAH_LIST.find((s) => s.number === selectedSurahNumber);
    if (!ayahNum || ayahNum < 1 || (surahMeta && ayahNum > surahMeta.totalAyahs)) {
      showToast(`আয়াত নম্বর ১ থেকে ${surahMeta?.totalAyahs || 1}-এর মধ্যে হতে হবে`);
      return;
    }

    setIsFetchingQuran(true);
    setQuranViewMode('single');
    try {
      const res = await fetchAyahByNumber(selectedSurahNumber, ayahNum);
      if (res) {
        setQuranAyahs([res]);
        showToast(`${res.reference} সফলভাবে লোড হয়েছে`);
      } else {
        showToast('আয়াত লোড করতে সমস্যা হয়েছে');
      }
    } catch {
      showToast('এপিআই সার্ভারে সংযোগ করা সম্ভব হয়নি');
    } finally {
      setIsFetchingQuran(false);
    }
  };

  // Handle Fetching Entire Surah (All verses)
  const handleFetchFullSurah = async () => {
    setIsFetchingQuran(true);
    setQuranViewMode('full');
    try {
      const res = await fetchFullSurah(selectedSurahNumber);
      if (res && res.length > 0) {
        setQuranAyahs(res);
        const surah = SURAH_LIST.find((s) => s.number === selectedSurahNumber);
        showToast(`সূরা ${surah?.banglaName}-এর মোট ${toBengaliNumber(res.length)}টি আয়াত লোড হয়েছে`);
      } else {
        showToast('সূরা লোড করা যায়নি');
      }
    } catch {
      showToast('এপিআই সংযোগে সমস্যা হয়েছে');
    } finally {
      setIsFetchingQuran(false);
    }
  };

  // Quick jump to popular Ayah
  const handleQuickAyahSelect = async (surahNum: number, ayahNum: number) => {
    setSelectedSurahNumber(surahNum);
    setInputAyahNumber(String(ayahNum));
    setQuranViewMode('single');
    setIsFetchingQuran(true);
    try {
      const res = await fetchAyahByNumber(surahNum, ayahNum);
      if (res) {
        setQuranAyahs([res]);
        showToast(`${res.reference} লোড হয়েছে`);
      }
    } catch {
      showToast('আয়াত লোড করা যায়নি');
    } finally {
      setIsFetchingQuran(false);
    }
  };

  // Handle Full Quran API Search by keyword
  const handlePerformApiSearch = async () => {
    if (!searchQuery.trim()) {
      showToast('অনুসন্ধান করার জন্য শব্দ লিখুন');
      return;
    }
    setIsSearchingApi(true);
    setHasSearchedApi(true);
    try {
      const results = await searchQuranByKeyword(searchQuery.trim());
      setApiSearchResults(results);
      if (results.length > 0) {
        showToast(`কুরআন এপিআই থেকে ${toBengaliNumber(results.length)}টি আয়াত পাওয়া গেছে`);
      } else {
        showToast('কুরআনে এই শব্দ সংবলিত কোনো আয়াত মেলেনি');
      }
    } catch {
      showToast('অনুসন্ধান ব্যর্থ হয়েছে');
    } finally {
      setIsSearchingApi(false);
    }
  };

  // Handle Generating / Fetching Dynamic Hadiths via API
  const handleGenerateHadith = async (topicName: string) => {
    setIsFetchingHadith(true);
    setHadithTopic(topicName);
    try {
      const res = await fetch('/api/hadith/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicName, count: 6 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          setDynamicHadiths(data.items);
          showToast(`"${topicName}" সম্পর্কিত হাদিস সংকলন প্রস্তুত!`);
        }
      }
    } catch {
      showToast('হাদিস এপিআই সংযোগে সমস্যা হয়েছে');
    } finally {
      setIsFetchingHadith(false);
    }
  };

  const handleCopyQuote = (quote: { bn: string; ar?: string; ref: string }) => {
    const post = generateLocalFacebookPost(
      {
        bn: quote.bn,
        ar: quote.ar,
        ref: quote.ref,
      },
      brand
    );
    navigator.clipboard.writeText(post.fbCaption);
    setCopiedId(quote.ref);
    incrementStat('caps');
    setTimeout(() => setCopiedId(null), 2000);
    showToast('সম্পূর্ণ এসইও ফেসবুক পোস্ট কপি করা হয়েছে');
  };

  const handleSendToPoster = (quote: { bn: string; ar?: string; ref: string; type?: ContentType }) => {
    loadQuoteToPoster({
      id: 'q-' + Date.now(),
      type: (quote.type || (quote.ref.includes('সূরা') ? 'quran' : 'hadith')) as ContentType,
      ar: quote.ar || '',
      bn: quote.bn,
      ref: quote.ref,
      cats: ['কুরআন ও হাদিস'],
    });
  };

  const selectedSurahMeta = SURAH_LIST.find((s) => s.number === selectedSurahNumber) || SURAH_LIST[1];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header
        title="ইসলামিক বাণী ও কুরআন ডিজিটাল লাইব্রেরি"
        subtitle="পবিত্র কুরআনুল কারীমের ১১৪টি সূরা, ৬,২৩৬টি আয়াত এবং সহীহ হাদিস ভাণ্ডার। এপিআই-এর মাধ্যমে যেকোনো আয়াত তৎক্ষণাৎ ক্যানভাসে ব্যবহার করুন।"
      />

      {/* Mode Switcher Tabs */}
      <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl p-2 sm:p-2.5 shadow-xl flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTabMode('curated')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition ${
            activeTabMode === 'curated'
              ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] font-bold shadow-md'
              : 'bg-[#120e0a] text-[#a9947c] hover:bg-[#20160f] hover:text-[#f4eee2] border border-[#2b1f14]'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>নির্বাচিত বাণী ও হাদিস</span>
        </button>

        <button
          onClick={() => setActiveTabMode('quran')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition ${
            activeTabMode === 'quran'
              ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] font-bold shadow-md'
              : 'bg-[#120e0a] text-[#a9947c] hover:bg-[#20160f] hover:text-[#f4eee2] border border-[#2b1f14]'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>সমগ্র কুরআন (১১৪ সূরা • ৬,২৩৬ আয়াত)</span>
        </button>

        <button
          onClick={() => {
            setActiveTabMode('hadith');
            if (dynamicHadiths.length === 0) {
              handleGenerateHadith('সবর ও শোকর');
            }
          }}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition ${
            activeTabMode === 'hadith'
              ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] font-bold shadow-md'
              : 'bg-[#120e0a] text-[#a9947c] hover:bg-[#20160f] hover:text-[#f4eee2] border border-[#2b1f14]'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span>সহীহ হাদিস এক্সপ্লোরার (API)</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. CURATED TAB */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTabMode === 'curated' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filter and Search Bar */}
          <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl p-4 md:p-5 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#877461]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নির্বাচিত বাণীতে খুঁজুন (উদাঃ ধৈর্য, সালাত, ক্ষমা, বুখারি)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#120e0a] border border-[#2d2117] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl text-sm text-[#f4eee2] placeholder-[#7a6a58] outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#877461] hover:text-[#f4eee2]"
                  >
                    মুছুন
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-3 py-2 text-xs rounded-lg font-medium transition shrink-0 ${
                    selectedType === 'all'
                      ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                      : 'bg-[#1f1610] text-[#a9947c] hover:bg-[#2a1d13]'
                  }`}
                >
                  সবগুলো
                </button>
                <button
                  onClick={() => setSelectedType('quran')}
                  className={`px-3 py-2 text-xs rounded-lg font-medium transition shrink-0 ${
                    selectedType === 'quran'
                      ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                      : 'bg-[#1f1610] text-[#a9947c] hover:bg-[#2a1d13]'
                  }`}
                >
                  কুরআন
                </button>
                <button
                  onClick={() => setSelectedType('hadith')}
                  className={`px-3 py-2 text-xs rounded-lg font-medium transition shrink-0 ${
                    selectedType === 'hadith'
                      ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                      : 'bg-[#1f1610] text-[#a9947c] hover:bg-[#2a1d13]'
                  }`}
                >
                  হাদিস
                </button>
                <button
                  onClick={() => setOnlyFavorites(!onlyFavorites)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg font-medium transition shrink-0 border ${
                    onlyFavorites
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f7df94]'
                      : 'bg-[#1f1610] border-[#2d2117] text-[#a9947c] hover:text-[#f4eee2]'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
                  <span>পছন্দের তালিকা</span>
                </button>
              </div>
            </div>

            {/* If user types a search, offer Quran Cloud API full-text search button */}
            {searchQuery.trim().length > 1 && (
              <div className="p-3 rounded-xl bg-[#221811] border border-[#d4af37]/30 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs text-[#e8dcbe]">
                  <Globe className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>
                    সমগ্র কুরআনের ৬,২৩৬টি আয়াত থেকে <strong>"{searchQuery}"</strong> দিয়ে লাইভ সার্চ করতে চান?
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveTabMode('quran');
                    handlePerformApiSearch();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e6c878] text-[#140e0a] font-bold text-xs transition shadow shrink-0 flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>কুরআন এপিআই-এ খুঁজুন</span>
                </button>
              </div>
            )}

            {/* Categories Chips */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#231a12]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs transition ${
                    selectedCategory === cat
                      ? 'bg-[#d4af37] text-[#140e0a] font-bold shadow'
                      : 'bg-[#1f1610] text-[#9b8976] hover:bg-[#2a1d13] hover:text-[#d3c2ad]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Result count */}
          <div className="flex items-center justify-between text-xs text-[#877461] px-1">
            <span>
              নির্বাচিত সংকলন: <strong className="text-[#f7df94]">{toBengaliNumber(filteredCuratedQuotes.length)}</strong> টি
            </span>
            <button
              onClick={() => setActiveTabMode('quran')}
              className="text-[#d4af37] hover:underline flex items-center gap-1"
            >
              <span>সকল ১১৪টি সূরায় যান</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCuratedQuotes.map((item) => {
              const favorited = isFavorite(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-[#17110c] border border-[#2d2117] hover:border-[#423122] rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#271d15] text-[#d4af37] border border-[#3f2f1d]">
                          {item.type === 'quran' ? 'কুরআন' : item.type === 'hadith' ? 'হাদিস' : 'উক্তি'}
                        </span>
                        {item.cats.slice(1, 3).map((c) => (
                          <span key={c} className="text-[10px] text-[#877461]">
                            #{c}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className={`p-1.5 rounded-md hover:bg-[#241a12] transition ${
                          favorited ? 'text-[#d4af37]' : 'text-[#6e5f50] hover:text-[#d4af37]'
                        }`}
                        title="পছন্দে রাখুন"
                      >
                        <Bookmark className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {item.ar && (
                      <p dir="rtl" className="font-arabic text-xl text-[#f7df94] leading-loose mb-3 text-right">
                        {item.ar}
                      </p>
                    )}

                    <p className="font-bengali text-base text-[#f0e7d5] leading-relaxed mb-3">
                      {item.bn}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#231a12] flex items-center justify-between">
                    <span className="text-xs font-medium text-[#c49b3a] truncate max-w-[50%]">
                      {item.ref}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyQuote(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#221811] hover:bg-[#2b1f16] text-[#e0d2bf] text-xs font-medium border border-[#3a2a1d] transition"
                        title="সম্পূর্ণ এসইও ফেসবুক পোস্ট কপি"
                      >
                        {copiedId === item.ref ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>কপি</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span>কপি</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSendToPoster(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e6c878] text-[#140e0a] text-xs font-bold transition shadow"
                        title="পোস্টার স্টুডিওতে ডিজাইন শুরু করুন"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>পোস্টার</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. FULL QURAN BROWSER TAB (All 114 Surahs & 6236 Verses) */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTabMode === 'quran' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Surah & Ayah Picker Control Panel */}
          <div className="bg-[#17110c] border border-[#3d2a1c] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2d2117]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#281b10] flex items-center justify-center text-[#d4af37] border border-[#44301d]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#f4eee2]">
                    আল-কুরআনুল কারীম এপিআই ব্রাউজার
                  </h3>
                  <p className="text-[11px] text-[#877461]">
                    সকল ১১৪টি সূরা ও ৬,২৩৬টি আয়াত আরবি উসমানি ও সহীহ বাংলা অনুবাদ সহ সরাসরি লাইভ
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex text-xs px-3 py-1 rounded-full bg-[#20160f] text-[#d4af37] border border-[#3d2a1c] font-medium">
                অনুবাদ: মুহিউদ্দীন খান
              </span>
            </div>

            {/* Surah Selector & Ayah Jump Bar */}
            <form onSubmit={handleFetchAyah} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Surah dropdown (114 Surahs) */}
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-xs font-semibold text-[#baa791]">
                  সূরা নির্বাচন করুন (১১৪টি সূরা)
                </label>
                <select
                  value={selectedSurahNumber}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    setSelectedSurahNumber(num);
                    setInputAyahNumber('1');
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#120e0a] border border-[#2d2117] focus:border-[#d4af37] rounded-xl text-xs sm:text-sm text-[#f4eee2] outline-none"
                >
                  {SURAH_LIST.map((s) => (
                    <option key={s.number} value={s.number} className="bg-[#17110c] text-[#f4eee2]">
                      {s.number}. সূরা {s.banglaName} ({s.arabicName}) — {toBengaliNumber(s.totalAyahs)} আয়াত ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Specific Ayah Input */}
              <div className="sm:col-span-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#baa791]">আয়াত নম্বর</label>
                  <span className="text-[10px] text-[#877461]">
                    সর্বোচ্চ: {toBengaliNumber(selectedSurahMeta.totalAyahs)}
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={selectedSurahMeta.totalAyahs}
                  value={inputAyahNumber}
                  onChange={(e) => setInputAyahNumber(e.target.value)}
                  placeholder="যেমন: ১৫৩"
                  className="w-full px-3 py-2 bg-[#120e0a] border border-[#2d2117] focus:border-[#d4af37] rounded-xl text-sm text-[#f4eee2] outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="sm:col-span-4 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isFetchingQuran}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isFetchingQuran ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>আয়াত দেখুন</span>
                </button>

                <button
                  type="button"
                  disabled={isFetchingQuran}
                  onClick={handleFetchFullSurah}
                  className="py-2.5 px-3 rounded-xl bg-[#221811] hover:bg-[#322318] text-[#f7df94] border border-[#3f2f1d] text-xs font-semibold transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  title="এই সূরার সকল আয়াত একসাথে লোড করুন"
                >
                  <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="hidden lg:inline">সম্পূর্ণ সূরা</span>
                  <span className="lg:hidden">সব আয়াত</span>
                </button>
              </div>
            </form>

            {/* Quick Popular Verses */}
            <div className="pt-2 pb-1 border-t border-[#231a12] flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-[#877461]">জনপ্রিয় আয়াত:</span>
              <button
                type="button"
                onClick={() => handleQuickAyahSelect(2, 153)}
                className="px-2.5 py-1 rounded-lg bg-[#1a130d] hover:bg-[#281b12] border border-[#2d2117] hover:border-[#d4af37] text-[#c7b59e] transition"
              >
                ধৈর্য ও সালাত (২:১৫৩)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAyahSelect(2, 255)}
                className="px-2.5 py-1 rounded-lg bg-[#1a130d] hover:bg-[#281b12] border border-[#2d2117] hover:border-[#d4af37] text-[#c7b59e] transition"
              >
                আয়াতুল কুরসি (২:২৫৫)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAyahSelect(94, 5)}
                className="px-2.5 py-1 rounded-lg bg-[#1a130d] hover:bg-[#281b12] border border-[#2d2117] hover:border-[#d4af37] text-[#c7b59e] transition font-medium"
              >
                কষ্টের সাথে স্বস্তি (৯৪:৫)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAyahSelect(94, 6)}
                className="px-2.5 py-1 rounded-lg bg-[#1a130d] hover:bg-[#281b12] border border-[#2d2117] hover:border-[#d4af37] text-[#c7b59e] transition font-medium"
              >
                নিশ্চয় স্বস্তি (৯৪:৬)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAyahSelect(112, 1)}
                className="px-2.5 py-1 rounded-lg bg-[#1a130d] hover:bg-[#281b12] border border-[#2d2117] hover:border-[#d4af37] text-[#c7b59e] transition"
              >
                সূরা ইখলাস (১১২:১)
              </button>
            </div>

            {/* Keyword Search inside Quran API */}
            <div className="pt-2.5 border-t border-[#231a12] flex flex-col sm:flex-row gap-2.5 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#877461]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="সমগ্র কুরআনের ৬,২৩৬টি আয়াত থেকে শব্দ দিয়ে খুঁজুন (যেমন: ধৈর্য, নামাজ, ক্ষমা, জান্নাত, রিজিক)..."
                  className="w-full pl-9 pr-3 py-2 bg-[#120e0a] border border-[#2d2117] focus:border-[#d4af37] rounded-xl text-xs text-[#f4eee2] outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePerformApiSearch();
                    }
                  }}
                />
              </div>

              <button
                type="button"
                disabled={isSearchingApi}
                onClick={handlePerformApiSearch}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#271d15] hover:bg-[#382a1c] text-[#f7df94] border border-[#d4af37]/40 text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
              >
                {isSearchingApi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5 text-[#d4af37]" />}
                <span>কুরআন লাইভ সার্চ</span>
              </button>
            </div>
          </div>

          {/* Surah Info Header Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#1c130c] via-[#241a12] to-[#17110c] border border-[#2d2117] flex flex-wrap items-center justify-between gap-3 text-xs text-[#a9947c]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="text-[#f7df94] font-semibold text-sm">
                সূরা {selectedSurahMeta.banglaName} ({selectedSurahMeta.arabicName})
              </span>
              <span>• অর্থ: {selectedSurahMeta.meaningBn}</span>
              <span>• মোট আয়াত: {toBengaliNumber(selectedSurahMeta.totalAyahs)}টি</span>
              <span>• অবতীর্ণ: {selectedSurahMeta.type}</span>
            </div>

            {hasSearchedApi && apiSearchResults.length > 0 && (
              <span className="px-2.5 py-1 rounded bg-[#2a1d13] text-[#d4af37] border border-[#44301d] font-bold">
                সার্চ রেজাল্ট: {toBengaliNumber(apiSearchResults.length)}টি আয়াত
              </span>
            )}
          </div>

          {/* Loading indicator */}
          {(isFetchingQuran || isSearchingApi) && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#d4af37] animate-spin mx-auto" />
              <p className="text-sm text-[#f4eee2] font-semibold">
                আল-কুরআন এপিআই থেকে আয়াত লোড হচ্ছে...
              </p>
              <p className="text-xs text-[#877461]">বিশুদ্ধ আরবি উসমানি ও বাংলা অনুবাদ ডাউনলোড হচ্ছে</p>
            </div>
          )}

          {/* Verses Display Grid */}
          {!isFetchingQuran && !isSearchingApi && (
            <div className="space-y-4">
              {(hasSearchedApi && apiSearchResults.length > 0 ? apiSearchResults : quranAyahs).map((ayah, idx) => (
                <div
                  key={idx}
                  className="bg-[#17110c] border border-[#2d2117] hover:border-[#4d361c] rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Header: Surah & Ayah Badge */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#231a12]">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#271d15] text-[#d4af37] text-xs font-bold border border-[#3f2f1d]">
                          {ayah.reference}
                        </span>
                        <span className="text-xs font-arabic text-[#877461]">
                          {ayah.surahNameAr}
                        </span>
                      </div>

                      <span className="text-[11px] text-[#877461]">
                        সূরা #{ayah.surahNumber} • আয়াত #{ayah.ayahNumber}
                      </span>
                    </div>

                    {/* Arabic Uthmani Text */}
                    {ayah.arabicText ? (
                      <p
                        dir="rtl"
                        className="font-arabic text-2xl text-[#f7df94] leading-loose mb-4 text-right tracking-wide"
                      >
                        {ayah.arabicText}
                      </p>
                    ) : (
                      <p className="text-xs text-[#877461] italic mb-2">
                        (আরবি উসমানি পাঠ্য পোস্টারে স্বয়ংক্রিয়ভাবে লোড হবে)
                      </p>
                    )}

                    {/* Bengali Translation */}
                    <p className="font-bengali text-base sm:text-lg text-[#f0e7d5] leading-relaxed mb-4">
                      “{ayah.bengaliText}”
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-[#231a12] flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-[#c49b3a] font-medium">
                      মুহিউদ্দীন খান অনুবাদ
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleCopyQuote({
                            bn: ayah.bengaliText,
                            ar: ayah.arabicText,
                            ref: ayah.reference,
                          })
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#221811] hover:bg-[#2b1f16] text-[#e0d2bf] text-xs font-medium border border-[#3a2a1d] transition"
                        title="সম্পূর্ণ ফেসবুক পোস্ট কপি"
                      >
                        {copiedId === ayah.reference ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span>ফেসবুক পোস্ট কপি</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          handleSendToPoster({
                            bn: ayah.bengaliText,
                            ar: ayah.arabicText,
                            ref: ayah.reference,
                            type: 'quran',
                          })
                        }
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] text-xs font-bold transition shadow"
                        title="পোস্টার স্টুডিওতে নিয়ে যান"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>পোস্টার বানান</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {quranAyahs.length === 0 && !hasSearchedApi && (
                <div className="py-12 text-center text-xs text-[#877461]">
                  সূরা ও আয়াত নম্বর দিয়ে "আয়াত দেখুন" বাটনে চাপুন।
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. HADITH EXPLORER TAB (Sahih Bukhari, Muslim, Tirmidhi) */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTabMode === 'hadith' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#17110c] border border-[#3d2a1c] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2d2117]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#281b10] flex items-center justify-center text-[#d4af37] border border-[#44301d]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#f4eee2]">
                    সহীহ হাদিস এক্সপ্লোরার ও লাইব্রেরি
                  </h3>
                  <p className="text-[11px] text-[#877461]">
                    সহীহ বুখারি, সহীহ মুসলিম ও জামে আত-তিরমিযি থেকে বিষয়ভিত্তিক সহীহ হাদিস ভাণ্ডার
                  </p>
                </div>
              </div>

              <button
                disabled={isFetchingHadith}
                onClick={() => handleGenerateHadith(hadithTopic)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#281b10] hover:bg-[#382618] text-[#f7df94] border border-[#44301d] text-xs font-bold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#d4af37] ${isFetchingHadith ? 'animate-spin' : ''}`} />
                <span>নতুন হাদিস আনুন</span>
              </button>
            </div>

            {/* Hadith Topic Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#baa791]">
                বিষয় নির্বাচন করুন:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'সবর ও শোকর',
                  'সালাত ও জামাত',
                  'নিয়ত ও সততা',
                  'তাওবা ও ক্ষমা',
                  'সদকা ও দান',
                  'পিতা-মাতার খেদমত',
                  'উত্তম চরিত্র ও ব্যবহার',
                  'জ্ঞান ও কুরআন শিক্ষা',
                  'রিজিক ও তাওয়াক্কুল',
                  'মৃত্যু ও জান্নাত',
                ].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleGenerateHadith(topic)}
                    className={`px-3 py-1.5 rounded-full text-xs transition ${
                      hadithTopic === topic
                        ? 'bg-[#d4af37] text-[#140e0a] font-bold shadow'
                        : 'bg-[#1f1610] text-[#9b8976] hover:bg-[#2a1d13] hover:text-[#d3c2ad]'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hadith Cards */}
          {isFetchingHadith ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#d4af37] animate-spin mx-auto" />
              <p className="text-sm text-[#f4eee2] font-semibold">
                "{hadithTopic}" সম্পর্কিত সহীহ হাদিস এপিআই থেকে সংকলন হচ্ছে...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dynamicHadiths.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#17110c] border border-[#2d2117] hover:border-[#423122] rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#271d15] text-[#d4af37] border border-[#3f2f1d]">
                        {item.topic || 'সহীহ হাদিস'}
                      </span>
                      <span className="text-xs text-[#c49b3a] font-medium">
                        {item.ref}
                      </span>
                    </div>

                    {item.ar && (
                      <p dir="rtl" className="font-arabic text-xl text-[#f7df94] leading-loose mb-3 text-right">
                        {item.ar}
                      </p>
                    )}

                    <p className="font-bengali text-base text-[#f0e7d5] leading-relaxed mb-4">
                      “{item.bn}”
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#231a12] flex items-center justify-between">
                    <span className="text-[11px] text-[#877461]">
                      সহীহ সনদযুক্ত
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyQuote(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#221811] hover:bg-[#2b1f16] text-[#e0d2bf] text-xs font-medium border border-[#3a2a1d] transition"
                        title="সম্পূর্ণ ফেসবুক পোস্ট কপি"
                      >
                        {copiedId === item.ref ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>কপি</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span>কপি</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSendToPoster({ ...item, type: 'hadith' })}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e6c878] text-[#140e0a] text-xs font-bold transition shadow"
                        title="পোস্টার স্টুডিওতে পোস্টার তৈরি করুন"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>পোস্টার</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
