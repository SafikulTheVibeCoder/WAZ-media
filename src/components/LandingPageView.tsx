import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_PRESETS, DEFAULT_POSTER, DEFAULT_BRAND, DEFAULT_LOGO } from '../data/quotes';
import { BUILTIN_PRESETS } from '../data/presets';
import { renderPoster, downloadBlob } from '../utils/canvasRenderer';
import { ThemeConfig, PosterConfig, BrandConfig, PosterPreset, BorderStyle } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { PRICING_PLANS, BKASH_CONFIG } from '../data/pricingPlans';
import {
  Sparkles,
  Layers,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Crown,
  Download,
  Copy,
  Check,
  Wand2,
  AlertCircle,
  Palette,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';

const FEATURED_POSTERS_SHOWCASE = [
  {
    id: 'p1',
    title: 'সূরা আশ-শারহ (কষ্টের সাথেই স্বস্তি)',
    ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    bn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
    ref: 'সূরা আশ-শারহ, আয়াত: ৫-৬',
    theme: 'golden' as const,
    size: '1080x1080' as const,
    borderStyle: 'double' as const,
    tag: 'কুরআনের বাণী',
    bgGradient: 'linear-gradient(135deg, #111723 0%, #05070c 100%)',
    textColor: '#f2d77d',
  },
  {
    id: 'p2',
    title: 'আয়াতুল কুরসি (মহিমান্বিত আয়াত)',
    ar: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    bn: 'আল্লাহ, তিনি ছাড়া কোনো সত্য উপাস্য নেই; তিনি চিরঞ্জীব, সবকিছুর ধারক।',
    ref: 'সূরা আল-বাকারা, আয়াত: ২৫৫',
    theme: 'black' as const,
    size: '1080x1350' as const,
    borderStyle: 'arch' as const,
    tag: 'আয়াতুল কুরসি',
    bgGradient: 'linear-gradient(135deg, #1a1714 0%, #0b0b0e 100%)',
    textColor: '#ffd700',
  },
  {
    id: 'p3',
    title: 'জুমার দিনের মর্যাদা ও বরকত',
    ar: 'خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ',
    bn: 'সূর্য উদিত হওয়া দিনগুলোর মধ্যে সর্বোত্তম দিন হলো জুমার দিন।',
    ref: 'সহিহ মুসলিম, হাদিস: ৮৫৪',
    theme: 'emerald' as const,
    size: '1080x1080' as const,
    borderStyle: 'arch' as const,
    tag: 'জুম্মা স্পেশাল',
    bgGradient: 'linear-gradient(135deg, #093325 0%, #03140e 100%)',
    textColor: '#6ee7b7',
  },
  {
    id: 'p4',
    title: 'সকল কাজের ফলাফল নিয়তের ওপর',
    ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    bn: 'সকল কাজের ফলাফল নিয়তের ওপর নির্ভরশীল, আর প্রতিটি মানুষ কেবল তাই পাবে যা সে নিয়ত করেছে।',
    ref: 'সহীহ আল-বুখারী, হাদিস: ১',
    theme: 'classic' as const,
    size: '1080x1080' as const,
    borderStyle: 'simple' as const,
    tag: 'সহীহ হাদিস',
    bgGradient: 'linear-gradient(135deg, #2d2116 0%, #14100c 100%)',
    textColor: '#e8dcbe',
  },
  {
    id: 'p5',
    title: 'পিতা-মাতার জন্য কুরআনিক দোয়া',
    ar: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    bn: 'হে আমার রব! তাদের উভয়ের প্রতি দয়া করুন, যেমন করে শৈশবে তারা আমাকে লালন-পালন করেছিলেন।',
    ref: 'সূরা আল-ইসরা, আয়াত: ২৪',
    theme: 'sapphire' as const,
    size: '1080x1080' as const,
    borderStyle: 'ornate' as const,
    tag: 'দোয়া ও মোনাজাত',
    bgGradient: 'linear-gradient(135deg, #10294c 0%, #061120 100%)',
    textColor: '#93c5fd',
  },
  {
    id: 'p6',
    title: 'আল্লাহর অফুরন্ত ক্ষমা ও দয়া',
    ar: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
    bn: 'তোমরা আল্লাহর অনুগ্রহ থেকে নিরাশ হয়ো না। নিশ্চয়ই আল্লাহ সমস্ত গুনাহ ক্ষমা করে দেন।',
    ref: 'সূরা আয-যুমার, আয়াত: ৫৩',
    theme: 'black' as const,
    size: '1080x1920' as const,
    borderStyle: 'double' as const,
    tag: 'মাগফিরাত ও তাওবা',
    bgGradient: 'linear-gradient(135deg, #201a14 0%, #0b0b0e 100%)',
    textColor: '#fcd34d',
  },
];

const DEMO_QUOTES = [
  {
    id: 'ash-sharh',
    title: 'কষ্টের সাথেই স্বস্তি (৯৪:৫-৬)',
    bn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
    ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    ref: 'সূরা আশ-শারহ, আয়াত: ৫-৬',
    theme: 'golden' as const,
  },
  {
    id: 'baqarah-153',
    title: 'ধৈর্য ও সালাত (২:১৫৩)',
    bn: 'হে ঈমানদারগণ! তোমরা ধৈর্য ও সালাতের মাধ্যমে সাহায্য প্রার্থনা করো। নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।',
    ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    ref: 'সূরা আল-বাকারা, আয়াত: ১৫৩',
    theme: 'emerald' as const,
  },
  {
    id: 'bukhari-1',
    title: 'নিয়তের গুরুত্ব (বুখারী ১)',
    bn: 'সকল কাজের ফলাফল নিয়তের ওপর নির্ভরশীল, আর প্রতিটি মানুষ কেবল তাই পাবে যা সে নিয়ত করেছে।',
    ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    ref: 'সহীহ আল-বুখারী, হাদিস: ১',
    theme: 'black' as const,
  },
  {
    id: 'rad-28',
    title: 'আল্লাহর স্মরণে প্রশান্তি (১৩:২৮)',
    bn: 'জেনে রেখো, আল্লাহর স্মরণেই অন্তরসমূহ প্রশান্ত হয়।',
    ar: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    ref: 'সূরা আর-রাদ, আয়াত: ২৮',
    theme: 'sapphire' as const,
  },
];

export const LandingPageView: React.FC = () => {
  const {
    currentUser,
    isApproved,
    setIsAuthModalOpen,
    setCurrentView,
    setPoster,
    showToast,
    triggerAccessGuard,
    brand,
    setIsPricingModalOpen,
    setSelectedUpgradePlan,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'poster' | 'presets' | 'library' | 'rbac'>('poster');

  const [demoPoster, setDemoPoster] = useState<PosterConfig>({
    ...DEFAULT_POSTER,
    bn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
    ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    ref: 'সূরা আশ-শারহ, আয়াত: ৫-৬',
    theme: 'golden',
    size: '1080x1080',
    borderStyle: 'double',
  });

  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [showCustomTextEditor, setShowCustomTextEditor] = useState(false);
  const [isDemoDownloading, setIsDemoDownloading] = useState(false);
  const [demoCopiedCaption, setDemoCopiedCaption] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<
    'basic_user' | 'approved_user' | 'super_admin'
  >('basic_user');

  const [demoPresets, setDemoPresets] = useState<PosterPreset[]>(BUILTIN_PRESETS);
  const [customPresetName, setCustomPresetName] = useState('');
  const [mockApprovalList, setMockApprovalList] = useState([
    {
      id: '1',
      email: 'creator@example.com',
      name: 'আব্দুর রহমান',
      role: 'basic_user',
      status: 'pending',
    },
    {
      id: '2',
      email: 'media@wazpost.com',
      name: 'মুহাম্মদ শাকিল',
      role: 'approved_user',
      status: 'active',
    },
  ]);

  const demoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const demoBrand: BrandConfig = {
    ...DEFAULT_BRAND,
    name: brand.name || 'WAZ MEDIA',
    tagline: brand.tagline || 'INSPIRES FAITH, ILLUMINATING MINDS',
    handle: brand.handle || '@wazmedia.bd',
    logo: brand.logo || DEFAULT_LOGO,
    showLogo: true,
    showTag: true,
    showHandle: false,
    watermark: false,
    pos: 'top-center',
    logoSize: 105,
  };

  useEffect(() => {
    let isSubscribed = true;
    if (activeTab === 'poster' && demoCanvasRef.current) {
      document.fonts.ready.then(() => {
        if (isSubscribed && demoCanvasRef.current) {
          renderPoster(demoCanvasRef.current, demoPoster, demoBrand);
        }
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [demoPoster, activeTab]);

  const scrollToSection = (id: string, tab?: 'poster' | 'presets' | 'library' | 'rbac') => {
    if (tab) setActiveTab(tab);
    setMobileMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 30);
  };

  const handleDownloadDemoPoster = () => {
    if (!demoCanvasRef.current) return;
    setIsDemoDownloading(true);
    try {
      demoCanvasRef.current.toBlob(
        (blob) => {
          if (blob) {
            downloadBlob(blob, 'wazmedia-demo-poster.png');
            showToast('ডেমো পোস্টার সফলভাবে ডাউনলোড হয়েছে!');
          } else {
            showToast('ডাউনলোড করতে সমস্যা হয়েছে');
          }
          setIsDemoDownloading(false);
        },
        'image/png'
      );
    } catch (err) {
      console.error(err);
      showToast('ডাউনলোড ব্যর্থ হয়েছে');
      setIsDemoDownloading(false);
    }
  };

  const handleCopyDemoCaption = () => {
    const parts = [
      demoPoster.ar,
      `"${demoPoster.bn}"`,
      `— ${demoPoster.ref}`,
      `\n#WAZMEDIA #IslamicPoster #Hadith #Quran #Bangladesh`,
    ].filter(Boolean);

    navigator.clipboard.writeText(parts.join('\n\n'));
    setDemoCopiedCaption(true);
    setTimeout(() => setDemoCopiedCaption(false), 2000);
    showToast('ডেমো ফেসবুক ক্যাপশন কপি হয়েছে!');
  };

  const handleSelectDemoQuote = (index: number) => {
    const item = DEMO_QUOTES[index];
    if (!item) return;
    setActiveQuoteIndex(index);
    const th = THEME_PRESETS.find((t) => t.id === item.theme) || THEME_PRESETS[0];
    setDemoPoster((prev) => ({
      ...prev,
      bn: item.bn,
      ar: item.ar,
      ref: item.ref,
      theme: item.theme,
      textColor: th.text,
      accentColor: th.accent,
      arabicColor: th.ar,
    }));
    showToast(`"${item.ref}" ডেমো ক্যানভাসে লোড হয়েছে!`);
  };

  const handleCustomizeShowcasePoster = (item: (typeof FEATURED_POSTERS_SHOWCASE)[0]) => {
    const th = THEME_PRESETS.find((t) => t.id === item.theme) || THEME_PRESETS[0];
    setDemoPoster((prev) => ({
      ...prev,
      bn: item.bn,
      ar: item.ar,
      ref: item.ref,
      theme: item.theme,
      size: item.size,
      borderStyle: item.borderStyle,
      textColor: th.text,
      accentColor: th.accent,
      arabicColor: th.ar,
    }));
    scrollToSection('interactive-demo', 'poster');
    showToast(`"${item.title}" পোস্টারটি লাইভ ক্যানভাসে লোড হয়েছে!`);
  };

  const handleApplyPresetToDemo = (preset: PosterPreset) => {
    const cfg = preset.config;
    setDemoPoster((prev) => ({
      ...prev,
      theme: cfg.theme,
      size: cfg.size,
      font: cfg.font,
      fontSize: cfg.fontSize,
      borderStyle: cfg.borderStyle,
      bgPattern: cfg.bgPattern,
      textColor: cfg.textColor,
      accentColor: cfg.accentColor,
      arabicColor: cfg.arabicColor,
      align: cfg.align,
      refPos: cfg.refPos,
      overlay: cfg.overlay,
      decorCorner: cfg.decorCorner,
      decorDivider: cfg.decorDivider,
      showBismillah: cfg.showBismillah,
    }));
    setActiveTab('poster');
    showToast(`"${preset.name}" স্টাইল ডেমো ক্যানভাসে প্রয়োগ করা হয়েছে!`);
  };

  const handleSimulateSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPresetName.trim()) {
      showToast('দয়া করে প্রিসেটের একটি নাম লিখুন');
      return;
    }
    const newSimulated: PosterPreset = {
      id: `sim-preset-${Date.now()}`,
      name: customPresetName.trim(),
      description: `${demoPoster.theme} থিম · ${demoPoster.size} · ${demoPoster.borderStyle} বর্ডার`,
      category: 'কাস্টম প্রিসেট',
      createdAt: Date.now(),
      isBuiltIn: false,
      previewGradient: 'linear-gradient(135deg, #2b2218 0%, #0e0e12 100%)',
      config: {
        theme: demoPoster.theme,
        size: demoPoster.size,
        font: demoPoster.font,
        fontSize: demoPoster.fontSize,
        arabicSizeRatio: demoPoster.arabicSizeRatio,
        lineHeight: demoPoster.lineHeight,
        autoFit: demoPoster.autoFit,
        textColor: demoPoster.textColor,
        accentColor: demoPoster.accentColor,
        arabicColor: demoPoster.arabicColor,
        align: demoPoster.align,
        refPos: demoPoster.refPos,
        overlay: demoPoster.overlay,
        bgType: demoPoster.bgType,
        bgPattern: demoPoster.bgPattern,
        borderStyle: demoPoster.borderStyle,
        decorCorner: demoPoster.decorCorner,
        decorDivider: demoPoster.decorDivider,
        showBismillah: demoPoster.showBismillah,
      },
    };
    setDemoPresets((prev) => [newSimulated, ...prev]);
    setCustomPresetName('');
    showToast(`"${newSimulated.name}" প্রিসেট সিমুলেশনে সংরক্ষিত হয়েছে!`);
  };

  const handleLoadLibraryItemToDemo = (item: { bn: string; ar: string; ref: string }) => {
    setDemoPoster((prev) => ({
      ...prev,
      bn: item.bn,
      ar: item.ar,
      ref: item.ref,
    }));
    setActiveTab('poster');
    showToast(`"${item.ref}" বাণীটি ডেমো ক্যানভাসে লোড হয়েছে!`);
  };

  const handleTransferToStudio = () => {
    if (currentUser && isApproved) {
      setPoster((prev) => ({
        ...prev,
        ...demoPoster,
      }));
      setCurrentView('poster');
      showToast('ডেমো ডিজাইনটি পোস্টার স্টুডিওতে লোড করা হয়েছে!');
    } else {
      triggerAccessGuard('পোস্টার স্টুডিও অ্যাক্সেস');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-[#f5f3ee]">
      {/* ────────────────────────────────────────────────────────── */}
      {/* TOP BAR CONTRACT: Brand Wordmark — Nav Links — Primary CTA */}
      {/* ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0b0b0e]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single clean wordmark */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0"
          >
            <img
              src={brand.logo || DEFAULT_LOGO}
              alt={brand.name || 'WAZ MEDIA'}
              className="w-7 h-7 object-contain shrink-0"
            />
            <span className="font-bold text-base tracking-wide text-[#f2d77d]">
              {brand.name || 'WAZ MEDIA'}
            </span>
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#b6b0a6]">
            <button
              type="button"
              onClick={() => scrollToSection('posters-showcase')}
              className="hover:text-[#f5f3ee] hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
            >
              কালেকশন
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('interactive-demo', 'poster')}
              className="hover:text-[#f5f3ee] hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
            >
              লাইভ ডেমো
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('interactive-demo', 'presets')}
              className="hover:text-[#f5f3ee] hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
            >
              প্রিসেট
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('interactive-demo', 'library')}
              className="hover:text-[#f5f3ee] hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
            >
              লাইব্রেরি
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pricing-section')}
              className="hover:text-[#f5f3ee] hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
            >
              প্রাইসিং
            </button>
          </nav>

          {/* Zone 3: 1 primary CTA + mobile drawer button */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs sm:text-sm transition whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>ড্যাশবোর্ড</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs sm:text-sm transition whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <span>শুরু করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="মেনু"
              className="md:hidden w-10 h-10 rounded-xl bg-[#141419] border border-white/[0.08] flex items-center justify-center text-[#f5f3ee]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.08] bg-[#101014] px-4 py-3 space-y-1">
            {[
              { label: 'পোস্টার কালেকশন', action: () => scrollToSection('posters-showcase') },
              {
                label: 'লাইভ স্টুডিও ডেমো',
                action: () => scrollToSection('interactive-demo', 'poster'),
              },
              {
                label: 'স্টাইল প্রিসেট',
                action: () => scrollToSection('interactive-demo', 'presets'),
              },
              {
                label: 'কুরআন ও হাদিস লাইব্রেরি',
                action: () => scrollToSection('interactive-demo', 'library'),
              },
              { label: 'প্রাইসিং ও প্যাকেজ', action: () => scrollToSection('pricing-section') },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[#b6b0a6] hover:text-[#f5f3ee] hover:bg-[#1b1b22] transition min-h-[44px]"
              >
                {item.label}
              </button>
            ))}

            {currentUser && (
              <div className="pt-2 border-t border-white/[0.08] grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCurrentView('poster');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#1b1b22] text-xs font-semibold text-[#f2d77d] min-h-[42px]"
                >
                  পোস্টার স্টুডিও
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCurrentView('planner');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#1b1b22] text-xs font-semibold text-[#f5f3ee] min-h-[42px]"
                >
                  মিডিয়া প্ল্যানার
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ────────────────────────────────────────────────────────── */}
      {/* HERO SECTION */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="border-b border-white/[0.08] py-14 sm:py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs sm:text-sm font-semibold text-[#d4af37] mb-4">
            ইসলামিক মিডিয়া ডিজাইন ও অটোমেশন প্ল্যাটফর্ম
          </p>

          <h1
            className="text-3xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-[#f5f3ee] max-w-4xl mx-auto leading-[1.18]"
            style={{ textWrap: 'balance' }}
          >
            কুরআন ও সুন্নাহর বাণী ছড়িয়ে দিন{' '}
            <span className="text-[#f2d77d]">দৃষ্টিনন্দন পোস্টার ডিজাইনে</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-[#b6b0a6] max-w-2xl mx-auto mt-5 leading-relaxed">
            ১,১৯০+ যাচাইকৃত বাণী, পূর্ণাঙ্গ আল-কুরআন এপিআই ও হিজরি ক্যালেন্ডার সিডিউলসহ ১-ক্লিকে এইচডি ইসলামিক পোস্টার তৈরি এবং সোশ্যাল মিডিয়ায় শেয়ার করুন।
          </p>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  setCurrentView('dashboard');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-sm transition min-h-[48px]"
            >
              <span>{currentUser ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'ফ্রি একাউন্ট খুলুন'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('interactive-demo', 'poster')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#141419] hover:bg-[#1b1b22] text-[#f5f3ee] border border-white/10 font-semibold text-sm transition min-h-[48px]"
            >
              <Palette className="w-4 h-4 text-[#d4af37]" />
              <span>লাইভ ডেমো চালিয়ে দেখুন</span>
            </button>
          </div>

          {currentUser && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setCurrentView('poster')}
                className="text-[#f2d77d] hover:underline font-medium"
              >
                পোস্টার স্টুডিও →
              </button>
              <span aria-hidden="true" className="text-[#807a72]">
                ·
              </span>
              <button
                type="button"
                onClick={() => setCurrentView('planner')}
                className="text-[#b6b0a6] hover:text-[#f5f3ee] hover:underline font-medium"
              >
                হিজরি মিডিয়া প্ল্যানার →
              </button>
              <span aria-hidden="true" className="text-[#807a72]">
                ·
              </span>
              <button
                type="button"
                onClick={() => setCurrentView('captions')}
                className="text-[#b6b0a6] hover:text-[#f5f3ee] hover:underline font-medium"
              >
                বাণী ও ক্যাপশন লাইব্রেরি →
              </button>
            </div>
          )}

          {/* Unboxed Trust Metadata */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-10 pt-8 border-t border-white/[0.08] text-xs text-[#807a72]">
            <span>যাচাইকৃত সহীহ হাদিস ও কুরআন লাইব্রেরি</span>
            <span aria-hidden="true">·</span>
            <span>রোল বেসড এক্সেস কন্ট্রোল (RBAC)</span>
            <span aria-hidden="true">·</span>
            <span>ফায়ারবেস ক্লাউড ডেটাবেজ সিঙ্ক</span>
            <span aria-hidden="true">·</span>
            <span>গ্রেগোরিয়ান ও হিজরি বাল্ক প্ল্যানার</span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-20">
        {/* ────────────────────────────────────────────────────────── */}
        {/* FEATURED POSTERS SHOWCASE */}
        {/* ────────────────────────────────────────────────────────── */}
        <section id="posters-showcase" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#d4af37]">
                রেডি-টু-ইউজ টেমপ্লেট গ্যালারি
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#f5f3ee] mt-1">
                দৃষ্টিনন্দন ইসলামিক পোস্টার কালেকশন
              </h2>
              <p className="text-xs sm:text-sm text-[#807a72] mt-1">
                যেকোনো পোস্টারে ক্লিক করে সরাসরি লাইভ ক্যানভাসে কাস্টমাইজ করুন এবং ১-ক্লিকে ডাউনলোড করুন
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  setCurrentView('dashboard');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="text-xs sm:text-sm text-[#f2d77d] hover:underline inline-flex items-center gap-1.5 font-semibold shrink-0"
            >
              <span>সকল টেমপ্লেট দেখুন</span>
              <ArrowRight className="w-4 h-4 text-[#d4af37]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURED_POSTERS_SHOWCASE.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#141419] border border-white/[0.08] hover:border-[#d4af37]/50 transition flex flex-col justify-between group"
              >
                <div>
                  {/* Unboxed card metadata */}
                  <div className="flex items-center justify-between gap-2 text-xs mb-3">
                    <span className="font-semibold text-[#d4af37]">{item.tag}</span>
                    <span className="text-[#807a72] font-mono tabular-nums">
                      {item.size.replace('x', '×')}px
                    </span>
                  </div>

                  {/* Poster Mockup Preview */}
                  <div
                    className="rounded-xl p-5 border border-white/[0.08] flex flex-col justify-between text-center min-h-[190px] mb-4"
                    style={{ background: item.bgGradient }}
                  >
                    <div className="text-[10px] tracking-widest text-[#d4af37] uppercase font-bold opacity-85">
                      WAZ MEDIA
                    </div>

                    <div className="space-y-2 my-auto py-3">
                      <p dir="rtl" className="font-arabic text-base sm:text-lg leading-relaxed text-[#f2d77d]">
                        {item.ar}
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-[#f5f3ee] line-clamp-2">
                        “{item.bn}”
                      </p>
                    </div>

                    <div className="text-[11px] font-medium" style={{ color: item.textColor }}>
                      — {item.ref} —
                    </div>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-[#f5f3ee] group-hover:text-[#f2d77d] transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#807a72] mt-1 line-clamp-2">{item.bn}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCustomizeShowcasePoster(item)}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] border border-white/[0.08] hover:border-[#d4af37]/50 text-xs font-semibold text-[#f2d77d] transition flex items-center justify-center gap-1.5 min-h-[42px]"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>এই পোস্টারটি কাস্টমাইজ করুন</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────── */}
        {/* INTERACTIVE DEMO SANDBOX */}
        {/* ────────────────────────────────────────────────────────── */}
        <section id="interactive-demo" className="space-y-6 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-[#d4af37]">
              ইন্টারেক্টিভ ডেমো স্যান্ডবক্স
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f5f3ee] mt-1">
              প্ল্যাটফর্মের মূল ফিচারসমূহ সরাসরি চালিয়ে দেখুন
            </h2>
            <p className="text-xs sm:text-sm text-[#807a72] mt-2">
              একাউন্ট তৈরি করার আগেই লাইভ ক্যানভাস ও কুরআন-হাদিস মডিউল পরীক্ষা করুন
            </p>
          </div>

          {/* Segmented Tab Control */}
          <div className="flex overflow-x-auto no-scrollbar sm:justify-center">
            <div className="inline-flex gap-1 p-1 bg-[#141419] border border-white/[0.08] rounded-xl">
              {[
                { id: 'poster', label: '১. লাইভ পোস্টার ইঞ্জিন', icon: Sparkles },
                { id: 'presets', label: '২. স্টাইল প্রিসেট সেভার', icon: Layers },
                { id: 'library', label: '৩. কুরআন ও হাদিস', icon: BookOpen },
                { id: 'rbac', label: '৪. রোল ও এডমিন', icon: ShieldCheck },
              ].map((t) => {
                const TabIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px] transition ${
                      activeTab === t.id
                        ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                        : 'text-[#b6b0a6] hover:text-[#f5f3ee]'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: LIVE POSTER ENGINE */}
          {activeTab === 'poster' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-[#141419] border border-white/[0.08] rounded-2xl p-5 sm:p-7">
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <span className="text-xs font-semibold text-[#d4af37]">ইন্টারেক্টিভ ইঞ্জিন</span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#f5f3ee] mt-1">
                    তাৎক্ষণিক ক্যানভাস জেনারেটর
                  </h3>
                  <p className="text-xs text-[#b6b0a6] mt-1.5 leading-relaxed">
                    রয়্যাল মেহরাব বর্ডার, আরবি ক্যালিগ্রাফি এবং বাংলা টাইপোগ্রাফি সরাসরি ক্যানভাসে রেন্ডার হচ্ছে।
                  </p>
                </div>

                {/* Quick Quote Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#b6b0a6]">বাণী বা আয়াত নির্বাচন করুন:</span>
                    <span className="text-[#807a72]">১-ক্লিক সুইচ</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEMO_QUOTES.map((q, idx) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleSelectDemoQuote(idx)}
                        className={`p-3 rounded-xl border text-left transition ${
                          activeQuoteIndex === idx
                            ? 'bg-[#1b1b22] border-[#d4af37] text-[#f2d77d]'
                            : 'bg-[#0e0e12] border-white/[0.08] text-[#b6b0a6] hover:border-white/20'
                        }`}
                      >
                        <div className="font-semibold text-xs truncate">{q.title}</div>
                        <div className="text-[11px] text-[#807a72] truncate mt-0.5">{q.ref}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Text Editor */}
                <div className="bg-[#0e0e12] border border-white/[0.08] rounded-xl p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#b6b0a6]">
                      নিজের লেখা দিয়ে পরীক্ষা করবেন?
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomTextEditor(!showCustomTextEditor)}
                      className="text-xs text-[#d4af37] hover:underline font-semibold"
                    >
                      {showCustomTextEditor ? 'লুকান' : 'কাস্টম টেক্সট লিখুন'}
                    </button>
                  </div>

                  {showCustomTextEditor && (
                    <div className="mt-3 space-y-2.5 pt-3 border-t border-white/[0.08]">
                      <div>
                        <label className="text-[11px] text-[#807a72] block mb-1">বাংলা বাণী:</label>
                        <textarea
                          rows={2}
                          value={demoPoster.bn}
                          onChange={(e) =>
                            setDemoPoster((prev) => ({ ...prev, bn: e.target.value }))
                          }
                          className="w-full p-2.5 bg-[#141419] border border-white/[0.08] rounded-lg text-xs text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#807a72] block mb-1">আরবি টেক্সট:</label>
                        <textarea
                          rows={2}
                          dir="rtl"
                          value={demoPoster.ar}
                          onChange={(e) =>
                            setDemoPoster((prev) => ({ ...prev, ar: e.target.value }))
                          }
                          className="w-full p-2.5 bg-[#141419] border border-white/[0.08] rounded-lg text-xs text-[#f2d77d] font-arabic focus:border-[#d4af37] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#807a72] block mb-1">রেফারেন্স:</label>
                        <input
                          type="text"
                          value={demoPoster.ref}
                          onChange={(e) =>
                            setDemoPoster((prev) => ({ ...prev, ref: e.target.value }))
                          }
                          className="w-full p-2.5 bg-[#141419] border border-white/[0.08] rounded-lg text-xs text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="text-xs font-semibold text-[#b6b0a6] block mb-2">
                    লাইভ থিম প্যালেট:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {THEME_PRESETS.map((t: ThemeConfig) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setDemoPoster((prev) => ({
                            ...prev,
                            theme: t.id,
                            textColor: t.text,
                            accentColor: t.accent,
                            arabicColor: t.ar,
                          }))
                        }
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-[11px] font-medium transition min-h-[56px] ${
                          demoPoster.theme === t.id
                            ? 'bg-[#1b1b22] border-[#d4af37] text-[#f2d77d]'
                            : 'bg-[#0e0e12] border-white/[0.08] text-[#807a72] hover:border-white/20'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-md border border-white/15 shrink-0"
                          style={{ backgroundColor: t.accent }}
                        />
                        <span className="truncate w-full text-center text-[10px]">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Selector */}
                <div>
                  <label className="text-xs font-semibold text-[#b6b0a6] block mb-2">
                    সোশ্যাল মিডিয়া অনুপাত:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1080x1080', label: '১:১ স্কয়ার' },
                      { id: '1080x1350', label: '৪:৫ পোর্ট্রেট' },
                      { id: '1080x1920', label: '৯:১৬ স্টোরি' },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setDemoPoster((prev) => ({ ...prev, size: sz.id as any }))}
                        className={`py-2 px-2 rounded-xl text-xs font-medium border transition text-center min-h-[38px] ${
                          demoPoster.size === sz.id
                            ? 'bg-[#1b1b22] border-[#d4af37] text-[#f2d77d] font-semibold'
                            : 'bg-[#0e0e12] border-white/[0.08] text-[#807a72] hover:text-[#f5f3ee]'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Style Selector */}
                <div>
                  <label className="text-xs font-semibold text-[#b6b0a6] block mb-2">
                    ইসলামিক বর্ডার আর্ট:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'double', label: 'ডাবল গোল্ড' },
                      { id: 'arch', label: 'মেহরাব খিলান' },
                      { id: 'ornate', label: 'কারুকার্যময়' },
                      { id: 'simple', label: 'সিম্পল' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setDemoPoster((prev) => ({
                            ...prev,
                            borderStyle: b.id as BorderStyle,
                          }))
                        }
                        className={`py-2 px-2 rounded-xl text-[11px] font-medium border transition text-center min-h-[38px] ${
                          demoPoster.borderStyle === b.id
                            ? 'bg-[#1b1b22] border-[#d4af37] text-[#f2d77d] font-semibold'
                            : 'bg-[#0e0e12] border-white/[0.08] text-[#807a72] hover:text-[#f5f3ee]'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadDemoPoster}
                      disabled={isDemoDownloading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition min-h-[44px] disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {isDemoDownloading ? 'ডাউনলোড হচ্ছে...' : 'ডেমো পোস্টার ডাউনলোড'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyDemoCaption}
                      className="px-4 py-3 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/[0.08] text-xs font-semibold transition flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      {demoCopiedCaption ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#d4af37]" />
                      )}
                      <span>{demoCopiedCaption ? 'কপি হয়েছে' : 'ক্যাপশন কপি'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTransferToStudio}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition min-h-[44px]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {currentUser && isApproved
                        ? 'এই ডিজাইন নিয়ে পোস্টার স্টুডিওতে যান'
                        : 'পূর্ণ অ্যাক্সেস পেতে সাইন-ইন / রিকোয়েস্ট করুন'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Live Canvas Preview */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2.5 text-xs text-[#807a72]">
                  <span className="font-mono tabular-nums">
                    লাইভ ক্যানভাস রেন্ডারার · {demoPoster.size.replace('x', '×')}px
                  </span>
                  <span className="text-[#d4af37] font-medium">আরবি ও বাংলা ভেক্টর টেক্সট</span>
                </div>

                <div className="w-full max-w-md rounded-2xl bg-[#0e0e12] p-3 border border-white/[0.08] flex items-center justify-center">
                  <canvas
                    ref={demoCanvasRef}
                    width={1080}
                    height={
                      demoPoster.size === '1080x1080'
                        ? 1080
                        : demoPoster.size === '1080x1350'
                        ? 1350
                        : 1920
                    }
                    className="w-full h-auto max-h-[540px] object-contain rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRESET SAVER */}
          {activeTab === 'presets' && (
            <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 sm:p-7 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <span className="text-xs font-semibold text-[#d4af37]">ফিচার ০২</span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#f5f3ee] mt-1">
                    স্টাইল প্রিসেট সংরক্ষণ ও অটো-অ্যাপ্লাই সিস্টেম
                  </h3>
                  <p className="text-xs text-[#b6b0a6] mt-1.5 leading-relaxed">
                    আপনার পেজ বা ব্র্যান্ডের সিগনেচার স্টাইল একবার প্রিসেট হিসেবে সেভ করুন। যেকোনো নতুন আয়াত বা হাদিসে ১-ক্লিকেই পুরো ফরম্যাট প্রয়োগ হবে।
                  </p>
                </div>

                <form
                  onSubmit={handleSimulateSavePreset}
                  className="bg-[#0e0e12] border border-white/[0.08] rounded-xl p-4 space-y-2.5 shrink-0 md:w-80"
                >
                  <label className="text-xs font-semibold text-[#f2d77d] block">
                    টেস্ট প্রিসেট সেভ করুন:
                  </label>
                  <input
                    type="text"
                    value={customPresetName}
                    onChange={(e) => setCustomPresetName(e.target.value)}
                    placeholder="উদাঃ আমার পেইজের গোল্ডেন স্টাইল"
                    className="w-full px-3 py-2 bg-[#141419] border border-white/[0.08] rounded-lg text-xs text-[#f5f3ee] placeholder:text-[#807a72] focus:border-[#d4af37] outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition min-h-[38px]"
                  >
                    প্রিসেট সংরক্ষণ টেস্ট করুন
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {demoPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-5 rounded-xl bg-[#0e0e12] border border-white/[0.08] hover:border-[#d4af37]/50 transition space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#f2d77d] truncate">{preset.name}</span>
                        <span className="text-[11px] text-[#807a72] shrink-0">
                          {preset.category || 'প্রিসেট'}
                        </span>
                      </div>
                      <p className="text-xs text-[#807a72] mt-1 line-clamp-2">
                        {preset.description}
                      </p>

                      <div
                        className="h-20 rounded-lg border border-white/[0.08] flex items-center justify-center p-3 text-center text-xs font-semibold mt-3"
                        style={{ background: preset.previewGradient }}
                      >
                        <span className="text-[#f2d77d]">{preset.name}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyPresetToDemo(preset)}
                      className="w-full py-2.5 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] border border-white/[0.08] hover:border-[#d4af37]/50 text-xs font-semibold text-[#f2d77d] transition flex items-center justify-center gap-1.5 min-h-[40px]"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>এই স্টাইলটি ডেমোতে প্রয়োগ করুন</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: QURAN & HADITH BROWSER */}
          {activeTab === 'library' && (
            <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <span className="text-xs font-semibold text-[#d4af37]">ফিচার ০৩</span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#f5f3ee] mt-1">
                    সহীহ হাদিস ও পূর্ণাঙ্গ আল-কুরআন এপিআই ব্রাউজার
                  </h3>
                  <p className="text-xs text-[#b6b0a6] mt-1.5 leading-relaxed">
                    সহীহ বুখারী, মুসলিম এবং আল-কুরআনের পূর্ণাঙ্গ ১১৪টি সূরার আয়াত অনুসন্ধান করুন এবং সরাসরি ডেমো বা স্টুডিওতে লোড করুন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentView('captions')}
                  className="px-4 py-2.5 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] border border-[#d4af37]/30 text-[#f2d77d] text-xs font-bold transition inline-flex items-center gap-2 shrink-0 min-h-[42px]"
                >
                  <BookOpen className="w-4 h-4 text-[#d4af37]" />
                  <span>সম্পূর্ণ লাইব্রেরিতে যান</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    source: 'কুরআনুল কারীম',
                    ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
                    bn: 'হে ঈমানদারগণ! তোমরা ধৈর্য ও সালাতের মাধ্যমে সাহায্য প্রার্থনা করো। নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।',
                    ref: 'সূরা আল-বাকারা, আয়াত: ১৫৩',
                  },
                  {
                    source: 'সহীহ আল-বুখারী',
                    ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
                    bn: 'নিশ্চয়ই সকল কাজের ফলাফল নিয়তের ওপর নির্ভরশীল, আর প্রতিটি মানুষ কেবল তাই পাবে যা সে নিয়ত করেছে।',
                    ref: 'সহীহ আল-বুখারী, হাদিস: ১',
                  },
                  {
                    source: 'কুরআনুল কারীম',
                    ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
                    bn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
                    ref: 'সূরা আশ-শারহ, আয়াত: ৫-৬',
                  },
                  {
                    source: 'সহিহ মুসলিম · জুমার স্পেশাল',
                    ar: 'خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ',
                    bn: 'সূর্য উদিত হওয়া দিনগুলোর মধ্যে সর্বোত্তম দিন হলো জুমার দিন।',
                    ref: 'সহিহ মুসলিম, হাদিস: ৮৫৪',
                  },
                ].map((item) => (
                  <div
                    key={item.ref}
                    className="p-5 rounded-xl bg-[#0e0e12] border border-white/[0.08] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="text-[11px] text-emerald-400 font-semibold block">
                        {item.source}
                      </span>
                      <p dir="rtl" className="text-base font-arabic text-[#f2d77d] leading-relaxed">
                        {item.ar}
                      </p>
                      <p className="text-xs text-[#f5f3ee] leading-relaxed">“{item.bn}”</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs gap-2">
                      <span className="text-[#807a72] truncate">{item.ref}</span>
                      <button
                        type="button"
                        onClick={() => handleLoadLibraryItemToDemo(item)}
                        className="text-[#d4af37] hover:underline font-semibold inline-flex items-center gap-1 shrink-0"
                      >
                        <span>ডেমোতে লোড করুন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RBAC & SUPER ADMIN DEMO */}
          {activeTab === 'rbac' && (
            <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 sm:p-7 space-y-6">
              <div className="max-w-2xl">
                <span className="text-xs font-semibold text-[#d4af37]">ফিচার ০৪</span>
                <h3 className="text-lg sm:text-xl font-bold text-[#f5f3ee] mt-1">
                  রোল-বেসড অ্যাক্সেস কন্ট্রোল (RBAC) ও সুপার এডমিন
                </h3>
                <p className="text-xs text-[#b6b0a6] mt-1.5 leading-relaxed">
                  কনটেন্টের বিশুদ্ধতা ও প্ল্যাটফর্মের সুরক্ষা নিশ্চিত করতে তিন স্তরের ব্যবহারকারী কাঠামো রয়েছে:
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 p-1 bg-[#0e0e12] border border-white/[0.08] rounded-xl max-w-2xl">
                {[
                  { id: 'basic_user', label: '১. বেসিক (পেন্ডিং)' },
                  { id: 'approved_user', label: '২. অনুমোদিত ক্রিয়েটর' },
                  { id: 'super_admin', label: '৩. সুপার এডমিন' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSimulatedRole(r.id as any)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition min-h-[38px] whitespace-nowrap ${
                      simulatedRole === r.id
                        ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                        : 'text-[#807a72] hover:text-[#f5f3ee]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="p-5 rounded-xl bg-[#0e0e12] border border-white/[0.08] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#807a72]">সিমুলেটেড রোল:</span>
                    <span
                      className={`font-semibold ${
                        simulatedRole === 'super_admin'
                          ? 'text-[#f2d77d]'
                          : simulatedRole === 'approved_user'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {simulatedRole === 'super_admin'
                        ? 'Super Admin (realsafikul@gmail.com)'
                        : simulatedRole === 'approved_user'
                        ? 'Approved Creator'
                        : 'Basic User (Pending Approval)'}
                    </span>
                  </div>

                  <span className="text-xs text-[#807a72]">
                    স্ট্যাটাস:{' '}
                    <strong
                      className={
                        simulatedRole === 'basic_user' ? 'text-amber-400' : 'text-emerald-400'
                      }
                    >
                      {simulatedRole === 'basic_user' ? 'অনুমোদন অপেক্ষমাণ' : 'সক্রিয়'}
                    </strong>
                  </span>
                </div>

                {simulatedRole === 'basic_user' && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/25 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200 space-y-1">
                      <p className="font-semibold">এক্সেস কন্ট্রোল রেস্ট্রিকশন বার্তা:</p>
                      <p className="text-amber-200/80 leading-relaxed">
                        একাউন্ট অনুমোদনের আগে ব্যবহারকারী ডেমো ও হাদিস ব্রাউজ করতে পারবেন; পোস্টার এক্সপোর্ট ও ক্লাউড সেভের জন্য এডমিন অনুমোদন প্রয়োজন।
                      </p>
                    </div>
                  </div>
                )}

                {simulatedRole === 'approved_user' && (
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/25 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-200 space-y-1">
                      <p className="font-semibold">পূর্ণ ক্রিয়েটর সুবিধা সক্রিয়:</p>
                      <p className="text-emerald-200/80 leading-relaxed">
                        পোস্টার তৈরি, ক্লাউড প্রিসেট অটো-অ্যাপ্লাই, কাস্টম ব্র্যান্ডিং এবং এইচডি এক্সপোর্ট সক্ষম।
                      </p>
                    </div>
                  </div>
                )}

                {simulatedRole === 'super_admin' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-[#141419] border border-[#d4af37]/30 flex items-start gap-3">
                      <Crown className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
                      <div className="text-xs text-[#f2d77d] space-y-1">
                        <p className="font-semibold">
                          সুপার এডমিন কন্ট্রোল (realsafikul@gmail.com):
                        </p>
                        <p className="text-[#b6b0a6]">
                          নতুন আবেদনকারীদের তালিকা এবং বিকাশ পেমেন্ট স্ক্রিনশট দেখে ১-ক্লিকে অনুমোদন বা প্যাকেজ আপগ্রেড দিন।
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                      <div className="px-4 py-2.5 bg-[#141419] text-xs font-semibold text-[#f2d77d]">
                        ইউজার অনবোর্ডিং সিমুলেশন প্যানেল
                      </div>
                      {mockApprovalList.map((usr) => (
                        <div
                          key={usr.id}
                          className="px-4 py-3 flex items-center justify-between gap-3 text-xs border-t border-white/[0.08] bg-[#0e0e12]"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-[#f5f3ee] block truncate">
                              {usr.name}
                            </span>
                            <span className="text-[11px] text-[#807a72] block truncate">
                              {usr.email}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMockApprovalList((prev) =>
                                prev.map((item) =>
                                  item.id === usr.id
                                    ? {
                                        ...item,
                                        status: item.status === 'pending' ? 'active' : 'pending',
                                        role:
                                          item.status === 'pending'
                                            ? 'approved_user'
                                            : 'basic_user',
                                      }
                                    : item
                                )
                              );
                              showToast(`${usr.name}-এর স্ট্যাটাস আপডেট হয়েছে!`);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition shrink-0 min-h-[36px] ${
                              usr.status === 'pending'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                                : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {usr.status === 'pending' ? 'অনুমোদন দিন' : 'অনুমোদন বাতিল'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ────────────────────────────────────────────────────────── */}
        {/* SUBSCRIPTION & PRICING LIST */}
        {/* ────────────────────────────────────────────────────────── */}
        <section id="pricing-section" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-semibold text-[#d4af37]">
              প্রাইসিং ও মেম্বারশিপ প্ল্যান
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f5f3ee] mt-1">
              বিকাশ পেমেন্টে ১ মাসের পূর্ণ এক্সেস
            </h2>
            <p className="text-xs sm:text-sm text-[#807a72] mt-2 leading-relaxed">
              দৈনিক পোস্টার লিমিট, ফুল এইচডি এক্সপোর্ট এবং কাস্টম স্টাইল প্রিসেট আনলক করতে পছন্দের প্যাকেজ বেছে নিন
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 rounded-2xl flex flex-col justify-between space-y-6 transition ${
                  plan.recommended
                    ? 'bg-[#1b1b22] border-2 border-[#d4af37]'
                    : 'bg-[#141419] border border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#807a72]">{plan.nameEn}</span>
                    {plan.recommended && (
                      <span className="font-bold text-[#d4af37]">সবচেয়ে জনপ্রিয়</span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-[#f5f3ee] mt-1">{plan.name}</h3>
                  <div className="text-3xl font-bold text-[#f2d77d] mt-4 tabular-nums">
                    ৳ {toBengaliNumber(plan.price)}{' '}
                    <span className="text-xs font-normal text-[#807a72]">
                      {plan.price === 0 ? '/ আজীবন ফ্রি' : '/ ১ মাস মেয়াদ'}
                    </span>
                  </div>

                  <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] text-xs font-semibold text-emerald-400 flex items-center gap-2 tabular-nums">
                    <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                    <span>
                      {plan.dailyPosterLimit === -1
                        ? 'কোনো লিমিট নেই (আনলিমিটেড)'
                        : `প্রতিদিন ${toBengaliNumber(plan.dailyPosterLimit)} টি পোস্টার`}
                    </span>
                  </div>

                  <ul className="space-y-2.5 mt-5 text-xs text-[#b6b0a6]">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  {plan.id === 'free' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser) {
                          setCurrentView('dashboard');
                        } else {
                          setIsAuthModalOpen(true);
                        }
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/[0.08] text-xs font-semibold transition min-h-[44px]"
                    >
                      {currentUser ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'সাইন-আপ করে শুরু করুন'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUpgradePlan(plan.id as 'pro' | 'enterprise');
                        setIsPricingModalOpen(true);
                      }}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition min-h-[44px] ${
                        plan.recommended
                          ? 'bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e]'
                          : 'bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-[#d4af37]/30'
                      }`}
                    >
                      <Crown className="w-4 h-4" />
                      <span>
                        {plan.id === 'pro'
                          ? '১৯৯ টাকায় বিকাশ পেমেন্ট ও আপগ্রেড'
                          : '৪৯৯ টাকায় আনলিমিটেড প্যাক নিন'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* bKash Payment Info Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#141419] border border-[#d4af37]/30 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-950/70 border border-pink-500/30 flex items-center justify-center text-pink-300 font-bold text-sm shrink-0">
                বিকাশ
              </div>
              <div>
                <h4 className="font-bold text-[#f2d77d] text-sm flex flex-wrap items-center gap-2">
                  <span>বিকাশ পার্সোনাল সেন্ড মানি:</span>
                  <span className="font-mono tabular-nums text-pink-300">{BKASH_CONFIG.number}</span>
                  <span className="text-xs font-normal text-[#807a72]">· Send Money</span>
                </h4>
                <p className="text-[#b6b0a6] mt-1 leading-relaxed">
                  উক্ত নম্বরে সেন্ড মানি করে ট্রানজেকশন আইডি ও স্ক্রিনশট সাবমিট করলে এডমিন আপনার একাউন্ট ১ মাসের জন্য আপগ্রেড করে দেবেন।
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(BKASH_CONFIG.number);
                  showToast('বিকাশ নম্বর কপি হয়েছে: ' + BKASH_CONFIG.number);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-white/[0.08] font-semibold text-xs transition min-h-[42px]"
              >
                নম্বর কপি করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedUpgradePlan('pro');
                  setIsPricingModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition min-h-[42px]"
              >
                স্ক্রিনশট জমা দিন
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MINIMAL QUIET FOOTER */}
      {/* ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#0e0e12] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#807a72]">
          <div className="flex items-center gap-2.5">
            <img
              src={brand.logo || DEFAULT_LOGO}
              alt={brand.name || 'WAZ MEDIA'}
              className="w-5 h-5 object-contain"
            />
            <span className="font-semibold text-[#f5f3ee]">{brand.name || 'WAZ MEDIA'}</span>
            <span aria-hidden="true">·</span>
            <span>ইসলামিক সোশ্যাল মিডিয়া পোস্টার স্টুডিও</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => scrollToSection('posters-showcase')}
              className="hover:text-[#f5f3ee] transition"
            >
              কালেকশন
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pricing-section')}
              className="hover:text-[#f5f3ee] transition"
            >
              প্রাইসিং
            </button>
            <button
              type="button"
              onClick={() =>
                currentUser ? setCurrentView('dashboard') : setIsAuthModalOpen(true)
              }
              className="hover:text-[#f2d77d] transition"
            >
              {currentUser ? 'ড্যাশবোর্ড' : 'লগইন / সাইন-আপ'}
            </button>
            <span>সাপোর্ট: realsafikul@gmail.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
