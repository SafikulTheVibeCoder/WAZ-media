import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { ModalShell } from './ui/ModalShell';
import { EmptyState } from './ui/EmptyState';
import { SavePresetModal } from './SavePresetModal';
import { PresetBrowserModal } from './PresetBrowserModal';
import { renderPoster, generateThumbnail, downloadBlob } from '../utils/canvasRenderer';
import { THEME_PRESETS, ASPECT_RATIOS, INITIAL_QUOTES, CATEGORIES } from '../data/quotes';
import { SURAH_LIST } from '../data/surahList';
import { fetchAyahByNumber, searchQuranByKeyword, AyahResult } from '../services/quranApi';
import { VERIFIED_HADITHS } from '../services/hadithApi';
import { BorderStyle, PatternStyle, ThemeId, BrandPosition } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { generateSeoFilename, generateLocalFacebookPost } from '../utils/seoUtils';
import {
  Download,
  Copy,
  Save,
  Maximize2,
  Minimize2,
  Shuffle,
  Upload,
  Trash2,
  Check,
  Type,
  Layout,
  Palette,
  Image as ImageIcon,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ShieldCheck,
  BookOpen,
  Search,
  Share2,
  Globe,
  RefreshCw,
  Hash,
  FileText,
  Bookmark,
  Layers,
  ChevronRight,
  Crown,
  AlertCircle,
  Plus,
} from 'lucide-react';

export const PosterStudioView: React.FC = () => {
  const {
    poster,
    updatePosterField,
    setPoster,
    brand,
    updateBrandField,
    saveCurrentDesign,
    activeEditingId,
    startNewDesign,
    showToast,
    incrementStat,
    presets,
    activePresetId,
    applyPreset,
    triggerAccessGuard,
    isApproved,
    isSuperAdmin,
    currentUser,
    setIsAccessDeniedModalOpen,
    checkAndConsumePosterQuota,
    currentPlan,
    dailyPosterLimit,
    remainingDailyPosters,
    setIsPricingModalOpen,
  } = useApp();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '100'>('fit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'text' | 'theme' | 'format' | 'bg' | 'decor' | 'brand' | 'seo'
  >('text');
  const [copiedImg, setCopiedImg] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedFbPost, setCopiedFbPost] = useState(false);
  const [copiedFilename, setCopiedFilename] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [isGeneratingAiSeo, setIsGeneratingAiSeo] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showPresetBrowserModal, setShowPresetBrowserModal] = useState(false);

  // Auto-calculated baseline SEO data
  const baseSeo = useMemo(
    () => generateLocalFacebookPost(poster, brand),
    [poster.bn, poster.ar, poster.ref, brand.name, brand.handle]
  );

  const [seoData, setSeoData] = useState(baseSeo);

  // Sync baseline whenever poster text changes (unless user has active AI content)
  useEffect(() => {
    setSeoData((prev) => {
      if (prev.isAiGenerated) return prev;
      return baseSeo;
    });
  }, [baseSeo]);

  // Escape key closes fullscreen preview
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  // Trigger render whenever poster or brand state changes
  useEffect(() => {
    let isSubscribed = true;
    if (canvasRef.current) {
      document.fonts.ready.then(() => {
        if (isSubscribed && canvasRef.current) {
          renderPoster(canvasRef.current, poster, brand);
        }
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [poster, brand]);

  const handleDownload = async (format: 'png' | 'jpeg') => {
    if (!checkAndConsumePosterQuota()) {
      return;
    }
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const ext = format === 'png' ? 'png' : 'jpg';
      const filename = generateSeoFilename(poster, brand, ext);

      canvasRef.current.toBlob(
        (blob) => {
          if (blob) {
            downloadBlob(blob, filename);
            incrementStat('exports');
            showToast(`এসইও ফাইলনেমে (${filename}) সফলভাবে ডাউনলোড হয়েছে`);
          } else {
            showToast('ডাউনলোড করতে সমস্যা হয়েছে');
          }
          setIsExporting(false);
        },
        mime,
        format === 'jpeg' ? 0.95 : undefined
      );
    } catch (e) {
      console.error(e);
      showToast('ডাউনলোড ব্যর্থ হয়েছে');
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!triggerAccessGuard('পোস্টার ছবি কপি')) {
      return;
    }
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiedImg(true);
          setTimeout(() => setCopiedImg(false), 2500);
          showToast('পোস্টার ছবি ক্লিপবোর্ডে কপি করা হয়েছে! সরাসরি পেস্ট করতে পারবেন');
        } catch (err) {
          console.warn('Clipboard image copy not supported', err);
          showToast('ব্রাউজারে সরাসরি ছবি কপি সমর্থিত নয়, দয়া করে ডাউনলোড করুন');
        }
      }, 'image/png');
    } catch {
      showToast('ছবি কপি করা সম্ভব হয়নি');
    }
  };

  const handleCopyCaption = () => {
    const parts: string[] = [];
    if (poster.showAr && poster.ar) parts.push(poster.ar);
    if (poster.bn) parts.push(poster.bn);
    if (poster.ref) parts.push(`— ${poster.ref}`);
    parts.push(`\n#${brand.name.replace(/\s+/g, '')} #IslamicPost #Hadith #Quran`);

    navigator.clipboard.writeText(parts.join('\n\n'));
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
    showToast('ক্যাপশন টেক্সট কপি হয়েছে');
  };

  const handleCopyFullFbPost = () => {
    navigator.clipboard.writeText(seoData.fbCaption);
    setCopiedFbPost(true);
    setTimeout(() => setCopiedFbPost(false), 2500);
    showToast('সম্পূর্ণ এসইও ফেসবুক পোস্ট কপি হয়েছে!');
  };

  const handleCopyFilename = () => {
    const fn = generateSeoFilename(poster, brand, 'png');
    navigator.clipboard.writeText(fn);
    setCopiedFilename(true);
    setTimeout(() => setCopiedFilename(false), 2000);
    showToast('এসইও ইমেজ নাম কপি হয়েছে');
  };

  const handleCopyHashtags = () => {
    navigator.clipboard.writeText(seoData.hashtags.join(' '));
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2000);
    showToast('সকল হ্যাশট্যাগ কপি হয়েছে');
  };

  const handleGenerateAiSeo = async () => {
    setIsGeneratingAiSeo(true);
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bn: poster.bn,
          ar: poster.ar,
          ref: poster.ref,
          brandName: brand.name,
          brandHandle: brand.handle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSeoData({
          seoTitle: data.seoTitle || baseSeo.seoTitle,
          seoFilename: data.seoFilename || baseSeo.seoFilename,
          fbCaption: data.fbCaption || baseSeo.fbCaption,
          hashtags:
            Array.isArray(data.hashtags) && data.hashtags.length > 0
              ? data.hashtags
              : baseSeo.hashtags,
          altText: data.altText || baseSeo.altText,
          isAiGenerated: true,
        });
        showToast(
          data.isAiGenerated
            ? 'AI দিয়ে আকর্ষণীয় ফেসবুক পোস্ট তৈরি হয়েছে!'
            : 'এসইও ফেসবুক পোস্ট আপডেট হয়েছে!'
        );
      } else {
        setSeoData(baseSeo);
        showToast('এসইও পোস্ট প্রস্তুত করা হয়েছে');
      }
    } catch {
      setSeoData(baseSeo);
      showToast('এসইও পোস্ট প্রস্তুত করা হয়েছে');
    } finally {
      setIsGeneratingAiSeo(false);
    }
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const thumb = generateThumbnail(canvasRef.current, 320);
    saveCurrentDesign(thumb);
  };

  const handleRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * INITIAL_QUOTES.length);
    const q = INITIAL_QUOTES[randomIndex];
    setPoster((prev) => ({
      ...prev,
      bn: q.bn,
      ar: q.ar,
      ref: q.ref,
      showAr: Boolean(q.ar),
    }));
    showToast('নতুন বাণী যোগ করা হয়েছে');
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPoster((prev) => ({
          ...prev,
          bgType: 'custom',
          bgDataUrl: dataUrl,
        }));
        showToast('ব্যাকগ্রাউন্ড ছবি যোগ করা হয়েছে');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [showQuotePicker, setShowQuotePicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'curated' | 'quran' | 'hadith' | 'search'>('curated');
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCat, setPickerCat] = useState('সব');

  // Quran Browser inside Picker
  const [pickerSurah, setPickerSurah] = useState<number>(2);
  const [pickerAyah, setPickerAyah] = useState<string>('153');
  const [pickerAyahResult, setPickerAyahResult] = useState<AyahResult | null>(null);
  const [isPickerLoadingAyah, setIsPickerLoadingAyah] = useState(false);

  // Quran Live Search inside Picker
  const [pickerLiveKeyword, setPickerLiveKeyword] = useState('');
  const [pickerSearchResults, setPickerSearchResults] = useState<AyahResult[]>([]);
  const [isPickerSearching, setIsPickerSearching] = useState(false);
  const [pickerHasSearched, setPickerHasSearched] = useState(false);

  const filteredPickerQuotes = INITIAL_QUOTES.filter((q) => {
    if (pickerCat !== 'সব' && !q.cats.includes(pickerCat)) return false;
    if (pickerSearch.trim()) {
      const s = pickerSearch.toLowerCase();
      return (
        q.bn.toLowerCase().includes(s) ||
        q.ar.includes(s) ||
        q.ref.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const selectQuote = (q: (typeof INITIAL_QUOTES)[0]) => {
    setPoster((prev) => ({
      ...prev,
      bn: q.bn,
      ar: q.ar,
      ref: q.ref,
      showAr: Boolean(q.ar),
    }));
    setShowQuotePicker(false);
    showToast('বাণীটি ক্যানভাসে লোড হয়েছে');
  };

  const handlePickerFetchAyah = async () => {
    const ayahNum = parseInt(pickerAyah, 10);
    const surahMeta = SURAH_LIST.find((s) => s.number === pickerSurah);
    if (!ayahNum || ayahNum < 1 || (surahMeta && ayahNum > surahMeta.totalAyahs)) {
      showToast(`আয়াত নম্বর ১ থেকে ${surahMeta?.totalAyahs || 1}-এর মধ্যে হতে হবে`);
      return;
    }
    setIsPickerLoadingAyah(true);
    try {
      const res = await fetchAyahByNumber(pickerSurah, ayahNum);
      if (res) {
        setPickerAyahResult(res);
      } else {
        showToast('আয়াতটি পাওয়া যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।');
      }
    } catch {
      showToast('আয়াত লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsPickerLoadingAyah(false);
    }
  };

  const handlePickerSearchApi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pickerLiveKeyword.trim()) return;
    setIsPickerSearching(true);
    setPickerHasSearched(true);
    try {
      const results = await searchQuranByKeyword(pickerLiveKeyword.trim());
      setPickerSearchResults(results);
    } catch {
      showToast('কুরআন সার্চ করতে সমস্যা হয়েছে');
    } finally {
      setIsPickerSearching(false);
    }
  };

  const selectAyahToCanvas = async (ayah: AyahResult) => {
    let arabic = ayah.arabicText;
    if (!arabic) {
      showToast('আয়াত ও আরবি টেক্সট লোড হচ্ছে...');
      try {
        const full = await fetchAyahByNumber(ayah.surahNumber, ayah.ayahNumber);
        if (full && full.arabicText) {
          arabic = full.arabicText;
        }
      } catch {
        // Fallback without arabic
      }
    }
    setPoster((prev) => ({
      ...prev,
      bn: ayah.bengaliText,
      ar: arabic || '',
      ref: ayah.reference,
      showAr: Boolean(arabic),
    }));
    setShowQuotePicker(false);
    showToast('আয়াতটি ক্যানভাসে লোড হয়েছে');
  };

  const handleRemoveBg = () => {
    setPoster((prev) => ({
      ...prev,
      bgType: 'theme',
      bgDataUrl: null,
    }));
    showToast('ব্যাকগ্রাউন্ড ছবি সরানো হয়েছে');
  };

  const handleThemeSelect = (themeId: ThemeId) => {
    const th = THEME_PRESETS.find((t) => t.id === themeId);
    if (th) {
      setPoster((prev) => ({
        ...prev,
        theme: themeId,
        textColor: th.text,
        accentColor: th.accent,
        arabicColor: th.ar,
      }));
    }
  };

  const inspectorTabs = [
    { id: 'text', label: 'টেক্সট', icon: Type },
    { id: 'theme', label: 'থিম', icon: Palette },
    { id: 'format', label: 'লেআউট', icon: Layout },
    { id: 'bg', label: 'ব্যাকগ্রাউন্ড', icon: ImageIcon },
    { id: 'decor', label: 'সাজসজ্জা', icon: Sparkles },
    { id: 'brand', label: 'ব্র্যান্ডিং', icon: ShieldCheck },
    { id: 'seo', label: 'এসইও', icon: Share2 },
  ] as const;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <Header
        title="পোস্টার স্টুডিও"
        subtitle="কুরআন, সহীহ হাদিস ও ইসলামিক বাণী থেকে হাই-রেজোলিউশন সোশ্যাল মিডিয়া পোস্টার তৈরি করুন।"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuotePicker(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/[0.08] text-xs font-medium transition min-h-[40px] whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>বাণী নির্বাচন</span>
            </button>
            {activeEditingId && (
              <button
                type="button"
                onClick={startNewDesign}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] text-xs font-bold transition min-h-[40px] whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন ডিজাইন</span>
              </button>
            )}
          </div>
        }
      />

      {/* RBAC Pending Approval Banner */}
      {currentUser && !isApproved && (
        <div className="bg-amber-950/35 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-relaxed">
              <strong className="text-amber-100">আপনার একাউন্টটি অনুমোদনের অপেক্ষায় রয়েছে (Pending Approval)।</strong>{' '}
              ডেমো প্রিভিউ দেখা যাবে, তবে এক্সপোর্ট ও সেভ করতে সুপার এডমিনের অনুমোদন প্রয়োজন।
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAccessDeniedModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0b0b0e] font-bold transition shrink-0 min-h-[40px] whitespace-nowrap"
          >
            অনুমোদনের অনুরোধ
          </button>
        </div>
      )}

      {/* Super Admin Status Banner */}
      {isSuperAdmin && (
        <div className="bg-[#141419] border border-[#d4af37]/30 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs text-[#f2d77d]">
          <Crown className="w-4 h-4 text-[#d4af37] shrink-0" />
          <span>
            <strong>সুপার এডমিন মোড সক্রিয়:</strong> সম্পূর্ণ আনলিমিটেড পোস্টার তৈরি, এইচডি এক্সপোর্ট ও ইউজার ম্যানেজমেন্ট চালু আছে।
          </span>
        </div>
      )}

      {/* Editing Existing Design Banner */}
      {activeEditingId && (
        <div className="bg-[#141419] border border-[#d4af37]/35 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#f2d77d]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span>আপনি পূর্বে সংরক্ষিত একটি ডিজাইন সম্পাদনা করছেন</span>
          </div>
          <button
            type="button"
            onClick={startNewDesign}
            className="px-3 py-1.5 rounded-lg bg-[#1b1b22] hover:bg-[#23232c] border border-white/10 text-xs font-medium text-[#f5f3ee] transition min-h-[34px] whitespace-nowrap"
          >
            নতুন ডিজাইন শুরু করুন
          </button>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Canvas Preview Stage */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <div className="w-full bg-[#141419] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
            {/* Stage toolbar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-white/[0.08] text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono tabular-nums text-[#d4af37] font-semibold px-2.5 py-2 rounded-xl bg-[#0e0e12] border border-white/[0.08]">
                  {poster.size.replace('x', ' × ')}
                </span>

                {/* Quick Preset Selector Dropdown */}
                <div className="flex items-center gap-1.5 bg-[#0e0e12] px-3 py-1.5 rounded-xl border border-white/[0.08] min-h-[40px]">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <select
                    value={activePresetId || ''}
                    onChange={(e) => {
                      if (e.target.value === '__browse__') {
                        setShowPresetBrowserModal(true);
                      } else if (e.target.value) {
                        applyPreset(e.target.value);
                      }
                    }}
                    className="bg-transparent text-[#f5f3ee] text-xs font-medium outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
                    title="প্রিসেট স্টাইল পরিবর্তন করুন"
                  >
                    <option value="" disabled className="bg-[#141419] text-[#807a72]">
                      প্রিসেট সিলেক্ট করুন...
                    </option>
                    <optgroup
                      label="সংরক্ষিত ও বিল্ট-ইন প্রিসেট"
                      className="bg-[#141419] text-[#f5f3ee]"
                    >
                      {presets.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#141419] text-[#f5f3ee]">
                          {p.isBuiltIn ? '★ ' : '● '}
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                    <option value="__browse__" className="bg-[#1b1b22] text-[#d4af37] font-bold">
                      প্রিসেট লাইব্রেরি ব্রাউজ করুন...
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPresetBrowserModal(true)}
                  className="px-3 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/[0.08] transition inline-flex items-center gap-1.5 text-xs font-medium min-h-[40px] whitespace-nowrap"
                  title="সকল সংরক্ষিত প্রিসেট ব্রাউজ ও প্রয়োগ করুন"
                >
                  <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="hidden sm:inline">প্রিসেট লাইব্রেরি</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSavePresetModal(true)}
                  className="px-3 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-[#d4af37]/30 transition inline-flex items-center gap-1.5 text-xs font-semibold min-h-[40px] whitespace-nowrap"
                  title="বর্তমান ডিজাইন স্টাইলটি নতুন প্রিসেট হিসেবে সেভ করুন"
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>প্রিসেট সেভ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => (z === 'fit' ? '100' : 'fit'))}
                  className="px-3 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#b6b0a6] hover:text-[#f5f3ee] border border-white/[0.08] transition min-h-[40px] tabular-nums whitespace-nowrap"
                >
                  {zoomLevel === 'fit' ? '১০০%' : 'ফিট'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  aria-label="ফুল স্ক্রিন দেখুন"
                  title="ফুল স্ক্রিন দেখুন"
                  className="w-10 h-10 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#b6b0a6] hover:text-[#f5f3ee] border border-white/[0.08] transition flex items-center justify-center shrink-0"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas viewport container */}
            <div className="w-full flex items-center justify-center p-3 sm:p-5 rounded-xl bg-[#0e0e12] border border-white/[0.06] overflow-auto max-h-[70vh]">
              <div
                className={`transition-all duration-200 overflow-hidden flex items-center justify-center ${
                  zoomLevel === 'fit' ? 'max-w-full max-h-[62vh]' : 'overflow-auto'
                }`}
              >
                <canvas
                  ref={canvasRef}
                  className="block max-w-full h-auto object-contain shadow-2xl"
                  style={{
                    maxHeight: zoomLevel === 'fit' ? '60vh' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Plan Quota Status Bar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-xl bg-[#0e0e12] border border-white/[0.08] text-xs">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <Crown className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span className="text-[#b6b0a6]">
                  প্যাকেজ:{' '}
                  <strong className="text-[#f2d77d]">
                    {currentPlan === 'enterprise'
                      ? 'এন্টারপ্রাইজ'
                      : currentPlan === 'pro'
                      ? 'প্রো ক্রিয়েটর'
                      : 'ফ্রি'}
                  </strong>
                </span>
                <span aria-hidden="true" className="text-[#807a72]">
                  ·
                </span>
                <span className="text-emerald-400 font-semibold tabular-nums">
                  {dailyPosterLimit === -1
                    ? 'আজকের লিমিট: আনলিমিটেড'
                    : `আজকের বাকি: ${toBengaliNumber(remainingDailyPosters)} / ${toBengaliNumber(
                        dailyPosterLimit
                      )} টি`}
                </span>
              </div>

              {currentPlan !== 'enterprise' && (
                <button
                  type="button"
                  onClick={() => setIsPricingModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-[#d4af37]/30 text-xs font-semibold transition inline-flex items-center gap-1.5 shrink-0 min-h-[34px] whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>আপগ্রেড করুন</span>
                </button>
              )}
            </div>

            {/* Quick Export & Save Actions */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownload('png')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition active:scale-[0.98] min-h-[44px] disabled:opacity-60"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="truncate">PNG ডাউনলোড</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownload('jpeg')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] font-medium text-xs border border-white/[0.08] transition min-h-[44px] disabled:opacity-60"
              >
                <Download className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span className="truncate">JPG ডাউনলোড</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] font-medium text-xs border border-white/[0.08] transition min-h-[44px]"
                title="সরাসরি সোশ্যাল মিডিয়ায় পেস্ট করতে"
              >
                {copiedImg ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-[#d4af37] shrink-0" />
                )}
                <span className="truncate">{copiedImg ? 'ছবি কপি!' : 'ছবি কপি'}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] font-semibold text-xs border border-[#d4af37]/30 transition min-h-[44px]"
              >
                <Save className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span className="truncate">
                  {activeEditingId ? 'ডিজাইন আপডেট' : 'ডিজাইন সেভ'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowSavePresetModal(true)}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] font-semibold text-xs border border-white/[0.08] transition min-h-[44px]"
                title="ভবিষ্যতে ব্যবহারের জন্য বর্তমান স্টাইল প্রিসেট হিসেবে সেভ করুন"
              >
                <Bookmark className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span className="truncate">প্রিসেট সেভ</span>
              </button>
            </div>

            {/* SEO Filename & Quick Social Share Footer */}
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between text-xs text-[#807a72] pt-3.5 border-t border-white/[0.08] gap-3">
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <span className="text-[#807a72] shrink-0 text-[11px]">এসইও ফাইল নাম:</span>
                <button
                  type="button"
                  onClick={handleCopyFilename}
                  className="font-mono text-[11px] text-[#f2d77d] bg-[#0e0e12] hover:bg-[#1b1b22] px-2.5 py-1.5 rounded-lg border border-white/[0.08] truncate transition text-left min-h-[34px] inline-flex items-center gap-1.5"
                  title="ক্লিক করে ফাইলনেম কপি করুন"
                >
                  <span className="truncate">{generateSeoFilename(poster, brand, 'png')}</span>
                  {copiedFilename ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyFullFbPost}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/[0.08] transition text-xs font-medium min-h-[36px] whitespace-nowrap"
                  title="সম্পূর্ণ ফেসবুক পোস্ট কপি"
                >
                  {copiedFbPost ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                  )}
                  <span>{copiedFbPost ? 'পোস্ট কপি হয়েছে' : 'ফেসবুক পোস্ট কপি'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('seo')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-[#d4af37]/30 transition text-xs font-semibold min-h-[36px] whitespace-nowrap"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>এসইও সেটিংস</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Controls Panel */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#141419] border border-white/[0.08] rounded-2xl overflow-hidden lg:sticky lg:top-6">
          {/* Scrollable Tabs Navigation */}
          <div className="flex overflow-x-auto no-scrollbar border-b border-white/[0.08] bg-[#101014]">
            {inspectorTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 px-3.5 py-3 text-xs font-medium whitespace-nowrap shrink-0 min-h-[46px] transition border-b-2 ${
                    isActive
                      ? 'text-[#f2d77d] border-[#d4af37] bg-[#141419] font-semibold'
                      : 'text-[#807a72] border-transparent hover:text-[#f5f3ee] hover:bg-[#1b1b22]/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div className="p-5 max-h-[calc(100vh-210px)] overflow-y-auto space-y-5">
            {/* 1. TEXT TAB */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-[#b6b0a6]">
                    বাংলা মূল বক্তব্য / অনুবাদ
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCopyCaption}
                      className="inline-flex items-center gap-1 text-xs text-[#b6b0a6] hover:text-[#f5f3ee]"
                    >
                      {copiedCaption ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCaption ? 'কপি হয়েছে' : 'কপি'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuotePicker(true)}
                      className="inline-flex items-center gap-1 text-xs text-[#f2d77d] hover:underline font-medium"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>লাইব্রেরি</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRandomQuote}
                      className="inline-flex items-center gap-1 text-xs text-[#d4af37] hover:underline font-medium"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>এলোমেলো</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={poster.bn}
                  onChange={(e) => updatePosterField('bn', e.target.value)}
                  placeholder="আপনার কাঙ্ক্ষিত বাণী বা বাংলা অনুবাদ লিখুন..."
                  className="w-full p-3.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-sm text-[#f5f3ee] placeholder:text-[#807a72] focus:border-[#d4af37] focus:outline-none resize-none leading-relaxed"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#b6b0a6]">
                      আরবি টেক্সট (ঐচ্ছিক)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#b6b0a6] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={poster.showAr}
                        onChange={(e) => updatePosterField('showAr', e.target.checked)}
                        className="rounded border-white/20 text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                      />
                      <span>পোস্টারে দেখান</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={poster.ar}
                    onChange={(e) => updatePosterField('ar', e.target.value)}
                    placeholder="আরবি আয়াত বা হাদিসের মূল পাঠ্য..."
                    className="w-full p-3.5 font-arabic text-lg bg-[#0e0e12] border border-white/[0.08] rounded-xl text-[#f2d77d] placeholder:text-[#807a72] focus:border-[#d4af37] focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-[#b6b0a6]">
                      রেফারেন্স / হাদিস বা সূরার নাম
                    </label>
                    <span className="text-[11px] text-[#807a72]">উদাঃ সূরা আল-বাকারা, ২:১৫৩</span>
                  </div>
                  <input
                    type="text"
                    value={poster.ref}
                    onChange={(e) => updatePosterField('ref', e.target.value)}
                    placeholder="যেমন: সূরা আল-বাকারা, আয়াত: ১৫৩ অথবা সহীহ বুখারি, হাদিস: ১"
                    className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-sm text-[#f5f3ee] placeholder:text-[#807a72] focus:border-[#d4af37] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#807a72]">
                    স্পষ্টভাবে আয়াত নম্বর উল্লেখ করলে পাঠকদের বুঝতে কোনো দ্বিধা থাকে না।
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.08]">
                  <label className="flex items-center gap-2.5 text-xs text-[#f5f3ee] cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={poster.showBismillah}
                      onChange={(e) => updatePosterField('showBismillah', e.target.checked)}
                      className="rounded border-white/20 text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                    <span>উপরে “বিসমিল্লাহ” ক্যালিগ্রাফি যুক্ত করুন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 2. THEME TAB */}
            {activeTab === 'theme' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#b6b0a6] block mb-2.5">
                    রঙিন থিম প্যালেট নির্বাচন করুন
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {THEME_PRESETS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleThemeSelect(t.id)}
                        className={`p-3 rounded-xl border text-left transition relative overflow-hidden flex flex-col justify-between h-24 ${
                          poster.theme === t.id
                            ? 'border-[#d4af37] ring-1 ring-[#d4af37]'
                            : 'border-white/[0.08] hover:border-white/25'
                        }`}
                        style={{ background: t.previewBg }}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span
                            className="font-bold text-xs px-2 py-0.5 rounded-md bg-black/50"
                            style={{ color: t.accent }}
                          >
                            {t.name}
                          </span>
                          {poster.theme === t.id && (
                            <span className="w-5 h-5 rounded-md bg-[#d4af37] text-[#0b0b0e] flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span
                          className="text-[11px] opacity-90 truncate font-medium"
                          style={{ color: t.text }}
                        >
                          {t.bgDesc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Tuning */}
                <div className="pt-4 border-t border-white/[0.08] space-y-3">
                  <span className="text-xs font-semibold text-[#b6b0a6] block">
                    রঙ কাস্টমাইজ করুন
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-[11px] text-[#807a72] block mb-1">বাংলা লেখা</span>
                      <div className="flex items-center gap-2 bg-[#0e0e12] p-1.5 rounded-xl border border-white/[0.08]">
                        <input
                          type="color"
                          value={poster.textColor}
                          onChange={(e) => updatePosterField('textColor', e.target.value)}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent shrink-0"
                        />
                        <span className="text-[10px] font-mono text-[#b6b0a6] uppercase truncate">
                          {poster.textColor}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#807a72] block mb-1">বর্ডার/অ্যাকসেন্ট</span>
                      <div className="flex items-center gap-2 bg-[#0e0e12] p-1.5 rounded-xl border border-white/[0.08]">
                        <input
                          type="color"
                          value={poster.accentColor}
                          onChange={(e) => updatePosterField('accentColor', e.target.value)}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent shrink-0"
                        />
                        <span className="text-[10px] font-mono text-[#b6b0a6] uppercase truncate">
                          {poster.accentColor}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#807a72] block mb-1">আরবি টেক্সট</span>
                      <div className="flex items-center gap-2 bg-[#0e0e12] p-1.5 rounded-xl border border-white/[0.08]">
                        <input
                          type="color"
                          value={poster.arabicColor}
                          onChange={(e) => updatePosterField('arabicColor', e.target.value)}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent shrink-0"
                        />
                        <span className="text-[10px] font-mono text-[#b6b0a6] uppercase truncate">
                          {poster.arabicColor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. FORMAT & TYPOGRAPHY TAB */}
            {activeTab === 'format' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#b6b0a6] block mb-2">
                    পোস্টারের সাইজ ও অনুপাত
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {ASPECT_RATIOS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updatePosterField('size', item.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          poster.size === item.id
                            ? 'bg-[#1b1b22] border-[#d4af37] text-[#f2d77d]'
                            : 'bg-[#0e0e12] border-white/[0.08] text-[#b6b0a6] hover:border-white/20'
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center justify-between gap-1">
                          <span>{item.label}</span>
                          <span className="text-[10px] font-mono opacity-80">{item.ratio}</span>
                        </div>
                        <span className="text-[11px] block mt-1 text-[#807a72] leading-tight">
                          {item.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#b6b0a6] block mb-1.5">
                    বাংলা ফন্ট
                  </label>
                  <select
                    value={poster.font}
                    onChange={(e) => updatePosterField('font', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                  >
                    <option value="Noto Sans Bengali">
                      নোটো সান্স বেঙ্গলি (সর্বাধিক স্পষ্ট সংখ্যা ও যুক্তাক্ষর)
                    </option>
                    <option value="Anek Bangla">আনেক বাংলা (Anek Bangla - আধুনিক ও স্পষ্ট)</option>
                    <option value="Noto Serif Bengali">
                      নোটো সেরিফ বেঙ্গলি (Noto Serif - আভিজাত্যময়)
                    </option>
                    <option value="Tiro Bangla">তিরো বাংলা (Tiro Bangla - ঐতিহ্যবাহী)</option>
                    <option value="Hind Siliguri">হিন্দ শিলিগুড়ি (Hind Siliguri - স্ট্যান্ডার্ড)</option>
                  </select>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#b6b0a6]">
                      লেখার সাইজ:{' '}
                      <span className="text-[#f2d77d] tabular-nums font-mono">
                        {toBengaliNumber(poster.fontSize)}px
                      </span>
                    </span>
                    <label className="flex items-center gap-2 text-xs text-[#b6b0a6] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={poster.autoFit}
                        onChange={(e) => updatePosterField('autoFit', e.target.checked)}
                        className="rounded border-white/20 text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                      />
                      <span>অটো-ফিট</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    min="32"
                    max="140"
                    step="2"
                    value={poster.fontSize}
                    onChange={(e) => updatePosterField('fontSize', Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#b6b0a6] block mb-1.5">
                    টেক্সট অ্যালাইনমেন্ট
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#0e0e12] p-1 rounded-xl border border-white/[0.08]">
                    {[
                      { id: 'left', label: 'বামে', icon: AlignLeft },
                      { id: 'center', label: 'মাঝে', icon: AlignCenter },
                      { id: 'right', label: 'ডানে', icon: AlignRight },
                    ].map((al) => {
                      const AlignIcon = al.icon;
                      return (
                        <button
                          key={al.id}
                          type="button"
                          onClick={() => updatePosterField('align', al.id as any)}
                          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition min-h-[38px] ${
                            poster.align === al.id
                              ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                              : 'text-[#807a72] hover:text-[#f5f3ee]'
                          }`}
                        >
                          <AlignIcon className="w-3.5 h-3.5" />
                          <span>{al.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#b6b0a6] block mb-1.5">
                    রেফারেন্সের অবস্থান
                  </span>
                  <select
                    value={poster.refPos}
                    onChange={(e) => updatePosterField('refPos', e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                  >
                    <option value="below">বাণীর ঠিক নিচে (প্রস্তাবিত)</option>
                    <option value="top">বাণীর উপরে</option>
                    <option value="bottom">পোস্টারের একদম নিচে (স্থির)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 4. BACKGROUND TAB */}
            {activeTab === 'bg' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#b6b0a6] block mb-2">
                    কাস্টম ব্যাকগ্রাউন্ড ছবি
                  </label>
                  {poster.bgDataUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-[#d4af37]/40 mb-3">
                      <img
                        src={poster.bgDataUrl}
                        alt="Custom background"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveBg}
                        className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg bg-red-950/90 hover:bg-red-900 text-red-100 border border-red-500/40 text-xs flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছে ফেলুন</span>
                      </button>
                    </div>
                  )}

                  <label className="flex items-center justify-center gap-2 w-full p-4 border border-dashed border-white/20 hover:border-[#d4af37] rounded-xl cursor-pointer bg-[#0e0e12] text-xs font-medium text-[#f2d77d] transition min-h-[52px]">
                    <Upload className="w-4 h-4 text-[#d4af37]" />
                    <span>গ্যালারি বা ডিভাইস থেকে ছবি আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomBgUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {poster.bgDataUrl && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#b6b0a6]">
                      <span>ছবির উপর ডার্ক ওভারলে</span>
                      <span className="font-semibold text-[#f2d77d] tabular-nums">
                        {toBengaliNumber(Math.round(poster.overlay * 100))}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.85"
                      step="0.05"
                      value={poster.overlay}
                      onChange={(e) => updatePosterField('overlay', parseFloat(e.target.value))}
                      className="w-full accent-[#d4af37] cursor-pointer"
                    />
                    <p className="text-[11px] text-[#807a72]">
                      লেখা সহজে পড়তে ছবির ওপর কালো টিন্ট নিয়ন্ত্রণ করুন।
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-[#b6b0a6] block mb-2">
                    ইসলামিক অলঙ্করণ প্যাটার্ন
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'geometric', label: '৮-তারা জ্যামিতিক' },
                      { id: 'arabesque', label: 'আরবেস্ক ফুলকারি' },
                      { id: 'stars', label: 'নক্ষত্র মণ্ডল' },
                      { id: 'subtle', label: 'সূক্ষ্ম গ্রিড' },
                      { id: 'none', label: 'কোনো প্যাটার্ন নয়' },
                    ].map((pat) => (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => updatePosterField('bgPattern', pat.id as PatternStyle)}
                        className={`p-3 rounded-xl border text-xs text-center transition min-h-[42px] ${
                          poster.bgPattern === pat.id
                            ? 'bg-[#1b1b22] border-[#d4af37] text-[#f2d77d] font-semibold'
                            : 'bg-[#0e0e12] border-white/[0.08] text-[#b6b0a6] hover:border-white/20'
                        }`}
                      >
                        {pat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. DECORATION TAB */}
            {activeTab === 'decor' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#b6b0a6] block mb-2">
                    বর্ডার বা ফ্রেমের ধরণ
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'double', label: 'ডাবল গোল্ডেন বর্ডার' },
                      { id: 'simple', label: 'সাধারণ সলিড বর্ডার' },
                      { id: 'ornate', label: 'অলঙ্কৃত ড্যাশড বর্ডার' },
                      { id: 'arch', label: 'মসজিদ মেহরাব খিলান' },
                      { id: 'none', label: 'বর্ডার ছাড়া' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => updatePosterField('borderStyle', b.id as BorderStyle)}
                        className={`p-3 rounded-xl border text-xs text-center transition min-h-[42px] ${
                          poster.borderStyle === b.id
                            ? 'bg-[#1b1b22] border-[#d4af37] text-[#f2d77d] font-semibold'
                            : 'bg-[#0e0e12] border-white/[0.08] text-[#b6b0a6] hover:border-white/20'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] cursor-pointer">
                    <span className="text-xs font-medium text-[#f5f3ee]">
                      চার কোণায় ইসলামিক তারা অলঙ্করণ
                    </span>
                    <input
                      type="checkbox"
                      checked={poster.decorCorner}
                      onChange={(e) => updatePosterField('decorCorner', e.target.checked)}
                      className="rounded border-white/20 text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] cursor-pointer">
                    <span className="text-xs font-medium text-[#f5f3ee]">
                      রেফারেন্সের সামনে অলঙ্কৃত ডিভাইডার
                    </span>
                    <input
                      type="checkbox"
                      checked={poster.decorDivider}
                      onChange={(e) => updatePosterField('decorDivider', e.target.checked)}
                      className="rounded border-white/20 text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 6. BRANDING TAB */}
            {activeTab === 'brand' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#b6b0a6] block mb-1.5">
                    লোগো ও ব্র্যান্ডের অবস্থান
                  </label>
                  <select
                    value={brand.pos}
                    onChange={(e) => updateBrandField('pos', e.target.value as BrandPosition)}
                    className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                  >
                    <option value="top-center">উপরে — মাঝখানে (সুপারিশকৃত)</option>
                    <option value="top-left">উপরে — বাম পাশে</option>
                    <option value="top-right">উপরে — ডান পাশে</option>
                    <option value="bottom-center">নিচে — মাঝখানে</option>
                    <option value="bottom-left">নিচে — বাম পাশে</option>
                    <option value="bottom-right">নিচে — ডান পাশে</option>
                  </select>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-[#b6b0a6] block">
                    পোস্টারে দৃশ্যমান উপাদান
                  </span>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] cursor-pointer">
                    <span className="text-xs text-[#f5f3ee]">ব্র্যান্ড লোগো আইকন</span>
                    <input
                      type="checkbox"
                      checked={brand.showLogo}
                      onChange={(e) => updateBrandField('showLogo', e.target.checked)}
                      className="rounded border-white/20 text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] cursor-pointer gap-3">
                    <span className="text-xs text-[#f5f3ee] truncate">
                      ট্যাগলাইন ({brand.tagline})
                    </span>
                    <input
                      type="checkbox"
                      checked={brand.showTag}
                      onChange={(e) => updateBrandField('showTag', e.target.checked)}
                      className="rounded border-white/20 text-[#d4af37] focus:ring-0 accent-[#d4af37] shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] cursor-pointer gap-3">
                    <span className="text-xs text-[#f5f3ee] truncate">
                      সোশ্যাল হ্যান্ডেল ({brand.handle})
                    </span>
                    <input
                      type="checkbox"
                      checked={brand.showHandle}
                      onChange={(e) => updateBrandField('showHandle', e.target.checked)}
                      className="rounded border-white/20 text-[#d4af37] focus:ring-0 accent-[#d4af37] shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] cursor-pointer">
                    <span className="text-xs text-[#f5f3ee]">ফুটার কপিরাইট ওয়াটারমার্ক</span>
                    <input
                      type="checkbox"
                      checked={brand.watermark}
                      onChange={(e) => updateBrandField('watermark', e.target.checked)}
                      className="rounded border-white/20 text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                  </label>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                  <div className="flex justify-between text-xs text-[#b6b0a6]">
                    <span>লোগোর আকার</span>
                    <span className="font-semibold text-[#f2d77d] tabular-nums font-mono">
                      {toBengaliNumber(brand.logoSize)}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="220"
                    step="5"
                    value={brand.logoSize}
                    onChange={(e) => updateBrandField('logoSize', Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 7. SEO & FACEBOOK POST TAB */}
            {activeTab === 'seo' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#0e0e12] border border-[#d4af37]/30">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      <span className="text-xs font-bold text-[#f2d77d]">
                        ফেসবুক পোস্ট ও এসইও সহকারী
                      </span>
                    </div>
                    {seoData.isAiGenerated && (
                      <span className="text-[11px] text-emerald-400 font-medium">
                        AI অপটিমাইজড
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#b6b0a6] leading-relaxed mb-3.5">
                    ফেসবুক অ্যালগরিদম ও গুগল ইমেজ সার্চের জন্য আকর্ষণীয় হুক, প্রতিফলন, দোয়া ও হ্যাশট্যাগ তৈরি করুন।
                  </p>

                  <button
                    type="button"
                    disabled={isGeneratingAiSeo}
                    onClick={handleGenerateAiSeo}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition min-h-[42px] disabled:opacity-60"
                  >
                    {isGeneratingAiSeo ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>AI পোস্ট তৈরি করছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI দিয়ে ফেসবুক পোস্ট রিফ্রেশ করুন</span>
                      </>
                    )}
                  </button>
                </div>

                {/* SEO Image Filename */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#b6b0a6] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>এসইও ইমেজ ফাইল নাম</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyFilename}
                      className="text-xs text-[#d4af37] hover:underline flex items-center gap-1"
                    >
                      {copiedFilename ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedFilename ? 'কপি হয়েছে' : 'নাম কপি'}</span>
                    </button>
                  </div>
                  <div className="bg-[#0e0e12] p-3 rounded-xl border border-white/[0.08] font-mono text-xs text-[#f2d77d] overflow-x-auto">
                    <span className="truncate block">
                      {generateSeoFilename(poster, brand, 'png')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#807a72]">
                    PNG বা JPG ডাউনলোডে স্বয়ংক্রিয়ভাবে এই এসইও ফাইলনাম যুক্ত হবে।
                  </p>
                </div>

                {/* SEO Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#b6b0a6]">
                      পোস্ট শিরোনাম / হুক
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(seoData.seoTitle);
                        showToast('শিরোনাম কপি হয়েছে');
                      }}
                      className="text-xs text-[#d4af37] hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={seoData.seoTitle}
                    onChange={(e) =>
                      setSeoData((prev) => ({ ...prev, seoTitle: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-xs text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                  />
                </div>

                {/* Full Facebook Post */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#b6b0a6] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>সম্পূর্ণ ফেসবুক পোস্ট (ক্যাপশন)</span>
                    </label>
                    <span className="text-[11px] text-[#807a72]">রেডি-টু-পোস্ট</span>
                  </div>
                  <textarea
                    rows={7}
                    value={seoData.fbCaption}
                    onChange={(e) =>
                      setSeoData((prev) => ({ ...prev, fbCaption: e.target.value }))
                    }
                    className="w-full p-3.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-xs text-[#f5f3ee] focus:border-[#d4af37] outline-none leading-relaxed resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyFullFbPost}
                    className="w-full py-2.5 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] font-semibold text-xs border border-white/[0.08] transition flex items-center justify-center gap-2 min-h-[42px]"
                  >
                    {copiedFbPost ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#d4af37]" />
                    )}
                    <span>
                      {copiedFbPost ? 'সম্পূর্ণ ফেসবুক পোস্ট কপি হয়েছে!' : 'সম্পূর্ণ ফেসবুক পোস্ট কপি করুন'}
                    </span>
                  </button>
                </div>

                {/* Hashtags */}
                <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#b6b0a6] flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span className="tabular-nums">
                        হ্যাশট্যাগ ({toBengaliNumber(seoData.hashtags.length)}টি)
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyHashtags}
                      className="text-xs text-[#d4af37] hover:underline flex items-center gap-1"
                    >
                      {copiedHashtags ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedHashtags ? 'কপি হয়েছে' : 'সবগুলো কপি'}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {seoData.hashtags.map((tag, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(tag);
                          showToast(`${tag} কপি হয়েছে`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#0e0e12] border border-white/[0.08] hover:border-[#d4af37]/40 text-[11px] text-[#d4af37] font-mono transition"
                        title="ক্লিক করে কপি করুন"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alt Text */}
                <div className="space-y-1.5 pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#b6b0a6]">
                      ইমেজ অল্ট টেক্সট (Alt Text)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(seoData.altText);
                        showToast('অল্ট টেক্সট কপি হয়েছে');
                      }}
                      className="text-xs text-[#d4af37] hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={seoData.altText}
                    className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-xs text-[#b6b0a6] outline-none"
                  />
                  <p className="text-[11px] text-[#807a72]">
                    ফেসবুকে ছবি আপলোডের সময় ‘Edit Alt Text’ অপশনে এটি ব্যবহার করুন।
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Lightbox (Escape key & backdrop click dismissible) */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="পোস্টার ফুলস্ক্রিন প্রিভিউ"
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
        >
          <div
            className="absolute top-4 right-4 flex items-center gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleDownload('png')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs min-h-[40px]"
            >
              <Download className="w-4 h-4" />
              <span>ডাউনলোড</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              aria-label="বন্ধ করুন"
              title="বন্ধ করুন (Esc)"
              className="w-10 h-10 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] border border-white/15 text-[#f5f3ee] flex items-center justify-center transition"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[85vh] flex items-center justify-center overflow-auto"
          >
            <img
              src={canvasRef.current?.toDataURL('image/png') || ''}
              alt="Fullscreen Preview"
              className="max-h-[84vh] w-auto rounded-xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}

      {/* Quote Picker Modal */}
      <ModalShell
        isOpen={showQuotePicker}
        onClose={() => setShowQuotePicker(false)}
        title="বাণী ও কুরআন এপিআই লাইব্রেরি"
        subtitle="১১৪টি সূরা · ৬,২৩৬টি আয়াত · সহীহ হাদিস ও নির্বাচিত বাণী"
        icon={<BookOpen className="w-5 h-5" />}
        maxWidthClass="max-w-2xl"
      >
        <div className="flex flex-col h-full">
          {/* Modal Tabs */}
          <div className="flex overflow-x-auto no-scrollbar border-b border-white/[0.08] bg-[#101014] px-3 gap-1 text-xs shrink-0">
            {[
              {
                id: 'curated',
                label: `নির্বাচিত বাণী (${toBengaliNumber(INITIAL_QUOTES.length)})`,
                icon: Bookmark,
              },
              { id: 'quran', label: 'সমগ্র কুরআন (১১৪ সূরা)', icon: Globe },
              { id: 'hadith', label: 'সহীহ হাদিস', icon: Layers },
              { id: 'search', label: 'কুরআন লাইভ সার্চ', icon: Search },
            ].map((t) => {
              const TabIcon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPickerTab(t.id as any)}
                  className={`px-3.5 py-3 font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[44px] ${
                    pickerTab === t.id
                      ? 'border-[#d4af37] text-[#f2d77d] font-semibold'
                      : 'border-transparent text-[#807a72] hover:text-[#f5f3ee]'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Curated Quotes */}
          {pickerTab === 'curated' && (
            <div className="flex flex-col flex-1">
              <div className="p-4 border-b border-white/[0.08] space-y-3 bg-[#101014]">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#807a72]" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="আয়াত, হাদিস বা বিষয় খুঁজুন..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-xs text-[#f5f3ee] placeholder:text-[#807a72] focus:border-[#d4af37] outline-none"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPickerCat(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition min-h-[34px] shrink-0 ${
                        pickerCat === cat
                          ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                          : 'bg-[#1b1b22] text-[#b6b0a6] hover:text-[#f5f3ee]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">
                {filteredPickerQuotes.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => selectQuote(q)}
                    className="w-full text-left p-4 rounded-xl bg-[#0e0e12] hover:bg-[#1b1b22] border border-white/[0.08] hover:border-[#d4af37]/50 transition"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] mb-1.5">
                      <span className="font-semibold text-[#d4af37]">
                        {q.type === 'quran'
                          ? 'কুরআনুল কারীম'
                          : q.type === 'hadith'
                          ? 'সহীহ হাদিস'
                          : 'ইসলামিক উক্তি'}
                      </span>
                      <span className="text-[#807a72] truncate">{q.ref}</span>
                    </div>
                    {q.ar && (
                      <p dir="rtl" className="font-arabic text-base text-[#f2d77d] mb-1 line-clamp-1">
                        {q.ar}
                      </p>
                    )}
                    <p className="font-bengali text-xs text-[#f5f3ee] line-clamp-2 leading-relaxed">
                      {q.bn}
                    </p>
                  </button>
                ))}
                {filteredPickerQuotes.length === 0 && (
                  <EmptyState
                    icon={<Search className="w-5 h-5" />}
                    title="কোনো বাণী পাওয়া যায়নি"
                    description="অনুসন্ধানের শব্দ বা ক্যাটাগরি পরিবর্তন করে আবার চেষ্টা করুন।"
                    className="py-8"
                  />
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Full Quran (114 Surahs API) */}
          {pickerTab === 'quran' && (
            <div className="p-4 sm:p-5 space-y-4 max-h-[64vh] overflow-y-auto">
              <div className="p-4 bg-[#0e0e12] border border-white/[0.08] rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-[#b6b0a6] mb-1">
                      সূরা নির্বাচন করুন (১-১১৪):
                    </label>
                    <select
                      value={pickerSurah}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        setPickerSurah(num);
                        setPickerAyah('1');
                      }}
                      className="w-full px-3 py-2.5 bg-[#141419] border border-white/[0.08] rounded-xl text-xs text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                    >
                      {SURAH_LIST.map((s) => (
                        <option key={s.number} value={s.number}>
                          {toBengaliNumber(s.number)}. সূরা {s.banglaName} ({s.englishName}) -{' '}
                          {toBengaliNumber(s.totalAyahs)} আয়াত
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#b6b0a6] mb-1 tabular-nums">
                      আয়াত (সর্বোচ্চ{' '}
                      {toBengaliNumber(
                        SURAH_LIST.find((s) => s.number === pickerSurah)?.totalAyahs || 1
                      )}
                      ):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={SURAH_LIST.find((s) => s.number === pickerSurah)?.totalAyahs || 1}
                        value={pickerAyah}
                        onChange={(e) => setPickerAyah(e.target.value)}
                        className="w-full px-3 py-2 bg-[#141419] border border-white/[0.08] rounded-xl text-xs text-[#f5f3ee] text-center tabular-nums focus:border-[#d4af37] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handlePickerFetchAyah}
                        disabled={isPickerLoadingAyah}
                        className="px-3.5 py-2 bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs rounded-xl transition disabled:opacity-50 shrink-0 min-h-[38px]"
                      >
                        {isPickerLoadingAyah ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'লোড'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/[0.08]">
                  <span className="text-[11px] text-[#807a72] block mb-2">জনপ্রিয় আয়াতসমূহ:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'ধৈর্য ও সালাত (২:১৫৩)', surah: 2, ayah: 153 },
                      { label: 'আয়াতুল কুরসি (২:২৫৫)', surah: 2, ayah: 255 },
                      { label: 'কষ্টের সাথে স্বস্তি (৯৪:৫)', surah: 94, ayah: 5 },
                      { label: 'নিশ্চয়ই স্বস্তি (৯৪:৬)', surah: 94, ayah: 6 },
                      { label: 'হতাশ হয়ো না (৩৯:৫৩)', surah: 39, ayah: 53 },
                      { label: 'সূরা ইখলাস (১১২:১)', surah: 112, ayah: 1 },
                      { label: 'সূরা ফালাক (১১৩:১)', surah: 113, ayah: 1 },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={async () => {
                          setPickerSurah(item.surah);
                          setPickerAyah(String(item.ayah));
                          setIsPickerLoadingAyah(true);
                          try {
                            const res = await fetchAyahByNumber(item.surah, item.ayah);
                            if (res) setPickerAyahResult(res);
                          } finally {
                            setIsPickerLoadingAyah(false);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#141419] hover:bg-[#1b1b22] border border-white/[0.08] hover:border-[#d4af37]/50 text-[11px] text-[#b6b0a6] hover:text-[#f2d77d] transition"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {pickerAyahResult ? (
                <div className="p-4 bg-[#0e0e12] border border-[#d4af37]/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#d4af37]">
                      {pickerAyahResult.reference}
                    </span>
                    <span className="text-[#807a72]">{pickerAyahResult.surahNameAr}</span>
                  </div>

                  <p dir="rtl" className="font-arabic text-lg text-[#f2d77d] leading-relaxed text-right">
                    {pickerAyahResult.arabicText}
                  </p>

                  <p className="font-bengali text-sm text-[#f5f3ee] leading-relaxed">
                    “{pickerAyahResult.bengaliText}”
                  </p>

                  <button
                    type="button"
                    onClick={() => selectAyahToCanvas(pickerAyahResult)}
                    className="w-full py-2.5 bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 min-h-[42px]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>এই আয়াতটি পোস্টার ক্যানভাসে যুক্ত করুন</span>
                  </button>
                </div>
              ) : (
                <EmptyState
                  icon={<BookOpen className="w-5 h-5" />}
                  title="সূরা ও আয়াত নম্বর নির্বাচন করুন"
                  description='উপরের ড্রপডাউন থেকে সূরা এবং আয়াত নম্বর দিয়ে "লোড" বাটনে ক্লিক করুন।'
                  className="py-8"
                />
              )}
            </div>
          )}

          {/* Tab 3: Authentic Hadiths */}
          {pickerTab === 'hadith' && (
            <div className="p-4 sm:p-5 space-y-3 max-h-[64vh] overflow-y-auto">
              <p className="text-xs text-[#807a72]">
                সহীহ বুখারি, সহীহ মুসলিম, জামে আত-তিরমিযী থেকে সংকলিত:
              </p>
              <div className="space-y-2.5">
                {VERIFIED_HADITHS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setPoster((prev) => ({
                        ...prev,
                        bn: h.bn,
                        ar: h.ar,
                        ref: h.ref,
                        showAr: Boolean(h.ar),
                      }));
                      setShowQuotePicker(false);
                      showToast('হাদিসটি ক্যানভাসে লোড হয়েছে');
                    }}
                    className="w-full text-left p-4 rounded-xl bg-[#0e0e12] hover:bg-[#1b1b22] border border-white/[0.08] hover:border-[#d4af37]/50 transition"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] mb-1.5">
                      <span className="font-semibold text-[#d4af37]">{h.topic}</span>
                      <span className="text-[#807a72] truncate">{h.ref}</span>
                    </div>
                    {h.ar && (
                      <p dir="rtl" className="font-arabic text-base text-[#f2d77d] mb-1 line-clamp-1">
                        {h.ar}
                      </p>
                    )}
                    <p className="font-bengali text-xs text-[#f5f3ee] line-clamp-2 leading-relaxed">
                      {h.bn}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Quran Live Search API */}
          {pickerTab === 'search' && (
            <div className="p-4 sm:p-5 space-y-4 max-h-[64vh] overflow-y-auto">
              <form onSubmit={handlePickerSearchApi} className="space-y-2.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#807a72]" />
                    <input
                      type="text"
                      value={pickerLiveKeyword}
                      onChange={(e) => setPickerLiveKeyword(e.target.value)}
                      placeholder="বাংলা শব্দ লিখে খুঁজুন (উদাঃ ধৈর্য, সালাত, ক্ষমা, রিজিক)..."
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-xs text-[#f5f3ee] placeholder:text-[#807a72] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPickerSearching || !pickerLiveKeyword.trim()}
                    className="px-4 py-2.5 bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs rounded-xl transition disabled:opacity-50 shrink-0 min-h-[40px]"
                  >
                    {isPickerSearching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>খুঁজুন</span>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[#807a72] text-[11px]">দ্রুত সার্চ:</span>
                  {['ধৈর্য', 'সালাত', 'ক্ষমা', 'রিজিক', 'জান্নাত', 'মা-বাবা', 'ইনসাফ', 'তওবা'].map(
                    (word) => (
                      <button
                        key={word}
                        type="button"
                        onClick={async () => {
                          setPickerLiveKeyword(word);
                          setIsPickerSearching(true);
                          setPickerHasSearched(true);
                          try {
                            const res = await searchQuranByKeyword(word);
                            setPickerSearchResults(res);
                          } finally {
                            setIsPickerSearching(false);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#0e0e12] hover:bg-[#1b1b22] text-[#b6b0a6] hover:text-[#f2d77d] border border-white/[0.08] text-[11px] transition"
                      >
                        {word}
                      </button>
                    )
                  )}
                </div>
              </form>

              {isPickerSearching ? (
                <div className="text-center py-8 text-xs text-[#d4af37] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>৬,২৩৬টি আয়াত থেকে অনুসন্ধান করা হচ্ছে...</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pickerHasSearched && (
                    <p className="text-xs text-[#807a72] tabular-nums">
                      {pickerSearchResults.length > 0
                        ? `${toBengaliNumber(pickerSearchResults.length)}টি আয়াত পাওয়া গেছে:`
                        : 'কোনো আয়াত পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।'}
                    </p>
                  )}

                  {pickerSearchResults.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] hover:border-[#d4af37]/50 transition space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#d4af37]">
                          {m.reference}
                        </span>
                        <button
                          type="button"
                          onClick={() => selectAyahToCanvas(m)}
                          className="px-3 py-1.5 bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs rounded-lg transition inline-flex items-center gap-1 min-h-[34px]"
                        >
                          <span>পোস্টারে নিন</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-bengali text-xs text-[#f5f3ee] leading-relaxed">
                        {m.bengaliText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ModalShell>

      {/* Save Preset Modal */}
      <SavePresetModal
        isOpen={showSavePresetModal}
        onClose={() => setShowSavePresetModal(false)}
      />

      {/* Preset Browser Modal */}
      <PresetBrowserModal
        isOpen={showPresetBrowserModal}
        onClose={() => setShowPresetBrowserModal(false)}
        onOpenSaveModal={() => setShowSavePresetModal(true)}
      />
    </div>
  );
};
