import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { renderPoster, generateThumbnail, downloadBlob } from '../utils/canvasRenderer';
import { THEME_PRESETS, ASPECT_RATIOS, INITIAL_QUOTES, CATEGORIES } from '../data/quotes';
import { SURAH_LIST } from '../data/surahList';
import { fetchAyahByNumber, searchQuranByKeyword, AyahResult } from '../services/quranApi';
import { VERIFIED_HADITHS } from '../services/hadithApi';
import { AspectRatio, BorderStyle, PatternStyle, ThemeId, BrandPosition } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { generateSeoFilename, generateLocalFacebookPost } from '../utils/seoUtils';
import {
  Download,
  Copy,
  Save,
  RotateCcw,
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
  HelpCircle,
  ExternalLink,
  BookOpen,
  Search,
  X,
  Share2,
  Globe,
  RefreshCw,
  Hash,
  FileText,
  CheckCheck,
  Bookmark,
  Layers,
  Wand2,
  ChevronRight,
  Crown,
} from 'lucide-react';

import { SavePresetModal } from './SavePresetModal';
import { PresetBrowserModal } from './PresetBrowserModal';

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
  const [activeTab, setActiveTab] = useState<'text' | 'theme' | 'format' | 'bg' | 'decor' | 'brand' | 'seo'>('text');
  const [copiedImg, setCopiedImg] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedFbPost, setCopiedFbPost] = useState(false);
  const [copiedFilename, setCopiedFilename] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [isGeneratingAiSeo, setIsGeneratingAiSeo] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showPresetBrowserModal, setShowPresetBrowserModal] = useState(false);

  // Auto-calculated baseline SEO data
  const baseSeo = useMemo(() => generateLocalFacebookPost(poster, brand), [
    poster.bn,
    poster.ar,
    poster.ref,
    brand.name,
    brand.handle,
  ]);

  const [seoData, setSeoData] = useState(baseSeo);

  // Sync baseline whenever poster text changes (unless user has active AI content)
  useEffect(() => {
    setSeoData((prev) => {
      if (prev.isAiGenerated) return prev;
      return baseSeo;
    });
  }, [baseSeo]);

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
      
      // Fully SEO-friendly filename every time
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
            new ClipboardItem({ 'image/png': blob })
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
          hashtags: Array.isArray(data.hashtags) && data.hashtags.length > 0 ? data.hashtags : baseSeo.hashtags,
          altText: data.altText || baseSeo.altText,
          isAiGenerated: true,
        });
        showToast(data.isAiGenerated ? '✨ AI দিয়ে আকর্ষণীয় ফেসবুক পোস্ট তৈরি হয়েছে!' : 'এসইও ফেসবুক পোস্ট আপডেট হয়েছে!');
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* RBAC Pending Approval Banner */}
      {currentUser && !isApproved && (
        <div className="bg-amber-950/70 border border-amber-800/80 rounded-2xl p-3.5 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span>
              <strong>আপনার একাউন্টটি অনুমোদনের অপেক্ষায় রয়েছে (Pending Approval)।</strong> ডেমো প্রিভিউ দেখা যাবে, তবে এক্সপোর্ট ও সেভ করতে সুপার এডমিনের অনুমোদন প্রয়োজন।
            </span>
          </div>
          <button
            onClick={() => setIsAccessDeniedModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition shrink-0"
          >
            অনুমোদনের অনুরোধ পাঠান
          </button>
        </div>
      )}

      {/* Super Admin Status Banner */}
      {isSuperAdmin && (
        <div className="bg-[#241a12] border border-[#d4af37]/40 rounded-2xl px-4 py-2 flex items-center justify-between text-xs text-[#f7df94] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm">👑</span>
            <span>
              <strong>সুপার এডমিন মোড সক্রিয়:</strong> আপনার জন্য সম্পূর্ণ আনলিমিটেড পোস্টার তৈরি, এক্সপোর্ট ও ইউজার ম্যানেজমেন্ট এক্সেস চালু আছে।
            </span>
          </div>
        </div>
      )}

      {/* Top Banner if in editing mode */}
      {activeEditingId && (
        <div className="bg-[#241a12] border border-[#d4af37]/50 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-[#f7df94]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
            <span>আপনি পূর্বে সংরক্ষিত একটি ডিজাইন সম্পাদনা করছেন</span>
          </div>
          <button
            onClick={startNewDesign}
            className="text-xs bg-[#17110c] hover:bg-[#2b1f16] px-3 py-1 rounded-lg border border-[#44301d] transition"
          >
            নতুন ডিজাইন শুরু করুন
          </button>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Canvas Preview Stage */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center">
          <div className="w-full bg-[#17110c] border border-[#2d2117] rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col items-center">
            
            {/* Stage toolbar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-[#2d2117] text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded bg-[#241a12] text-[#d4af37] font-semibold border border-[#3f2f1d]">
                  {poster.size.replace('x', ' × ')}
                </span>

                {/* Quick Preset Selector Dropdown */}
                <div className="flex items-center gap-1.5 bg-[#20160f] px-2.5 py-1 rounded-lg border border-[#382617]">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <select
                    value={activePresetId || ''}
                    onChange={(e) => {
                      if (e.target.value === '__browse__') {
                        setShowPresetBrowserModal(true);
                      } else if (e.target.value) {
                        applyPreset(e.target.value);
                      }
                    }}
                    className="bg-transparent text-[#f7df94] text-xs font-medium outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
                    title="প্রিসেট স্টাইল পরিবর্তন করুন (Auto-Apply)"
                  >
                    <option value="" disabled className="bg-[#17110c] text-[#877461]">প্রিসেট সিলেক্ট করুন...</option>
                    <optgroup label="সংরক্ষিত ও বিল্ট-ইন প্রিসেট" className="bg-[#17110c] text-[#f4eee2]">
                      {presets.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#17110c] text-[#f4eee2]">
                          {p.isBuiltIn ? '★ ' : '● '}{p.name}
                        </option>
                      ))}
                    </optgroup>
                    <option value="__browse__" className="bg-[#241a12] text-[#d4af37] font-bold">
                      🔍 প্রিসেট লাইব্রেরি ব্রাউজ করুন...
                    </option>
                  </select>
                </div>

                <button
                  onClick={() => setShowPresetBrowserModal(true)}
                  className="px-2.5 py-1 rounded bg-[#241a12] hover:bg-[#322318] text-[#f7df94] border border-[#382a1d] transition flex items-center gap-1 text-[11px]"
                  title="সকল সংরক্ষিত প্রিসেট ব্রাউজ ও প্রয়োগ করুন"
                >
                  <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="hidden sm:inline">প্রিসেট লাইব্রেরি</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSavePresetModal(true)}
                  className="px-2.5 py-1 rounded bg-[#2a1d13] hover:bg-[#382618] text-[#f7df94] border border-[#d4af37]/40 transition flex items-center gap-1 text-[11px] font-semibold"
                  title="বর্তমান ডিজাইন স্টাইলটি নতুন প্রিসেট হিসেবে সেভ করুন"
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>প্রিসেট সেভ</span>
                </button>

                <button
                  onClick={() => setZoomLevel((z) => (z === 'fit' ? '100' : 'fit'))}
                  className="px-2.5 py-1 rounded bg-[#241a12] hover:bg-[#322318] text-[#a9947c] border border-[#382a1d] transition"
                >
                  {zoomLevel === 'fit' ? '১০০%' : 'ফিট'}
                </button>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 rounded bg-[#241a12] hover:bg-[#322318] text-[#a9947c] border border-[#382a1d] transition"
                  title="ফুল স্ক্রিন দেখুন"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas viewport container */}
            <div className="w-full flex items-center justify-center p-3 sm:p-5 rounded-xl bg-[#0d0907] border border-[#231811] overflow-auto max-h-[72vh]">
              <div
                className={`transition-all duration-200 shadow-2xl rounded-sm overflow-hidden flex items-center justify-center ${
                  zoomLevel === 'fit' ? 'max-w-full max-h-[64vh]' : 'overflow-auto'
                }`}
              >
                <canvas
                  ref={canvasRef}
                  className="block max-w-full h-auto object-contain shadow-2xl"
                  style={{
                    maxHeight: zoomLevel === 'fit' ? '62vh' : 'none',
                    filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))',
                  }}
                />
              </div>
            </div>

            {/* Plan Quota Status Banner */}
            <div className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1c140d] via-[#16100a] to-[#1c140d] border border-[#3b2a1a] text-xs">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#d4af37]" />
                <span className="text-[#baa791]">
                  প্যাকেজ: <strong className="text-[#f7df94]">{currentPlan === 'enterprise' ? 'এন্টারপ্রাইজ' : currentPlan === 'pro' ? 'প্রো ক্রিয়েটর' : 'ফ্রি'}</strong>
                </span>
                <span className="text-[#6d5b4a]">•</span>
                <span className="text-emerald-400 font-semibold">
                  {dailyPosterLimit === -1
                    ? 'আজকের লিমিট: আনলিমিটেড'
                    : `আজকের বাকি: ${toBengaliNumber(remainingDailyPosters)} / ${toBengaliNumber(dailyPosterLimit)} টি`}
                </span>
              </div>

              {currentPlan !== 'enterprise' && (
                <button
                  onClick={() => setIsPricingModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#2a1d13] hover:bg-[#382619] text-[#f7df94] border border-[#d4af37]/40 text-[11px] font-bold transition flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-[#d4af37]" />
                  <span>আপগ্রেড করুন</span>
                </button>
              )}
            </div>

            {/* Quick Export & Preset Actions Bar below Canvas */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">

              <button
                disabled={isExporting}
                onClick={() => handleDownload('png')}
                className="flex items-center justify-center gap-2 py-3 px-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow-md transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="truncate">PNG ডাউনলোড</span>
              </button>

              <button
                disabled={isExporting}
                onClick={() => handleDownload('jpeg')}
                className="flex items-center justify-center gap-2 py-3 px-2 rounded-xl bg-[#241a12] hover:bg-[#322419] text-[#f7df94] font-medium text-xs border border-[#44301d] transition"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="truncate">JPG ডাউনলোড</span>
              </button>

              <button
                onClick={handleCopyImage}
                className="flex items-center justify-center gap-2 py-3 px-2 rounded-xl bg-[#241a12] hover:bg-[#322419] text-[#e0d2bf] font-medium text-xs border border-[#382a1d] transition"
                title="সরাসরি সোশ্যাল মিডিয়ায় পেস্ট করতে"
              >
                {copiedImg ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-[#d4af37] shrink-0" />}
                <span className="truncate">{copiedImg ? 'ছবি কপি!' : 'ছবি কপি'}</span>
              </button>

              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 py-3 px-2 rounded-xl bg-[#2d1f14] hover:bg-[#3d2a1c] text-[#f7df94] font-semibold text-xs border border-[#523a23] transition shadow"
              >
                <Save className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span className="truncate">{activeEditingId ? 'ডিজাইন আপডেট' : 'ডিজাইন সেভ'}</span>
              </button>

              <button
                onClick={() => setShowSavePresetModal(true)}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl bg-gradient-to-r from-[#2a1d13] to-[#1f150e] hover:from-[#3a281a] hover:to-[#2c1d13] text-[#f7df94] font-bold text-xs border border-[#d4af37]/40 transition shadow"
                title="ভবিষ্যতে ব্যবহারের জন্য বর্তমান স্টাইল প্রিসেট হিসেবে সেভ করুন"
              >
                <Bookmark className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span className="truncate">প্রিসেট সেভ</span>
              </button>
            </div>

            <div className="w-full flex flex-col sm:flex-row items-center justify-between text-xs text-[#877461] mt-4 pt-3 border-t border-[#231a12] gap-2.5">
              <div className="flex items-center gap-1.5 overflow-hidden max-w-full">
                <span className="text-[#877461] shrink-0 text-[11px]">এসইও ফাইল নাম:</span>
                <span 
                  onClick={handleCopyFilename}
                  className="font-mono text-[10px] sm:text-[11px] text-[#f7df94] bg-[#241a12] hover:bg-[#322318] px-2 py-0.5 rounded border border-[#3f2f1d] cursor-pointer truncate transition"
                  title="ক্লিক করে ফাইলনেম কপি করুন"
                >
                  {generateSeoFilename(poster, brand, 'png')}
                </span>
                <button
                  onClick={handleCopyFilename}
                  className="p-1 rounded hover:bg-[#241a12] text-[#d4af37]"
                  title="ফাইল নাম কপি"
                >
                  {copiedFilename ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyFullFbPost}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#241a12] hover:bg-[#322419] text-[#f7df94] border border-[#3f2f1d] transition text-[11px] font-medium"
                  title="সম্পূর্ণ ফেসবুক পোস্ট কপি"
                >
                  {copiedFbPost ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#d4af37]" />}
                  <span>{copiedFbPost ? 'পোস্ট কপি হয়েছে!' : 'ফেসবুক পোস্ট কপি'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('seo')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#271d15] hover:bg-[#382a1c] text-[#d4af37] border border-[#d4af37]/40 transition text-[11px] font-semibold"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>এসইও সেটিংস</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Controls Panel */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#17110c] border border-[#2d2117] rounded-2xl shadow-xl overflow-hidden sticky top-4">
          
          {/* Tabs navigation */}
          <div className="grid grid-cols-4 sm:grid-cols-7 border-b border-[#2d2117] bg-[#140e0a]">
            {[
              { id: 'text', label: 'টেক্সট', icon: Type },
              { id: 'theme', label: 'থিম', icon: Palette },
              { id: 'format', label: 'লেআউট', icon: Layout },
              { id: 'bg', label: 'ব্যাকগ্রাউন্ড', icon: ImageIcon },
              { id: 'decor', label: 'সাজসজ্জা', icon: Sparkles },
              { id: 'brand', label: 'ব্র্যান্ডিং', icon: ShieldCheck },
              { id: 'seo', label: 'এসইও পোস্ট', icon: Share2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center py-2.5 text-[10px] font-medium transition ${
                    isActive
                      ? 'text-[#f7df94] border-b-2 border-[#d4af37] bg-[#1c140d]'
                      : 'text-[#877461] hover:text-[#d3c2ad] hover:bg-[#1a120b]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mb-1" />
                  <span className="truncate max-w-[50px]">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div className="p-5 max-h-[calc(100vh-220px)] overflow-y-auto space-y-5">
            
            {/* 1. TEXT TAB */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#baa791]">বাংলা মূল বক্তব্য / অনুবাদ</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowQuotePicker(true)}
                      className="flex items-center gap-1 text-[11px] text-[#f7df94] hover:underline"
                    >
                      <BookOpen className="w-3 h-3" />
                      লাইব্রেরি
                    </button>
                    <button
                      onClick={handleRandomQuote}
                      className="flex items-center gap-1 text-[11px] text-[#d4af37] hover:underline"
                    >
                      <Shuffle className="w-3 h-3" />
                      এলোমেলো
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={poster.bn}
                  onChange={(e) => updatePosterField('bn', e.target.value)}
                  placeholder="আপনার কাঙ্ক্ষিত বাণী বা বাংলা অনুবাদ লিখুন..."
                  className="w-full p-3 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] focus:outline-none resize-none leading-relaxed"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#baa791]">আরবি টেক্সট (ঐচ্ছিক)</label>
                    <label className="flex items-center gap-1.5 text-xs text-[#a9947c] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={poster.showAr}
                        onChange={(e) => updatePosterField('showAr', e.target.checked)}
                        className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
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
                    className="w-full p-3 font-arabic text-lg bg-[#120e0a] border border-[#2d2117] rounded-xl text-[#f7df94] focus:border-[#d4af37] focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#baa791]">রেফারেন্স / হাদিস বা সূরার নাম</label>
                    <span className="text-[10px] text-[#c49b3a]">যেমন: সূরা আল-বাকারা, আয়াত: ১৫৩</span>
                  </div>
                  <input
                    type="text"
                    value={poster.ref}
                    onChange={(e) => updatePosterField('ref', e.target.value)}
                    placeholder="যেমন: সূরা আল-বাকারা, আয়াত: ১৫৩ অথবা সহীহ বুখারি, হাদিস: ১"
                    className="w-full px-3.5 py-2.5 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#7a6a58]">
                    স্পষ্টভাবে আয়াত নম্বর উল্লেখ করলে পাঠকদের বুঝতে কোনো দ্বিধা থাকে না।
                  </p>
                </div>

                <div className="pt-2 border-t border-[#231a12] flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-[#baa791] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={poster.showBismillah}
                      onChange={(e) => updatePosterField('showBismillah', e.target.checked)}
                      className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                    <span>উপরে "বিসমিল্লাহ" ক্যালিগ্রাফি যুক্ত করুন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 2. THEME TAB */}
            {activeTab === 'theme' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#baa791] block mb-2.5">
                    রঙিন থিম প্যালেট নির্বাচন করুন
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {THEME_PRESETS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeSelect(t.id)}
                        className={`p-3 rounded-xl border text-left transition relative overflow-hidden flex flex-col justify-between h-24 ${
                          poster.theme === t.id
                            ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40 shadow-md'
                            : 'border-[#2d2117] hover:border-[#4d361c] bg-[#140e0a]'
                        }`}
                        style={{
                          background: t.previewBg,
                        }}
                      >
                        <div className="z-10 flex justify-between items-start">
                          <span
                            className="font-bold text-xs px-2 py-0.5 rounded backdrop-blur-sm"
                            style={{
                              backgroundColor: 'rgba(0,0,0,0.4)',
                              color: t.accent,
                            }}
                          >
                            {t.name}
                          </span>
                          {poster.theme === t.id && (
                            <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span
                          className="z-10 text-[10px] opacity-90 truncate font-medium"
                          style={{ color: t.text }}
                        >
                          {t.bgDesc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Tuning */}
                <div className="pt-4 border-t border-[#231a12] space-y-3">
                  <span className="text-xs font-semibold text-[#baa791] block">রঙ কাস্টমাইজ করুন</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[11px] text-[#877461] block mb-1">বাংলা লেখা</span>
                      <div className="flex items-center gap-2 bg-[#120e0a] p-1.5 rounded-lg border border-[#2d2117]">
                        <input
                          type="color"
                          value={poster.textColor}
                          onChange={(e) => updatePosterField('textColor', e.target.value)}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-[#aaa] uppercase truncate">
                          {poster.textColor}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#877461] block mb-1">অ্যাকসেন্ট/বর্ডার</span>
                      <div className="flex items-center gap-2 bg-[#120e0a] p-1.5 rounded-lg border border-[#2d2117]">
                        <input
                          type="color"
                          value={poster.accentColor}
                          onChange={(e) => updatePosterField('accentColor', e.target.value)}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-[#aaa] uppercase truncate">
                          {poster.accentColor}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#877461] block mb-1">আরবি টেক্সট</span>
                      <div className="flex items-center gap-2 bg-[#120e0a] p-1.5 rounded-lg border border-[#2d2117]">
                        <input
                          type="color"
                          value={poster.arabicColor}
                          onChange={(e) => updatePosterField('arabicColor', e.target.value)}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-[#aaa] uppercase truncate">
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
                {/* Canvas size */}
                <div>
                  <label className="text-xs font-semibold text-[#baa791] block mb-2">পোস্টারের সাইজ ও অনুপাত</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ASPECT_RATIOS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => updatePosterField('size', item.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          poster.size === item.id
                            ? 'bg-[#271d15] border-[#d4af37] text-[#f7df94]'
                            : 'bg-[#120e0a] border-[#2d2117] text-[#9b8976] hover:border-[#44301d]'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{item.label}</span>
                          <span className="text-[10px] opacity-75">{item.ratio}</span>
                        </div>
                        <span className="text-[10px] block mt-1 text-[#7a6a58] leading-tight">
                          {item.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font selection */}
                <div>
                  <label className="text-xs font-semibold text-[#baa791] block mb-1.5">বাংলা ফন্ট</label>
                  <select
                    value={poster.font}
                    onChange={(e) => updatePosterField('font', e.target.value)}
                    className="w-full px-3 py-2 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
                  >
                    <option value="Noto Sans Bengali">নোটো সান্স বেঙ্গলি (সর্বাধিক স্পষ্ট সংখ্যা ও যুক্তাক্ষর - প্রস্তাবিত)</option>
                    <option value="Anek Bangla">আনেক বাংলা (Anek Bangla - আধুনিক ও স্পষ্ট)</option>
                    <option value="Noto Serif Bengali">নোটো সেরিফ বেঙ্গলি (Noto Serif - আভিজাত্যময়)</option>
                    <option value="Tiro Bangla">তিরো বাংলা (Tiro Bangla - ঐতিহ্যবাহী ক্যালিগ্রাফিক)</option>
                    <option value="Hind Siliguri">হিন্দ শিলিগুড়ি (Hind Siliguri - স্ট্যান্ডার্ড)</option>
                  </select>
                </div>

                {/* Font Size & Auto Fit */}
                <div className="space-y-3 pt-2 border-t border-[#231a12]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#baa791]">
                      লেখার সাইজ: <span className="text-[#f7df94]">{toBengaliNumber(poster.fontSize)}px</span>
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-[#a9947c] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={poster.autoFit}
                        onChange={(e) => updatePosterField('autoFit', e.target.checked)}
                        className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                      />
                      <span>অটো-ফিট (স্বয়ংক্রিয় মাপ)</span>
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

                {/* Text Alignment */}
                <div>
                  <span className="text-xs font-semibold text-[#baa791] block mb-1.5">টেক্সট অ্যালাইনমেন্ট</span>
                  <div className="grid grid-cols-3 gap-2 bg-[#120e0a] p-1 rounded-xl border border-[#2d2117]">
                    <button
                      onClick={() => updatePosterField('align', 'left')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        poster.align === 'left'
                          ? 'bg-[#d4af37] text-[#140e0a]'
                          : 'text-[#877461] hover:text-[#f4eee2]'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      বামে
                    </button>
                    <button
                      onClick={() => updatePosterField('align', 'center')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        poster.align === 'center'
                          ? 'bg-[#d4af37] text-[#140e0a]'
                          : 'text-[#877461] hover:text-[#f4eee2]'
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                      মাঝে
                    </button>
                    <button
                      onClick={() => updatePosterField('align', 'right')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        poster.align === 'right'
                          ? 'bg-[#d4af37] text-[#140e0a]'
                          : 'text-[#877461] hover:text-[#f4eee2]'
                      }`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                      ডানে
                    </button>
                  </div>
                </div>

                {/* Reference Position */}
                <div>
                  <span className="text-xs font-semibold text-[#baa791] block mb-1.5">রেফারেন্সের অবস্থান</span>
                  <select
                    value={poster.refPos}
                    onChange={(e) => updatePosterField('refPos', e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
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
                  <label className="text-xs font-semibold text-[#baa791] block mb-2">কাস্টম ব্যাকগ্রাউন্ড ছবি</label>
                  {poster.bgDataUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#d4af37]/50 mb-3 group">
                      <img
                        src={poster.bgDataUrl}
                        alt="Custom background"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={handleRemoveBg}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-900/80 hover:bg-red-800 text-white text-xs flex items-center gap-1 shadow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        মুছে ফেলুন
                      </button>
                    </div>
                  ) : null}

                  <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-[#382a1d] hover:border-[#d4af37] rounded-xl cursor-pointer bg-[#120e0a] text-xs font-medium text-[#c49b3a] transition">
                    <Upload className="w-4 h-4" />
                    <span>গ্যালারি বা কম্পিউটার থেকে ছবি আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomBgUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Overlay Darkness Slider */}
                {poster.bgDataUrl && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#baa791]">
                      <span>ছবির উপর ডার্ক ওভারলে / অন্ধকার স্তর</span>
                      <span className="font-semibold text-[#f7df94]">
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
                    <p className="text-[11px] text-[#7a6a58]">
                      লেখা সহজে পড়তে ছবির ওপর কালো শেড বা টিন্ট নিয়ন্ত্রণ করুন।
                    </p>
                  </div>
                )}

                {/* Islamic Geometric Pattern */}
                <div>
                  <label className="text-xs font-semibold text-[#baa791] block mb-2">ইসলামিক অলঙ্করণ প্যাটার্ন</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'geometric', label: '৮-তারা জ্যামিতিক' },
                      { id: 'arabesque', label: 'আরবেস্ক ফুলকারি' },
                      { id: 'stars', label: 'নক্ষত্র মণ্ডল' },
                      { id: 'subtle', label: 'সূক্ষ্ম গ্রিড' },
                      { id: 'none', label: 'কোনো প্যাটার্ন নয়' },
                    ].map((pat) => (
                      <button
                        key={pat.id}
                        onClick={() => updatePosterField('bgPattern', pat.id as PatternStyle)}
                        className={`p-2.5 rounded-xl border text-xs text-center transition ${
                          poster.bgPattern === pat.id
                            ? 'bg-[#271d15] border-[#d4af37] text-[#f7df94] font-semibold'
                            : 'bg-[#120e0a] border-[#2d2117] text-[#9b8976] hover:border-[#44301d]'
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
                  <label className="text-xs font-semibold text-[#baa791] block mb-2">বর্ডার বা ফ্রেমের ধরণ</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'double', label: 'ডাবল গোল্ডেন বর্ডার' },
                      { id: 'simple', label: 'সাধারণ সলিড বর্ডার' },
                      { id: 'ornate', label: 'অলঙ্কৃত ড্যাশড বর্ডার' },
                      { id: 'arch', label: 'মসজিদ মেহরাব খিলান' },
                      { id: 'none', label: 'বর্ডার ছাড়া' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => updatePosterField('borderStyle', b.id as BorderStyle)}
                        className={`p-2.5 rounded-xl border text-xs text-center transition ${
                          poster.borderStyle === b.id
                            ? 'bg-[#271d15] border-[#d4af37] text-[#f7df94] font-semibold'
                            : 'bg-[#120e0a] border-[#2d2117] text-[#9b8976] hover:border-[#44301d]'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#231a12]">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#120e0a] border border-[#2d2117] cursor-pointer">
                    <span className="text-xs font-medium text-[#f4eee2]">চার কোণায় ইসলামিক তারা অলঙ্করণ</span>
                    <input
                      type="checkbox"
                      checked={poster.decorCorner}
                      onChange={(e) => updatePosterField('decorCorner', e.target.checked)}
                      className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#120e0a] border border-[#2d2117] cursor-pointer">
                    <span className="text-xs font-medium text-[#f4eee2]">রেফারেন্সের সামনে অলঙ্কৃত ডিভাইডার</span>
                    <input
                      type="checkbox"
                      checked={poster.decorDivider}
                      onChange={(e) => updatePosterField('decorDivider', e.target.checked)}
                      className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 6. BRANDING TAB */}
            {activeTab === 'brand' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#baa791] block mb-1.5">লোগো ও ব্র্যান্ডের অবস্থান</label>
                  <select
                    value={brand.pos}
                    onChange={(e) => updateBrandField('pos', e.target.value as BrandPosition)}
                    className="w-full px-3 py-2 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
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
                  <span className="text-xs font-semibold text-[#baa791] block">পোস্টারে কী কী থাকবে</span>
                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#120e0a] border border-[#2d2117] cursor-pointer">
                    <span className="text-xs text-[#f4eee2]">ব্র্যান্ড লোগো আইকন</span>
                    <input
                      type="checkbox"
                      checked={brand.showLogo}
                      onChange={(e) => updateBrandField('showLogo', e.target.checked)}
                      className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#120e0a] border border-[#2d2117] cursor-pointer">
                    <span className="text-xs text-[#f4eee2]">ট্যাগলাইন ({brand.tagline})</span>
                    <input
                      type="checkbox"
                      checked={brand.showTag}
                      onChange={(e) => updateBrandField('showTag', e.target.checked)}
                      className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#120e0a] border border-[#2d2117] cursor-pointer">
                    <span className="text-xs text-[#f4eee2]">সোশ্যাল হ্যান্ডেল ({brand.handle})</span>
                    <input
                      type="checkbox"
                      checked={brand.showHandle}
                      onChange={(e) => updateBrandField('showHandle', e.target.checked)}
                      className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#120e0a] border border-[#2d2117] cursor-pointer">
                    <span className="text-xs text-[#f4eee2]">ফুটার কপিরাইট ওয়াটারমার্ক</span>
                    <input
                      type="checkbox"
                      checked={brand.watermark}
                      onChange={(e) => updateBrandField('watermark', e.target.checked)}
                      className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                    />
                  </label>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#231a12]">
                  <div className="flex justify-between text-xs text-[#baa791]">
                    <span>লোগোর আকার</span>
                    <span className="font-semibold text-[#f7df94]">{toBengaliNumber(brand.logoSize)}px</span>
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
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Intro & AI Action Banner */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#221811] via-[#1f140e] to-[#17110c] border border-[#d4af37]/40 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      <span className="text-xs font-bold text-[#f7df94]">ফেসবুক পোস্ট ও এসইও সহকারী</span>
                    </div>
                    {seoData.isAiGenerated && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 font-medium">
                        AI অপটিমাইজড
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#baa791] leading-relaxed mb-3">
                    ফেসবুক অ্যালগরিদম ও গুগল ইমেজ সার্চে পোস্ট দ্রুত ভাইরাল করার জন্য আকর্ষণীয় হুক, প্রতিফলন, দোয়া ও হ্যাশট্যাগ।
                  </p>
                  
                  <button
                    disabled={isGeneratingAiSeo}
                    onClick={handleGenerateAiSeo}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow transition active:scale-[0.98] disabled:opacity-60"
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

                {/* 1. SEO Image Filename Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#baa791] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>এসইও ইমেজ ফাইল নাম</span>
                    </label>
                    <button
                      onClick={handleCopyFilename}
                      className="text-[11px] text-[#d4af37] hover:underline flex items-center gap-1"
                    >
                      {copiedFilename ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFilename ? 'কপি হয়েছে' : 'নাম কপি'}</span>
                    </button>
                  </div>
                  <div className="bg-[#120e0a] p-2.5 rounded-xl border border-[#2d2117] flex items-center justify-between font-mono text-[11px] text-[#f7df94] overflow-x-auto">
                    <span className="truncate">{generateSeoFilename(poster, brand, 'png')}</span>
                  </div>
                  <p className="text-[10px] text-[#7a6a58]">
                    ✓ আপনি যখনই PNG বা JPG ডাউনলোড করবেন, স্বয়ংক্রিয়ভাবে এই গুগল ইমেজ ও ফেসবুক এসইও ফ্রেন্ডলি নামটি ব্যবহার হবে।
                  </p>
                </div>

                {/* 2. SEO Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#baa791]">পোস্ট শিরোনাম / হুক</label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(seoData.seoTitle);
                        showToast('শিরোনাম কপি হয়েছে');
                      }}
                      className="text-[11px] text-[#d4af37] hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>কপি</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={seoData.seoTitle}
                    onChange={(e) => setSeoData(prev => ({ ...prev, seoTitle: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#120e0a] border border-[#2d2117] rounded-xl text-xs text-[#f4eee2] focus:border-[#d4af37] outline-none"
                  />
                </div>

                {/* 3. Full Facebook Post Caption Textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#baa791] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>সম্পূর্ণ ফেসবুক পোস্ট (ক্যাপশন)</span>
                    </label>
                    <span className="text-[10px] text-[#877461]">রেডি-টু-পোস্ট</span>
                  </div>
                  <textarea
                    rows={8}
                    value={seoData.fbCaption}
                    onChange={(e) => setSeoData(prev => ({ ...prev, fbCaption: e.target.value }))}
                    className="w-full p-3 bg-[#120e0a] border border-[#2d2117] rounded-xl text-xs text-[#f4eee2] focus:border-[#d4af37] outline-none leading-relaxed resize-none font-sans"
                  />
                  <button
                    onClick={handleCopyFullFbPost}
                    className="w-full py-2.5 rounded-xl bg-[#241a12] hover:bg-[#322419] text-[#f7df94] font-bold text-xs border border-[#44301d] transition flex items-center justify-center gap-2 shadow"
                  >
                    {copiedFbPost ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                    <span>{copiedFbPost ? 'সম্পূর্ণ ফেসবুক পোস্ট কপি হয়েছে!' : 'সম্পূর্ণ ফেসবুক পোস্ট কপি করুন'}</span>
                  </button>
                </div>

                {/* 4. Hashtags bank */}
                <div className="space-y-2 pt-2 border-t border-[#231a12]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#baa791] flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>ভাইরাল হ্যাশট্যাগ ({toBengaliNumber(seoData.hashtags.length)}টি)</span>
                    </label>
                    <button
                      onClick={handleCopyHashtags}
                      className="text-[11px] text-[#d4af37] hover:underline flex items-center gap-1"
                    >
                      {copiedHashtags ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHashtags ? 'কপি হয়েছে' : 'সবগুলো কপি'}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                    {seoData.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#1d140d] border border-[#38281a] text-[10px] text-[#d4af37] font-mono cursor-pointer hover:bg-[#2b1e13] transition"
                        onClick={() => {
                          navigator.clipboard.writeText(tag);
                          showToast(`${tag} কপি হয়েছে`);
                        }}
                        title="ক্লিক করে কপি করুন"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 5. Alt Text for Image SEO */}
                <div className="space-y-1.5 pt-2 border-t border-[#231a12]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#baa791]">ইমেজ অল্ট টেক্সট (Alt Text)</label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(seoData.altText);
                        showToast('অল্ট টেক্সট কপি হয়েছে');
                      }}
                      className="text-[11px] text-[#d4af37] hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>কপি</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={seoData.altText}
                    className="w-full px-3 py-2 bg-[#120e0a] border border-[#2d2117] rounded-xl text-xs text-[#a9947c] outline-none"
                  />
                  <p className="text-[10px] text-[#7a6a58]">
                    ফেসবুকে ছবি আপলোডের সময় 'Edit Alt Text' অপশনে এটি পেস্ট করলে পেইজের রিচ বহুগুণ বৃদ্ধি পায়।
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <button
              onClick={() => handleDownload('png')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d4af37] text-black font-semibold text-xs shadow"
            >
              <Download className="w-4 h-4" />
              <span>ডাউনলোড</span>
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              title="বন্ধ করুন"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center overflow-auto">
            <img
              src={canvasRef.current?.toDataURL('image/png') || ''}
              alt="Fullscreen Preview"
              className="max-h-[85vh] w-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Quote Picker Modal */}
      {showQuotePicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#2d2117] flex items-center justify-between bg-[#130d09]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20">
                  <BookOpen className="w-4 h-4 text-[#d4af37]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#f4eee2]">বাণী ও কুরআন এপিআই লাইব্রেরি</h3>
                  <p className="text-[10px] text-[#9b8976]">১১৪টি সূরা • ৬,২৩৬টি আয়াত • সহীহ হাদিস ও নির্বাচিত বাণী</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuotePicker(false)}
                className="p-1.5 rounded-lg hover:bg-[#241a12] text-[#877461] hover:text-[#f4eee2] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#231a12] bg-[#140e0a] px-3 pt-2 gap-1 text-xs">
              <button
                onClick={() => setPickerTab('curated')}
                className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
                  pickerTab === 'curated'
                    ? 'border-[#d4af37] text-[#d4af37]'
                    : 'border-transparent text-[#9b8976] hover:text-[#f4eee2]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>নির্বাচিত বাণী ({INITIAL_QUOTES.length})</span>
              </button>
              <button
                onClick={() => setPickerTab('quran')}
                className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
                  pickerTab === 'quran'
                    ? 'border-[#d4af37] text-[#d4af37]'
                    : 'border-transparent text-[#9b8976] hover:text-[#f4eee2]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>সমগ্র কুরআন (১১৪ সূরা)</span>
              </button>
              <button
                onClick={() => setPickerTab('hadith')}
                className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
                  pickerTab === 'hadith'
                    ? 'border-[#d4af37] text-[#d4af37]'
                    : 'border-transparent text-[#9b8976] hover:text-[#f4eee2]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>সহীহ হাদিস</span>
              </button>
              <button
                onClick={() => setPickerTab('search')}
                className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
                  pickerTab === 'search'
                    ? 'border-[#d4af37] text-[#d4af37]'
                    : 'border-transparent text-[#9b8976] hover:text-[#f4eee2]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>কুরআন লাইভ সার্চ (API)</span>
              </button>
            </div>

            {/* Tab 1: Curated Quotes */}
            {pickerTab === 'curated' && (
              <>
                {/* Filter & Search */}
                <div className="p-3.5 border-b border-[#231a12] space-y-2.5 bg-[#140e0a]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#877461]" />
                    <input
                      type="text"
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      placeholder="আয়াত, হাদিস বা বিষয় খুঁজুন..."
                      className="w-full pl-9 pr-3 py-2 bg-[#1b140e] border border-[#2d2117] rounded-xl text-xs text-[#f4eee2] focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPickerCat(cat)}
                        className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition ${
                          pickerCat === cat
                            ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                            : 'bg-[#1f1610] text-[#9b8976] hover:text-[#f4eee2]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quote List */}
                <div className="p-4 overflow-y-auto space-y-3 flex-1">
                  {filteredPickerQuotes.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => selectQuote(q)}
                      className="p-3.5 rounded-xl bg-[#1f1610] hover:bg-[#281b12] border border-[#2d2117] hover:border-[#d4af37] cursor-pointer transition group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#2a1d13] text-[#d4af37]">
                          {q.type === 'quran' ? 'কুরআন' : q.type === 'hadith' ? 'হাদিস' : 'উক্তি'}
                        </span>
                        <span className="text-[11px] text-[#877461]">{q.ref}</span>
                      </div>
                      {q.ar && (
                        <p dir="rtl" className="font-arabic text-sm text-[#f7df94] mb-1 line-clamp-1">
                          {q.ar}
                        </p>
                      )}
                      <p className="font-bengali text-xs text-[#e8dcbe] line-clamp-2">
                        {q.bn}
                      </p>
                    </div>
                  ))}
                  {filteredPickerQuotes.length === 0 && (
                    <div className="text-center py-8 text-xs text-[#877461]">
                      কোনো বাণী মেলেনি
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Tab 2: Full Quran (114 Surahs API) */}
            {pickerTab === 'quran' && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                {/* Surah & Ayah Selector Form */}
                <div className="p-3.5 bg-[#1b140e] border border-[#2d2117] rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-[#9b8976] mb-1">সূরা নির্বাচন করুন (১-১১৪):</label>
                      <select
                        value={pickerSurah}
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          setPickerSurah(num);
                          setPickerAyah('1');
                        }}
                        className="w-full px-2.5 py-2 bg-[#140e0a] border border-[#2d2117] rounded-lg text-xs text-[#f4eee2] focus:border-[#d4af37] outline-none"
                      >
                        {SURAH_LIST.map((s) => (
                          <option key={s.number} value={s.number}>
                            {toBengaliNumber(s.number)}. সূরা {s.banglaName} ({s.englishName}) - {toBengaliNumber(s.totalAyahs)} আয়াত
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#9b8976] mb-1">
                        আয়াত (সর্বোচ্চ {toBengaliNumber(SURAH_LIST.find((s) => s.number === pickerSurah)?.totalAyahs || 1)}):
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={SURAH_LIST.find((s) => s.number === pickerSurah)?.totalAyahs || 1}
                          value={pickerAyah}
                          onChange={(e) => setPickerAyah(e.target.value)}
                          className="w-full px-2.5 py-2 bg-[#140e0a] border border-[#2d2117] rounded-lg text-xs text-[#f4eee2] text-center focus:border-[#d4af37] outline-none"
                        />
                        <button
                          type="button"
                          onClick={handlePickerFetchAyah}
                          disabled={isPickerLoadingAyah}
                          className="px-3 py-2 bg-[#d4af37] hover:bg-[#e6c34e] text-black font-bold text-xs rounded-lg transition disabled:opacity-50 shrink-0"
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

                  {/* Quick Famous Verses */}
                  <div className="pt-2 border-t border-[#261c14]">
                    <span className="text-[10px] text-[#877461] block mb-1.5">জনপ্রিয় আয়াতসমূহ:</span>
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
                          className="px-2 py-0.5 rounded bg-[#130e09] hover:bg-[#2a1d13] border border-[#2a1e15] hover:border-[#d4af37] text-[10px] text-[#c7b59e] transition"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fetched Ayah Card */}
                {pickerAyahResult ? (
                  <div className="p-4 bg-[#1f1610] border border-[#d4af37]/40 rounded-xl space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#d4af37] bg-[#2a1d13] px-2.5 py-0.5 rounded">
                        {pickerAyahResult.reference}
                      </span>
                      <span className="text-[10px] text-[#9b8976]">
                        {pickerAyahResult.surahNameAr}
                      </span>
                    </div>

                    <p dir="rtl" className="font-arabic text-lg text-[#f7df94] leading-relaxed text-right">
                      {pickerAyahResult.arabicText}
                    </p>

                    <p className="font-bengali text-sm text-[#f4eee2] leading-relaxed">
                      "{pickerAyahResult.bengaliText}"
                    </p>

                    <button
                      type="button"
                      onClick={() => selectAyahToCanvas(pickerAyahResult)}
                      className="w-full py-2.5 bg-[#d4af37] hover:bg-[#e6c34e] text-black font-bold text-xs rounded-lg transition shadow flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>এই আয়াতটি পোস্টার ক্যানভাসে যুক্ত করুন</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-[#2d2117] rounded-xl text-xs text-[#877461]">
                    উপরের ড্রপডাউন থেকে সূরা এবং আয়াত নম্বর নির্বাচন করে "লোড" বাটনে ক্লিক করুন।
                  </div>
                )}
              </div>
            )}

            {/* Tab: Authentic Hadiths */}
            {pickerTab === 'hadith' && (
              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                <div className="space-y-2">
                  <span className="text-[11px] text-[#877461]">
                    সহীহ বুখারি, সহীহ মুসলিম, জামে আত-তিরমিযী থেকে সংকলিত:
                  </span>
                  <div className="space-y-2.5">
                    {VERIFIED_HADITHS.map((h) => (
                      <div
                        key={h.id}
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
                        className="p-3.5 rounded-xl bg-[#1f1610] hover:bg-[#281b12] border border-[#2d2117] hover:border-[#d4af37] cursor-pointer transition group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#2a1d13] text-[#d4af37]">
                            {h.topic}
                          </span>
                          <span className="text-[11px] text-[#877461]">{h.ref}</span>
                        </div>
                        {h.ar && (
                          <p dir="rtl" className="font-arabic text-sm text-[#f7df94] mb-1 line-clamp-1">
                            {h.ar}
                          </p>
                        )}
                        <p className="font-bengali text-xs text-[#e8dcbe] line-clamp-2">
                          {h.bn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Quran Live Search API */}
            {pickerTab === 'search' && (
              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {/* Search Input Form */}
                <form onSubmit={handlePickerSearchApi} className="space-y-2">
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#877461]" />
                      <input
                        type="text"
                        value={pickerLiveKeyword}
                        onChange={(e) => setPickerLiveKeyword(e.target.value)}
                        placeholder="বাংলা শব্দ লিখে খুঁজুন (উদাঃ ধৈর্য, সালাত, ক্ষমা, রিজিক, মা-বাবা)..."
                        className="w-full pl-9 pr-3 py-2 bg-[#1b140e] border border-[#2d2117] rounded-xl text-xs text-[#f4eee2] focus:border-[#d4af37] outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isPickerSearching || !pickerLiveKeyword.trim()}
                      className="px-4 py-2 bg-[#d4af37] hover:bg-[#e6c34e] text-black font-bold text-xs rounded-xl transition disabled:opacity-50 shrink-0 flex items-center gap-1"
                    >
                      {isPickerSearching ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>কুরআনে খুঁজুন</span>
                      )}
                    </button>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="text-[#877461] py-0.5">দ্রুত সার্চ:</span>
                    {['ধৈর্য', 'সালাত', 'ক্ষমা', 'রিজিক', 'জান্নাত', 'মা-বাবা', 'ইনসাফ', 'তওবা'].map((word) => (
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
                        className="px-2 py-0.5 rounded bg-[#1f1610] hover:bg-[#2a1d13] text-[#c7b59e] border border-[#2a1e15]"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </form>

                {/* Search Results */}
                {isPickerSearching ? (
                  <div className="text-center py-8 text-xs text-[#d4af37] flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>৬,২৩৬টি আয়াত থেকে অনুসন্ধান করা হচ্ছে...</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pickerHasSearched && (
                      <p className="text-[11px] text-[#877461]">
                        {pickerSearchResults.length > 0
                          ? `${toBengaliNumber(pickerSearchResults.length)}টি আয়াত পাওয়া গেছে:`
                          : 'কোনো আয়াত পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।'}
                      </p>
                    )}

                    {pickerSearchResults.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#1f1610] border border-[#2d2117] hover:border-[#d4af37]/60 transition space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#d4af37] bg-[#2a1d13] px-2 py-0.5 rounded">
                            {m.reference}
                          </span>
                          <button
                            type="button"
                            onClick={() => selectAyahToCanvas(m)}
                            className="px-2.5 py-1 bg-[#d4af37] hover:bg-[#e6c34e] text-black font-bold text-[11px] rounded transition flex items-center gap-1"
                          >
                            <span>পোস্টারে নিন</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="font-bengali text-xs text-[#e8dcbe] leading-relaxed">
                          {m.bengaliText}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
