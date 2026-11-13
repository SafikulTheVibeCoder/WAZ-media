import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { EmptyState } from './ui/EmptyState';
import { INITIAL_QUOTES, CATEGORIES } from '../data/quotes';
import { SURAH_LIST } from '../data/surahList';
import {
  fetchAyahByNumber,
  fetchFullSurah,
  searchQuranByKeyword,
  fetchDynamicQuranBatch,
  AyahResult,
} from '../services/quranApi';
import {
  fetchHadithsByTopic,
  fetchLiveHadithByNumber,
  HadithItem,
  HADITH_TOPICS,
  HADITH_BOOKS,
} from '../services/hadithApi';
import { QuoteItem, ContentType } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { generateLocalFacebookPost } from '../utils/seoUtils';
import {
  Search,
  Copy,
  Check,
  Bookmark,
  BookOpen,
  Sparkles,
  RefreshCw,
  Globe,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';

export const CaptionsView: React.FC = () => {
  const { loadQuoteToPoster, showToast, toggleFavorite, isFavorite, incrementStat, brand } =
    useApp();

  const [activeTabMode, setActiveTabMode] = useState<'curated' | 'quran' | 'hadith'>('curated');

  // 1. Curated & Dynamic Quotes State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [extraCuratedAyahs, setExtraCuratedAyahs] = useState<QuoteItem[]>([]);
  const [curatedBatchPage, setCuratedBatchPage] = useState(1);
  const [isLoadingMoreCurated, setIsLoadingMoreCurated] = useState(false);

  // 2. Quran API Browser State
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(2);
  const [inputAyahNumber, setInputAyahNumber] = useState<string>('153');
  const [quranAyahs, setQuranAyahs] = useState<AyahResult[]>([]);
  const [isFetchingQuran, setIsFetchingQuran] = useState(false);
  const [quranViewMode, setQuranViewMode] = useState<'single' | 'full'>('single');
  const [surahPage, setSurahPage] = useState(1);
  const ayahsPerPage = 15;
  const [apiSearchResults, setApiSearchResults] = useState<AyahResult[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [hasSearchedApi, setHasSearchedApi] = useState(false);

  // 3. Hadith Explorer State
  const [hadithTopic, setHadithTopic] = useState<string>('সবর ও শোকর');
  const [selectedHadithBook, setSelectedHadithBook] = useState<string>('all');
  const [hadithList, setHadithList] = useState<HadithItem[]>([]);
  const [isFetchingHadith, setIsFetchingHadith] = useState(false);
  const [hadithSearch, setHadithSearch] = useState('');
  const [directBook, setDirectBook] = useState<'bukhari' | 'muslim' | 'tirmidhi' | 'nawawi'>(
    'bukhari'
  );
  const [directNumber, setDirectNumber] = useState<string>('1');
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchAyahByNumber(2, 153).then((res) => {
      if (isMounted && res) {
        setQuranAyahs([res]);
      }
    });

    fetchHadithsByTopic('সবর ও শোকর').then((items) => {
      if (isMounted && items.length > 0) {
        setHadithList(items);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const allCuratedQuotes = useMemo(() => {
    return [...INITIAL_QUOTES, ...extraCuratedAyahs];
  }, [extraCuratedAyahs]);

  const filteredCuratedQuotes = useMemo(() => {
    return allCuratedQuotes.filter((q) => {
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
  }, [allCuratedQuotes, searchQuery, selectedCategory, selectedType, onlyFavorites, isFavorite]);

  const handleLoadMoreDynamicQuran = async () => {
    setIsLoadingMoreCurated(true);
    try {
      const nextPage = curatedBatchPage + 1;
      const batch = await fetchDynamicQuranBatch(nextPage, 20);
      if (batch.length > 0) {
        const newItems: QuoteItem[] = batch.map((item, idx) => ({
          id: `dyn-q-${item.surahNumber}-${item.ayahNumber}-${Date.now()}-${idx}`,
          type: 'quran',
          ar: item.arabicText,
          bn: item.bengaliText,
          ref: item.reference,
          topic: `${item.surahNameBn} আয়াত ${item.ayahNumber}`,
          cats: ['কুরআন', 'কুরআন ও জ্ঞান'],
        }));
        setExtraCuratedAyahs((prev) => [...prev, ...newItems]);
        setCuratedBatchPage(nextPage);
        showToast(
          `কুরআন এপিআই থেকে আরও ${toBengaliNumber(newItems.length)}টি আয়াত লোড করা হয়েছে!`
        );
      } else {
        showToast('নতুন আয়াত লোড করতে সমস্যা হয়েছে');
      }
    } catch {
      showToast('এপিআই সংযোগে সমস্যা হয়েছে');
    } finally {
      setIsLoadingMoreCurated(false);
    }
  };

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
    setHasSearchedApi(false);
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

  const handleFetchFullSurah = async () => {
    setIsFetchingQuran(true);
    setQuranViewMode('full');
    setHasSearchedApi(false);
    setSurahPage(1);
    try {
      const res = await fetchFullSurah(selectedSurahNumber);
      if (res && res.length > 0) {
        setQuranAyahs(res);
        const surah = SURAH_LIST.find((s) => s.number === selectedSurahNumber);
        showToast(
          `সূরা ${surah?.banglaName}-এর মোট ${toBengaliNumber(res.length)}টি আয়াত লোড হয়েছে`
        );
      } else {
        showToast('সূরা লোড করা যায়নি');
      }
    } catch {
      showToast('এপিআই সংযোগে সমস্যা হয়েছে');
    } finally {
      setIsFetchingQuran(false);
    }
  };

  const handleQuickAyahSelect = async (surahNum: number, ayahNum: number) => {
    setSelectedSurahNumber(surahNum);
    setInputAyahNumber(String(ayahNum));
    setQuranViewMode('single');
    setHasSearchedApi(false);
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

  const handlePerformApiSearch = async () => {
    if (!searchQuery.trim()) {
      showToast('অনুসন্ধান করার জন্য শব্দ লিখুন');
      return;
    }
    setIsSearchingApi(true);
    setHasSearchedApi(true);
    setQuranViewMode('single');
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

  const handleLoadHadiths = async (
    topicName: string,
    bookName: string = selectedHadithBook
  ) => {
    setIsFetchingHadith(true);
    setHadithTopic(topicName);
    setSelectedHadithBook(bookName);

    try {
      const localMatches = await fetchHadithsByTopic(topicName, bookName);
      if (localMatches.length > 0) {
        setHadithList(localMatches);
      }

      const res = await fetch('/api/hadith/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicName, count: 6 }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          const formatted: HadithItem[] = data.items.map((it: any, idx: number) => ({
            id: it.id || `h-${idx}-${Date.now()}`,
            type: 'hadith',
            book: (it.ref?.includes('বুখারি')
              ? 'bukhari'
              : it.ref?.includes('মুসলিম')
              ? 'muslim'
              : 'tirmidhi') as any,
            bookNameBn: it.ref?.split(',')[0] || 'সহীহ হাদিস',
            hadithNumber: idx + 1,
            ar: it.ar || '',
            bn: it.bn,
            ref: it.ref,
            topic: it.topic || topicName,
            cats: it.cats || ['হাদিস', topicName],
          }));
          setHadithList(formatted);
          showToast(`"${topicName}" সম্পর্কিত হাদিস সংকলন প্রস্তুত!`);
        }
      }
    } catch (err) {
      console.warn('Hadith API notice:', err);
      if (hadithList.length === 0) {
        const fallback = await fetchHadithsByTopic(topicName, bookName);
        setHadithList(fallback);
      }
    } finally {
      setIsFetchingHadith(false);
    }
  };

  const handleDirectHadithLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(directNumber, 10);
    if (!num || num < 1) {
      showToast('বৈধ হাদিস নম্বর লিখুন');
      return;
    }
    setIsFetchingDirect(true);
    try {
      const item = await fetchLiveHadithByNumber(directBook, num);
      if (item) {
        setHadithList([item]);
        showToast(`${item.ref} সফলভাবে লোড হয়েছে!`);
      } else {
        showToast('উক্ত নম্বরের হাদিস পাওয়া যায়নি।');
      }
    } catch {
      showToast('হাদিস লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsFetchingDirect(false);
    }
  };

  const filteredHadithList = useMemo(() => {
    return hadithList.filter((h) => {
      if (selectedHadithBook !== 'all' && h.book !== selectedHadithBook) return false;
      if (hadithSearch.trim()) {
        const s = hadithSearch.toLowerCase();
        return (
          h.bn.toLowerCase().includes(s) ||
          h.ar.includes(s) ||
          h.ref.toLowerCase().includes(s) ||
          h.topic.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [hadithList, selectedHadithBook, hadithSearch]);

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

  const handleSendToPoster = async (quote: {
    bn: string;
    ar?: string;
    ref: string;
    type?: ContentType;
    surahNumber?: number;
    ayahNumber?: number;
  }) => {
    let arabic = quote.ar || '';
    if (!arabic && quote.surahNumber && quote.ayahNumber) {
      showToast('আরবি উসমানি পাঠ্য লোড হচ্ছে...');
      try {
        const full = await fetchAyahByNumber(quote.surahNumber, quote.ayahNumber);
        if (full?.arabicText) {
          arabic = full.arabicText;
        }
      } catch {
        // Fallback without arabic
      }
    }

    loadQuoteToPoster({
      id: 'q-' + Date.now(),
      type: (quote.type || (quote.ref.includes('সূরা') ? 'quran' : 'hadith')) as ContentType,
      ar: arabic,
      bn: quote.bn,
      ref: quote.ref,
      cats: ['কুরআন ও হাদিস'],
    });
  };

  const selectedSurahMeta =
    SURAH_LIST.find((s) => s.number === selectedSurahNumber) || SURAH_LIST[1];

  const paginatedQuranAyahs = useMemo(() => {
    if (quranViewMode !== 'full') return quranAyahs;
    const startIndex = (surahPage - 1) * ayahsPerPage;
    return quranAyahs.slice(startIndex, startIndex + ayahsPerPage);
  }, [quranAyahs, quranViewMode, surahPage]);

  const totalSurahPages = Math.ceil(quranAyahs.length / ayahsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Header
        title="ইসলামিক বাণী ও কুরআন ডিজিটাল লাইব্রেরি"
        subtitle="পবিত্র কুরআনুল কারীমের ১১৪টি সূরা, ৬,২৩৬টি আয়াত এবং সহীহ হাদিস ভাণ্ডার। সরাসরি পোস্টার ক্যানভাসে ব্যবহার করুন।"
      />

      {/* Mode Segmented Control */}
      <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-1.5 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTabMode('curated')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition min-h-[42px] tabular-nums ${
            activeTabMode === 'curated'
              ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
              : 'text-[#b6b0a6] hover:text-[#f5f3ee] hover:bg-[#1b1b22]'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>নির্বাচিত বাণী ({toBengaliNumber(allCuratedQuotes.length)})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabMode('quran')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition min-h-[42px] ${
            activeTabMode === 'quran'
              ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
              : 'text-[#b6b0a6] hover:text-[#f5f3ee] hover:bg-[#1b1b22]'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>সমগ্র কুরআন (১১৪ সূরা)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTabMode('hadith');
            if (hadithList.length === 0) {
              handleLoadHadiths('সবর ও শোকর');
            }
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition min-h-[42px] ${
            activeTabMode === 'hadith'
              ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
              : 'text-[#b6b0a6] hover:text-[#f5f3ee] hover:bg-[#1b1b22]'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span>সহীহ হাদিস এক্সপ্লোরার</span>
        </button>
      </div>

      {/* TAB 1: CURATED */}
      {activeTabMode === 'curated' && (
        <div className="space-y-5">
          <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#807a72]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="বাণীতে খুঁজুন (যেমন: ধৈর্য, সালাত, ক্ষমা, জান্নাত, বুখারি)..."
                  className="w-full pl-10 pr-16 py-2.5 bg-[#0e0e12] border border-white/10 focus:border-[#d4af37] rounded-xl text-sm text-[#f5f3ee] placeholder-[#807a72] outline-none transition min-h-[42px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#b6b0a6] hover:text-[#f5f3ee]"
                  >
                    মুছুন
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: 'all', label: `সব (${toBengaliNumber(allCuratedQuotes.length)})` },
                  { id: 'quran', label: 'কুরআন' },
                  { id: 'hadith', label: 'হাদিস' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`px-3 py-2 text-xs rounded-xl font-semibold transition shrink-0 min-h-[40px] tabular-nums ${
                      selectedType === t.id
                        ? 'bg-[#d4af37] text-[#0b0b0e]'
                        : 'bg-[#1b1b22] text-[#b6b0a6] hover:text-[#f5f3ee]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setOnlyFavorites(!onlyFavorites)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl font-semibold transition shrink-0 border min-h-[40px] ${
                    onlyFavorites
                      ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#f2d77d]'
                      : 'bg-[#1b1b22] border-white/[0.08] text-[#b6b0a6] hover:text-[#f5f3ee]'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
                  <span>পছন্দের</span>
                </button>
              </div>
            </div>

            {selectedType === 'quran' && (
              <div className="p-3.5 rounded-xl bg-[#0e0e12] border border-[#d4af37]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#f5f3ee]">
                  <Globe className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>
                    পবিত্র কুরআনের <strong>১১৪টি পূর্ণ সূরা ও ৬,২৩৬টি আয়াত</strong> ব্রাউজ ও সার্চ করতে চান?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTabMode('quran')}
                  className="px-3.5 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition shrink-0 inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>সমগ্র কুরআন ব্রাউজার</span>
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.06]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition ${
                    selectedCategory === cat
                      ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                      : 'bg-[#1b1b22] text-[#b6b0a6] hover:text-[#f5f3ee]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Count + Dynamic Loader */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#807a72] px-1">
            <span className="tabular-nums">
              প্রদর্শিত হচ্ছে:{' '}
              <strong className="text-[#f2d77d]">
                {toBengaliNumber(filteredCuratedQuotes.length)}
              </strong>{' '}
              টি বাণী
            </span>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isLoadingMoreCurated}
                onClick={handleLoadMoreDynamicQuran}
                className="px-3 py-2 rounded-xl bg-[#141419] hover:bg-[#1b1b22] text-[#f2d77d] border border-white/10 text-xs font-semibold transition inline-flex items-center gap-1.5 disabled:opacity-50 min-h-[38px]"
              >
                {isLoadingMoreCurated ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5 text-[#d4af37]" />
                )}
                <span>কুরআন API থেকে আরও আয়াত</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabMode('quran')}
                className="text-[#d4af37] hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>সকল ১১৪ সূরায় যান</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {filteredCuratedQuotes.length === 0 ? (
            <EmptyState
              icon={<Search className="w-6 h-6" />}
              title="কোনো বাণী মেলেনি"
              description="অনুসন্ধানের শব্দ বা ক্যাটাগরি পরিবর্তন করে আবার চেষ্টা করুন।"
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('সব');
                    setSelectedType('all');
                    setOnlyFavorites(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1b1b22] text-[#f2d77d] border border-white/10 text-xs font-semibold"
                >
                  ফিল্টার রিসেট করুন
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCuratedQuotes.map((item) => {
                const favorited = isFavorite(item.id);
                return (
                  <article
                    key={item.id}
                    className="bg-[#141419] border border-white/[0.08] hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-[#d4af37]">
                            {item.type === 'quran'
                              ? 'কুরআন'
                              : item.type === 'hadith'
                              ? 'হাদিস'
                              : 'উক্তি'}
                          </span>
                          {item.cats.slice(1, 3).map((c) => (
                            <span key={c} className="text-[#807a72]">
                              · {c}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleFavorite(item.id)}
                          className={`w-9 h-9 rounded-lg hover:bg-[#1b1b22] flex items-center justify-center transition ${
                            favorited ? 'text-[#d4af37]' : 'text-[#807a72] hover:text-[#d4af37]'
                          }`}
                          aria-label="পছন্দে রাখুন"
                        >
                          <Bookmark className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {item.ar && (
                        <p
                          dir="rtl"
                          className="font-arabic text-xl text-[#f2d77d] leading-loose mb-3 text-right"
                        >
                          {item.ar}
                        </p>
                      )}

                      <p className="font-bengali text-[15px] text-[#f5f3ee] leading-relaxed mb-3">
                        {item.bn}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs text-[#b6b0a6] font-medium">{item.ref}</span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyQuote(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] text-xs font-medium border border-white/[0.08] transition min-h-[38px]"
                        >
                          {copiedId === item.ref ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>পোস্ট কপি</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendToPoster(item)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] text-xs font-bold transition min-h-[38px]"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>পোস্টার তৈরি</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FULL QURAN BROWSER */}
      {activeTabMode === 'quran' && (
        <div className="space-y-5">
          <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
            <form onSubmit={handleFetchAyah} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5 space-y-1.5">
                <label
                  htmlFor="quran-surah-select"
                  className="text-xs font-semibold text-[#b6b0a6] block"
                >
                  সূরা নির্বাচন করুন (১-১১৪)
                </label>
                <select
                  id="quran-surah-select"
                  value={selectedSurahNumber}
                  onChange={(e) => {
                    setSelectedSurahNumber(Number(e.target.value));
                    setInputAyahNumber('1');
                  }}
                  className="w-full px-3 py-2.5 bg-[#0e0e12] border border-white/10 focus:border-[#d4af37] rounded-xl text-xs sm:text-sm text-[#f5f3ee] outline-none min-h-[42px]"
                >
                  {SURAH_LIST.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. সূরা {s.banglaName} ({s.arabicName}) —{' '}
                      {toBengaliNumber(s.totalAyahs)} আয়াত
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="quran-ayah-input" className="font-semibold text-[#b6b0a6]">
                    আয়াত নম্বর
                  </label>
                  <span className="text-[11px] text-[#807a72] tabular-nums">
                    সর্বোচ্চ: {toBengaliNumber(selectedSurahMeta.totalAyahs)}
                  </span>
                </div>
                <input
                  id="quran-ayah-input"
                  type="number"
                  min={1}
                  max={selectedSurahMeta.totalAyahs}
                  value={inputAyahNumber}
                  onChange={(e) => setInputAyahNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0e0e12] border border-white/10 focus:border-[#d4af37] rounded-xl text-sm text-[#f5f3ee] outline-none min-h-[42px] tabular-nums"
                />
              </div>

              <div className="sm:col-span-4 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isFetchingQuran}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition disabled:opacity-50 inline-flex items-center justify-center gap-1.5 min-h-[42px]"
                >
                  {isFetchingQuran ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>আয়াত দেখুন</span>
                </button>

                <button
                  type="button"
                  disabled={isFetchingQuran}
                  onClick={handleFetchFullSurah}
                  className="py-2.5 px-3.5 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-white/10 text-xs font-semibold transition disabled:opacity-50 inline-flex items-center justify-center gap-1.5 min-h-[42px]"
                >
                  <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>সম্পূর্ণ সূরা</span>
                </button>
              </div>
            </form>

            {/* Quick Verses */}
            <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[#807a72]">জনপ্রিয়:</span>
              {[
                { label: 'ধৈর্য ও সালাত (২:১৫৩)', surah: 2, ayah: 153 },
                { label: 'আয়াতুল কুরসি (২:২৫৫)', surah: 2, ayah: 255 },
                { label: 'কষ্টের সাথে স্বস্তি (৯৪:৫)', surah: 94, ayah: 5 },
                { label: 'রহমতে হতাশ হয়ো না (৩৯:৫৩)', surah: 39, ayah: 53 },
                { label: 'সূরা ইখলাস (১১২:১)', surah: 112, ayah: 1 },
              ].map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => handleQuickAyahSelect(q.surah, q.ayah)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0e0e12] hover:bg-[#1b1b22] border border-white/[0.08] text-[11px] text-[#b6b0a6] hover:text-[#f2d77d] transition"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Keyword API Search */}
            <div className="pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#807a72]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="সমগ্র কুরআনের ৬,২৩৬টি আয়াত থেকে শব্দ দিয়ে খুঁজুন (যেমন: ধৈর্য, নামাজ, ক্ষমা)..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0e0e12] border border-white/10 focus:border-[#d4af37] rounded-xl text-xs text-[#f5f3ee] outline-none min-h-[40px]"
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
                className="px-4 py-2.5 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-white/10 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 shrink-0 min-h-[40px]"
              >
                {isSearchingApi ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
                )}
                <span>কুরআন লাইভ সার্চ</span>
              </button>
            </div>
          </div>

          {/* Surah Header Bar */}
          <div className="p-4 rounded-xl bg-[#141419] border border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-[#b6b0a6]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#f2d77d] font-bold text-sm">
                সূরা {selectedSurahMeta.banglaName} ({selectedSurahMeta.arabicName})
              </span>
              <span className="text-[#807a72]">·</span>
              <span>অর্থ: {selectedSurahMeta.meaningBn}</span>
              <span className="text-[#807a72]">·</span>
              <span className="tabular-nums">
                আয়াত: {toBengaliNumber(selectedSurahMeta.totalAyahs)}টি
              </span>
              <span className="text-[#807a72]">·</span>
              <span>{selectedSurahMeta.type}</span>
            </div>

            {hasSearchedApi && apiSearchResults.length > 0 && (
              <span className="text-xs text-[#d4af37] font-semibold tabular-nums">
                ফলাফল: {toBengaliNumber(apiSearchResults.length)}টি আয়াত
              </span>
            )}
          </div>

          {isFetchingQuran || isSearchingApi ? (
            <div className="py-14 text-center space-y-2.5 bg-[#141419] border border-white/[0.08] rounded-2xl">
              <RefreshCw className="w-7 h-7 text-[#d4af37] animate-spin mx-auto" />
              <p className="text-sm text-[#f5f3ee] font-semibold">
                আল-কুরআন এপিআই থেকে আয়াত লোড হচ্ছে...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(hasSearchedApi && apiSearchResults.length > 0
                ? apiSearchResults
                : paginatedQuranAyahs
              ).map((ayah, idx) => (
                <article
                  key={idx}
                  className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#d4af37]">{ayah.reference}</span>
                      <span className="font-arabic text-[#807a72]">{ayah.surahNameAr}</span>
                    </div>
                    <span className="text-[#807a72] tabular-nums">
                      সূরা {toBengaliNumber(ayah.surahNumber)} · আয়াত{' '}
                      {toBengaliNumber(ayah.ayahNumber)}
                    </span>
                  </div>

                  {ayah.arabicText ? (
                    <p
                      dir="rtl"
                      className="font-arabic text-2xl text-[#f2d77d] leading-loose text-right"
                    >
                      {ayah.arabicText}
                    </p>
                  ) : (
                    <p className="text-xs text-[#807a72]">
                      আরবি উসমানি পাঠ্য পোস্টারে স্বয়ংক্রিয়ভাবে লোড হবে
                    </p>
                  )}

                  <p className="font-bengali text-base text-[#f5f3ee] leading-relaxed">
                    “{ayah.bengaliText}”
                  </p>

                  <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-[#807a72]">অনুবাদ: মুহিউদ্দীন খান</span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyQuote({
                            bn: ayah.bengaliText,
                            ar: ayah.arabicText,
                            ref: ayah.reference,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] text-xs font-medium border border-white/[0.08] transition min-h-[38px]"
                      >
                        {copiedId === ayah.reference ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                        )}
                        <span>{copiedId === ayah.reference ? 'কপি হয়েছে' : 'পোস্ট কপি'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSendToPoster({
                            bn: ayah.bengaliText,
                            ar: ayah.arabicText,
                            ref: ayah.reference,
                            type: 'quran',
                            surahNumber: ayah.surahNumber,
                            ayahNumber: ayah.ayahNumber,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] text-xs font-bold transition min-h-[38px]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>পোস্টার তৈরি</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {quranViewMode === 'full' && totalSurahPages > 1 && !hasSearchedApi && (
                <div className="p-4 rounded-xl bg-[#141419] border border-white/[0.08] flex items-center justify-between text-xs text-[#b6b0a6]">
                  <span className="tabular-nums">
                    পৃষ্ঠা <strong className="text-[#f2d77d]">{toBengaliNumber(surahPage)}</strong> /{' '}
                    {toBengaliNumber(totalSurahPages)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={surahPage <= 1}
                      onClick={() => setSurahPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-2 rounded-xl bg-[#1b1b22] text-[#f5f3ee] disabled:opacity-40 inline-flex items-center gap-1 min-h-[36px]"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>পূর্ববর্তী</span>
                    </button>
                    <button
                      type="button"
                      disabled={surahPage >= totalSurahPages}
                      onClick={() => setSurahPage((p) => Math.min(totalSurahPages, p + 1))}
                      className="px-3 py-2 rounded-xl bg-[#1b1b22] text-[#f5f3ee] disabled:opacity-40 inline-flex items-center gap-1 min-h-[36px]"
                    >
                      <span>পরবর্তী</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HADITH EXPLORER */}
      {activeTabMode === 'hadith' && (
        <div className="space-y-5">
          <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div>
                <h2 className="font-bold text-base text-[#f5f3ee]">
                  সহীহ হাদিস এক্সপ্লোরার ও লাইব্রেরি
                </h2>
                <p className="text-xs text-[#807a72] mt-0.5">
                  সহীহ বুখারি, সহীহ মুসলিম, তিরমিযী ও ৪০ হাদিস নববী থেকে বিষয়ভিত্তিক সংকলন
                </p>
              </div>
              <button
                type="button"
                disabled={isFetchingHadith}
                onClick={() => handleLoadHadiths(hadithTopic, selectedHadithBook)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-white/10 text-xs font-semibold transition disabled:opacity-50 min-h-[40px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingHadith ? 'animate-spin' : ''}`} />
                <span>রিফ্রেশ</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-xs text-[#807a72] shrink-0 mr-1">গ্রন্থ:</span>
              {HADITH_BOOKS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleLoadHadiths(hadithTopic, b.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    selectedHadithBook === b.id
                      ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                      : 'bg-[#1b1b22] text-[#b6b0a6] hover:text-[#f5f3ee]'
                  }`}
                >
                  {b.nameBn}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {HADITH_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleLoadHadiths(topic, selectedHadithBook)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition ${
                    hadithTopic === topic
                      ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                      : 'bg-[#0e0e12] text-[#b6b0a6] border border-white/[0.06] hover:text-[#f5f3ee]'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#807a72]" />
                <input
                  type="text"
                  value={hadithSearch}
                  onChange={(e) => setHadithSearch(e.target.value)}
                  placeholder="হাদিসের বাংলা টেক্সট বা বিষয়ে অনুসন্ধান..."
                  className="w-full pl-9 pr-3 py-2 bg-[#0e0e12] border border-white/10 focus:border-[#d4af37] rounded-xl text-xs text-[#f5f3ee] outline-none min-h-[40px]"
                />
              </div>

              <form onSubmit={handleDirectHadithLookup} className="flex items-center gap-2">
                <select
                  value={directBook}
                  onChange={(e) => setDirectBook(e.target.value as any)}
                  className="px-3 py-2 bg-[#0e0e12] border border-white/10 focus:border-[#d4af37] rounded-xl text-xs text-[#f5f3ee] outline-none min-h-[40px]"
                >
                  <option value="bukhari">বুখারি</option>
                  <option value="muslim">মুসলিম</option>
                  <option value="tirmidhi">তিরমিযী</option>
                  <option value="nawawi">৪০ নববী</option>
                </select>

                <input
                  type="number"
                  min={1}
                  value={directNumber}
                  onChange={(e) => setDirectNumber(e.target.value)}
                  placeholder="নম্বর"
                  className="w-24 px-2.5 py-2 bg-[#0e0e12] border border-white/10 focus:border-[#d4af37] rounded-xl text-xs text-[#f5f3ee] text-center outline-none min-h-[40px] tabular-nums"
                />

                <button
                  type="submit"
                  disabled={isFetchingDirect}
                  className="flex-1 px-3 py-2 bg-[#1b1b22] hover:bg-[#23232c] border border-white/10 text-[#f2d77d] text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[40px]"
                >
                  {isFetchingDirect ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>হাদিস খুঁজুন</span>
                </button>
              </form>
            </div>
          </div>

          {isFetchingHadith ? (
            <div className="py-14 text-center space-y-2.5 bg-[#141419] border border-white/[0.08] rounded-2xl">
              <RefreshCw className="w-7 h-7 text-[#d4af37] animate-spin mx-auto" />
              <p className="text-sm text-[#f5f3ee] font-semibold">
                "{hadithTopic}" সম্পর্কিত সহীহ হাদিস লোড হচ্ছে...
              </p>
            </div>
          ) : filteredHadithList.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-6 h-6" />}
              title="এই বিষয়ে কোনো হাদিস মেলেনি"
              action={
                <button
                  type="button"
                  onClick={() => handleLoadHadiths('সবর ও শোকর', 'all')}
                  className="px-4 py-2 rounded-xl bg-[#d4af37] text-[#0b0b0e] font-bold text-xs"
                >
                  পুনরায় লোড করুন
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHadithList.map((item) => (
                <article
                  key={item.id}
                  className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-xs">
                      <span className="font-semibold text-[#d4af37]">
                        {item.topic || 'সহীহ হাদিস'}
                      </span>
                      <span className="font-semibold text-[#f5f3ee]">{item.ref}</span>
                    </div>

                    {item.narrator && (
                      <p className="text-xs text-[#807a72] mb-2">বর্ণনাকারী: {item.narrator}</p>
                    )}

                    {item.ar && (
                      <p
                        dir="rtl"
                        className="font-arabic text-xl text-[#f2d77d] leading-loose mb-3 text-right"
                      >
                        {item.ar}
                      </p>
                    )}

                    <p className="font-bengali text-[15px] text-[#f5f3ee] leading-relaxed mb-4">
                      “{item.bn}”
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-emerald-400 inline-flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>সহীহ সনদ</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyQuote(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] text-xs font-medium border border-white/[0.08] transition min-h-[38px]"
                      >
                        {copiedId === item.ref ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                        )}
                        <span>{copiedId === item.ref ? 'কপি হয়েছে' : 'পোস্ট কপি'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendToPoster({ ...item, type: 'hadith' })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] text-xs font-bold transition min-h-[38px]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>পোস্টার তৈরি</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
