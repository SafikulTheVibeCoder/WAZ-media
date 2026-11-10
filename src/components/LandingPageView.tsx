import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_PRESETS, DEFAULT_POSTER, DEFAULT_BRAND, DEFAULT_LOGO } from '../data/quotes';
import { BUILTIN_PRESETS } from '../data/presets';
import { renderPoster, downloadBlob } from '../utils/canvasRenderer';
import { ThemeConfig, PosterConfig, BrandConfig, PosterPreset, AspectRatio, BorderStyle } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import {
  Sparkles,
  Layers,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Download,
  Copy,
  Check,
  ChevronRight,
  Maximize2,
  Wand2,
  Bookmark,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
  PlusCircle,
  Palette,
  LayoutDashboard,
  Cloud,
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
    bgGradient: 'linear-gradient(135deg, #3d2b0e 0%, #17110c 100%)',
    textColor: '#f7df94',
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
    bgGradient: 'linear-gradient(135deg, #241a12 0%, #0d0a08 100%)',
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
    bgGradient: 'linear-gradient(135deg, #382718 0%, #1c130b 100%)',
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
    bgGradient: 'linear-gradient(135deg, #2b1f14 0%, #0d0a08 100%)',
    textColor: '#fcd34d',
  },
];

const DEMO_QUOTES = [
  {
    id: 'ash-sharh',
    title: 'কষ্টের সাথেই স্বস্তি (সূরা আশ-শারহ ৯৪:৫-৬)',
    bn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
    ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    ref: 'সূরা আশ-শারহ, আয়াত: ৫-৬',
    theme: 'golden' as const,
  },
  {
    id: 'baqarah-153',
    title: 'ধৈর্য ও সালাত (সূরা আল-বাকারা ২:১৫৩)',
    bn: 'হে ঈমানদারগণ! তোমরা ধৈর্য ও সালাতের মাধ্যমে সাহায্য প্রার্থনা করো। নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।',
    ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    ref: 'সূরা আল-বাকারা, আয়াত: ১৫৩',
    theme: 'emerald' as const,
  },
  {
    id: 'bukhari-1',
    title: 'নিয়তের গুরুত্ব (সহীহ আল-বুখারী ১)',
    bn: 'সকল কাজের ফলাফল নিয়তের ওপর নির্ভরশীল, আর প্রতিটি মানুষ কেবল তাই পাবে যা সে নিয়ত করেছে।',
    ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    ref: 'সহীহ আল-বুখারী, হাদিস: ১',
    theme: 'black' as const,
  },
  {
    id: 'rad-28',
    title: 'আল্লাহর স্মরণে প্রশান্তি (সূরা আর-রাদ ১৩:২৮)',
    bn: 'জেনে রেখো, আল্লাহর স্মরণেই অন্তরসমূহ প্রশান্ত হয়।',
    ar: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    ref: 'সূরা আর-রাদ, আয়াত: ২৮',
    theme: 'sapphire' as const,
  },
];

export const LandingPageView: React.FC = () => {
  const {
    currentUser,
    isSuperAdmin,
    isApproved,
    setIsAuthModalOpen,
    setCurrentView,
    setPoster,
    loadQuoteToPoster,
    showToast,
    triggerAccessGuard,
    brand,
  } = useApp();

  // Active navigation tab in demo showcase
  const [activeTab, setActiveTab] = useState<'poster' | 'presets' | 'library' | 'rbac'>('poster');

  // Interactive Live Demo Poster State
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
  const [simulatedRole, setSimulatedRole] = useState<'basic_user' | 'approved_user' | 'super_admin'>('basic_user');

  // Simulated presets list for Preset Saver Demo
  const [demoPresets, setDemoPresets] = useState<PosterPreset[]>(BUILTIN_PRESETS);
  const [customPresetName, setCustomPresetName] = useState('');
  const [mockApprovalList, setMockApprovalList] = useState([
    { id: '1', email: 'creator@example.com', name: 'আব্দুর রহমান', role: 'basic_user', status: 'pending' },
    { id: '2', email: 'media@wazpost.com', name: 'মুহাম্মদ শাকিল', role: 'approved_user', status: 'active' },
  ]);

  const demoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Demo brand configuration
  const demoBrand: BrandConfig = {
    ...DEFAULT_BRAND,
    name: brand.name || 'WAZ MEDIA',
    tagline: brand.tagline || 'INSPIRING FAITH, ILLUMINATING MINDS',
    handle: brand.handle || '@wazmedia.bd',
    logo: brand.logo || DEFAULT_LOGO,
    showLogo: true,
    showTag: true,
    showHandle: true,
    watermark: true,
    pos: 'top-center',
    logoSize: 105,
  };

  // Re-render the HTML5 canvas whenever demo state changes
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

  // Handle direct download of the demo poster
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

  // Copy full caption text
  const handleCopyDemoCaption = () => {
    const parts = [
      demoPoster.ar,
      `"${demoPoster.bn}"`,
      `— ${demoPoster.ref}`,
      `\n#WAZMEDIA #IslamicPoster #Hadith #Quran #Bangladesh`
    ].filter(Boolean);

    navigator.clipboard.writeText(parts.join('\n\n'));
    setDemoCopiedCaption(true);
    setTimeout(() => setDemoCopiedCaption(false), 2000);
    showToast('ডেমো ফেসবুক ক্যাপশন কপি হয়েছে!');
  };

  // Select quick demo quote
  const handleSelectDemoQuote = (index: number) => {
    const item = DEMO_QUOTES[index];
    if (!item) return;
    setActiveQuoteIndex(index);
    setDemoPoster((prev) => ({
      ...prev,
      bn: item.bn,
      ar: item.ar,
      ref: item.ref,
      theme: item.theme,
    }));
    showToast(`"${item.ref}" ডেমো ক্যানভাসে লোড হয়েছে!`);
  };

  // Customize a poster from the showcase gallery
  const handleCustomizeShowcasePoster = (item: (typeof FEATURED_POSTERS_SHOWCASE)[0]) => {
    setDemoPoster((prev) => ({
      ...prev,
      bn: item.bn,
      ar: item.ar,
      ref: item.ref,
      theme: item.theme,
      size: item.size,
      borderStyle: item.borderStyle,
    }));
    setActiveTab('poster');
    const demoElement = document.getElementById('interactive-demo');
    demoElement?.scrollIntoView({ behavior: 'smooth' });
    showToast(`"${item.title}" পোস্টারটি লাইভ ক্যানভাসে লোড হয়েছে!`);
  };

  // Apply a preset to the live demo
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

  // Simulate saving a new custom preset in the demo
  const handleSimulateSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPresetName.trim()) {
      showToast('দয়া করে প্রিসেটের একটি নাম লিখুন');
      return;
    }
    const newSimulated: PosterPreset = {
      id: `sim-preset-${Date.now()}`,
      name: customPresetName.trim(),
      description: `${demoPoster.theme} থিম • ${demoPoster.size} • ${demoPoster.borderStyle} বর্ডার`,
      category: 'কাস্টম প্রিসেট',
      createdAt: Date.now(),
      isBuiltIn: false,
      previewGradient: 'linear-gradient(135deg, #44301d 0%, #150f09 100%)',
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
    showToast(`"${newSimulated.name}" প্রিসেট সিমুলেশনে সফলভাবে সংরক্ষিত হয়েছে!`);
  };

  // Load a sample from Library tab into the live demo canvas
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

  // Transfer demo poster to actual authenticated Poster Studio
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

  const selectedThemeObj = THEME_PRESETS.find((t) => t.id === demoPoster.theme) || THEME_PRESETS[0];

  return (
    <div className="space-y-16 py-2 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* ────────────────────────────────────────────────────────── */}
      {/* TOP SAAS NAVBAR (FOR VISITORS & USERS) */}
      {/* ────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#140e0a]/90 backdrop-blur-md border border-[#2d2117] sticky top-2 z-40 shadow-xl">
        <div 
          onClick={() => setCurrentView(currentUser ? 'dashboard' : 'landing')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1d150e] border border-[#3b2a1a] flex items-center justify-center p-1.5 shadow-sm">
            <img src={brand.logo || DEFAULT_LOGO} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wider text-[#f7df94] block leading-tight">{brand.name || 'WAZ MEDIA'}</span>
            <span className="text-[10px] text-[#877461] tracking-wider uppercase block">Islamic Media Studio</span>
          </div>
        </div>

        {/* Quick section links */}
        <div className="hidden lg:flex items-center gap-6 text-xs text-[#baa791]">
          <button 
            onClick={() => document.getElementById('posters-showcase')?.scrollIntoView({ behavior: 'smooth' })} 
            className="hover:text-[#f7df94] transition"
          >
            পোস্টার কালেকশন
          </button>
          <button 
            onClick={() => {
              setActiveTab('poster');
              document.getElementById('interactive-demo')?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="hover:text-[#f7df94] transition"
          >
            লাইভ স্টুডিও ডেমো
          </button>
          <button 
            onClick={() => {
              setActiveTab('presets');
              document.getElementById('interactive-demo')?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="hover:text-[#f7df94] transition"
          >
            স্টাইল প্রিসেট
          </button>
          <button 
            onClick={() => {
              setActiveTab('library');
              document.getElementById('interactive-demo')?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="hover:text-[#f7df94] transition"
          >
            কুরআন ও হাদিস
          </button>
        </div>

        {/* Action Button: Sign Up / Sign In / Dashboard */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow-md transition active:scale-95"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="py-2 px-3 sm:px-4 rounded-xl bg-[#201710] hover:bg-[#2b1f16] text-[#baa791] hover:text-[#f4eee2] border border-[#38281b] text-xs font-semibold transition"
              >
                লগইন
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 py-2 px-3.5 sm:px-5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow-md transition active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>সাইন-আপ / শুরু করুন</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ────────────────────────────────────────────────────────── */}
      {/* HERO SECTION */}
      {/* ────────────────────────────────────────────────────────── */}
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
          সহীহ হাদিস ও কুরআনের আয়াত ব্রাউজ করুন, রয়্যাল ইসলামিক ক্যালিগ্রাফি স্টাইলে ১-ক্লিকে পোস্টার তৈরি করুন এবং যেকোনো সোশ্যাল মিডিয়ায় শেয়ার করুন। সাইন-আপ করেই আপনার ডেডিকেটেড ড্যাশবোর্ডে প্রবেশ করুন!
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8 max-w-md mx-auto">
          <button
            onClick={() => {
              if (currentUser) {
                setCurrentView('dashboard');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 py-3.5 px-7 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-sm shadow-xl transition active:scale-[0.98]"
          >
            <span>{currentUser ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'ফ্রি সাইন-আপ করুন (ড্যাশবোর্ড)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const showcaseEl = document.getElementById('posters-showcase');
              showcaseEl?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#201710] hover:bg-[#2b1f16] text-[#e0d2bf] border border-[#3b2a1a] font-semibold text-sm transition"
          >
            <Palette className="w-4 h-4 text-[#d4af37]" />
            <span>পোস্টার কালেকশন ও ডেমো</span>
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

      {/* ────────────────────────────────────────────────────────── */}
      {/* FEATURED POSTERS SHOWCASE SECTION */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="posters-showcase" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
              রেডি-টু-ইউজ টেমপ্লেট গ্যালারি
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f4eee2] mt-1">
              দৃষ্টিনন্দন ইসলামিক পোস্টার কালেকশন
            </h2>
            <p className="text-xs sm:text-sm text-[#877461] mt-1">
              যেকোনো পোস্টারে ক্লিক করে সরাসরি লাইভ ক্যানভাসে কাস্টমাইজ করুন এবং ১-ক্লিকে ডাউনলোড করুন
            </p>
          </div>

          <button
            onClick={() => {
              if (currentUser) {
                setCurrentView('dashboard');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className="text-xs text-[#f7df94] hover:underline flex items-center gap-1 font-semibold shrink-0"
          >
            <span>সকল টেমপ্লেট দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
          </button>
        </div>

        {/* 6 Featured Poster Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURED_POSTERS_SHOWCASE.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-[#17110c] border border-[#2d2117] hover:border-[#d4af37]/60 transition-all duration-300 shadow-xl flex flex-col justify-between group"
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#271d15] text-[#d4af37] border border-[#3f2f1d]">
                    {item.tag}
                  </span>
                  <span className="text-[10px] text-[#877461]">{item.size.replace('x', '×')}px</span>
                </div>

                {/* Poster Mockup Preview Card */}
                <div
                  className="rounded-2xl p-5 border border-[#3d2b1a] flex flex-col justify-between text-center min-h-[190px] shadow-inner mb-4 transition-transform group-hover:scale-[1.01]"
                  style={{ background: item.bgGradient }}
                >
                  <div className="text-[9px] tracking-widest text-[#d4af37] uppercase font-bold opacity-80">
                    WAZ MEDIA STUDIO
                  </div>

                  <div className="space-y-2 my-auto">
                    <p dir="rtl" className="font-arabic text-base sm:text-lg leading-relaxed text-[#f7df94]">
                      {item.ar}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-[#f4eee2] line-clamp-2 px-1">
                      "{item.bn}"
                    </p>
                  </div>

                  <div className="text-[10px] font-medium" style={{ color: item.textColor }}>
                    — {item.ref} —
                  </div>
                </div>

                <h3 className="font-bold text-sm text-[#f4eee2] group-hover:text-[#f7df94] transition">
                  {item.title}
                </h3>
                <p className="text-xs text-[#877461] mt-1 line-clamp-2">{item.bn}</p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleCustomizeShowcasePoster(item)}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#201710] hover:bg-[#2c1f15] border border-[#38281b] hover:border-[#d4af37] text-xs font-semibold text-[#f7df94] transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>এই পোস্টারটি কাস্টমাইজ করুন</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE DEMO SHOWCASE SECTION */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="interactive-demo" className="space-y-6 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
            ইন্টারেক্টিভ ডেমো স্যান্ডবক্স
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f4eee2] mt-1">
            সফটওয়্যারটির শক্তিশালী ফিচারসমূহ সরাসরি চালিয়ে দেখুন
          </h2>
          <p className="text-xs sm:text-sm text-[#877461] mt-2">
            অনুমোদনের আগেই ডেমো প্রিভিউতে দেখে নিন কিভাবে প্রতিটি মডিউল কাজ করে
          </p>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-[#140e0a] border border-[#2d2117] rounded-2xl max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab('poster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'poster'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow font-bold'
                : 'text-[#baa791] hover:text-[#f4eee2]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>১. লাইভ পোস্টার ইঞ্জিন</span>
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'presets'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow font-bold'
                : 'text-[#baa791] hover:text-[#f4eee2]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>২. স্টাইল প্রিসেট সেভার</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow font-bold'
                : 'text-[#baa791] hover:text-[#f4eee2]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>৩. কুরআন ও হাদিস ব্রাউজার</span>
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'rbac'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow font-bold'
                : 'text-[#baa791] hover:text-[#f4eee2]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>৪. রোল সিকিউরিটি ও এডমিন</span>
          </button>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 1: LIVE POSTER ENGINE DEMO */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'poster' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-[#17110c] border border-[#2d2117] rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Interactive Control Panel */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">ইন্টারেক্টিভ ইঞ্জিন</span>
                <h3 className="text-xl font-bold text-[#f4eee2] mt-1">তাৎক্ষণিক ক্যানভাস জেনারেটর</h3>
                <p className="text-xs text-[#9b8976] mt-1.5 leading-relaxed">
                  নিচের অপশনগুলো পরিবর্তন করুন। রয়্যাল মেহরাব বর্ডার, আরবি ক্যালিগ্রাফি এবং নিখুঁত বাংলা টাইপোগ্রাফি সরাসরি ডানপাশের ক্যানভাসে রেন্ডার হচ্ছে।
                </p>
              </div>

              {/* 1. Quick Quote Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#baa791] flex items-center justify-between">
                  <span>বাণী বা আয়াত নির্বাচন করুন:</span>
                  <span className="text-[10px] text-[#d4af37]">১-ক্লিক সুইচ</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_QUOTES.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => handleSelectDemoQuote(idx)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        activeQuoteIndex === idx
                          ? 'bg-[#2a1d13] border-[#d4af37] text-[#f7df94] shadow-sm'
                          : 'bg-[#120e0a] border-[#2d2117] text-[#877461] hover:border-[#44301d]'
                      }`}
                    >
                      <div className="font-semibold text-xs truncate">{q.title}</div>
                      <div className="text-[10px] opacity-70 truncate">{q.ref}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Text Toggle / Editor */}
              <div className="bg-[#120e0a] border border-[#2d2117] rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#baa791]">নিজের লেখা দিয়ে পরীক্ষা করবেন?</span>
                  <button
                    onClick={() => setShowCustomTextEditor(!showCustomTextEditor)}
                    className="text-xs text-[#d4af37] hover:underline font-semibold"
                  >
                    {showCustomTextEditor ? 'লুকান' : 'কাস্টম টেক্সট লিখুন'}
                  </button>
                </div>

                {showCustomTextEditor && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-[#261b12]">
                    <div>
                      <label className="text-[10px] text-[#877461] block mb-1">বাংলা বাণী:</label>
                      <textarea
                        rows={2}
                        value={demoPoster.bn}
                        onChange={(e) => setDemoPoster((prev) => ({ ...prev, bn: e.target.value }))}
                        className="w-full p-2 bg-[#17110c] border border-[#3b2a1a] rounded-lg text-xs text-[#f4eee2] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#877461] block mb-1">আরবি টেক্সট:</label>
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={demoPoster.ar}
                        onChange={(e) => setDemoPoster((prev) => ({ ...prev, ar: e.target.value }))}
                        className="w-full p-2 bg-[#17110c] border border-[#3b2a1a] rounded-lg text-xs text-[#f7df94] font-arabic outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#877461] block mb-1">রেফারেন্স:</label>
                      <input
                        type="text"
                        value={demoPoster.ref}
                        onChange={(e) => setDemoPoster((prev) => ({ ...prev, ref: e.target.value }))}
                        className="w-full p-2 bg-[#17110c] border border-[#3b2a1a] rounded-lg text-xs text-[#f4eee2] outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Theme Selector */}
              <div>
                <label className="text-xs font-semibold text-[#baa791] block mb-2">
                  লাইভ থিম ও কালার প্যালেট:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {THEME_PRESETS.map((t: ThemeConfig) => (
                    <button
                      key={t.id}
                      onClick={() => setDemoPoster((prev) => ({ ...prev, theme: t.id }))}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-medium transition ${
                        demoPoster.theme === t.id
                          ? 'bg-[#2a1d13] border-[#d4af37] text-[#f7df94] ring-1 ring-[#d4af37]'
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

              {/* 3. Aspect Ratio Selector (All 3 sizes) */}
              <div>
                <label className="text-xs font-semibold text-[#baa791] block mb-2">
                  সোশ্যাল মিডিয়া অনুপাত ও রেজোলিউশন:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDemoPoster((prev) => ({ ...prev, size: '1080x1080' }))}
                    className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition text-center ${
                      demoPoster.size === '1080x1080'
                        ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f7df94]'
                        : 'bg-[#120e0a] border-[#2d2117] text-[#877461]'
                    }`}
                  >
                    1:1 স্কয়ার (FB/Insta)
                  </button>
                  <button
                    onClick={() => setDemoPoster((prev) => ({ ...prev, size: '1080x1350' }))}
                    className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition text-center ${
                      demoPoster.size === '1080x1350'
                        ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f7df94]'
                        : 'bg-[#120e0a] border-[#2d2117] text-[#877461]'
                    }`}
                  >
                    4:5 পোর্ট্রেট (Feed)
                  </button>
                  <button
                    onClick={() => setDemoPoster((prev) => ({ ...prev, size: '1080x1920' }))}
                    className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition text-center ${
                      demoPoster.size === '1080x1920'
                        ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f7df94]'
                        : 'bg-[#120e0a] border-[#2d2117] text-[#877461]'
                    }`}
                  >
                    9:16 স্টোরি / রিলস
                  </button>
                </div>
              </div>

              {/* 4. Border Style Selector */}
              <div>
                <label className="text-xs font-semibold text-[#baa791] block mb-2">
                  ইসলামিক বর্ডার আর্ট:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'double', label: 'ডাবল গোল্ড' },
                    { id: 'arch', label: 'মেহরাব খিলান' },
                    { id: 'ornate', label: 'কারুকার্যময়' },
                    { id: 'simple', label: 'সিম্পল' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setDemoPoster((prev) => ({ ...prev, borderStyle: b.id as BorderStyle }))}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-medium border transition text-center ${
                        demoPoster.borderStyle === b.id
                          ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f7df94]'
                          : 'bg-[#120e0a] border-[#2d2117] text-[#877461]'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2.5">
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadDemoPoster}
                    disabled={isDemoDownloading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isDemoDownloading ? 'ডাউনলোড হচ্ছে...' : 'ডেমো পোস্টার ডাউনলোড (PNG)'}</span>
                  </button>

                  <button
                    onClick={handleCopyDemoCaption}
                    className="px-4 py-3 rounded-xl bg-[#201710] hover:bg-[#2b1f16] text-[#e0d2bf] border border-[#3b2a1a] text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    title="ফেসবুক পোস্ট ক্যাপশন কপি করুন"
                  >
                    {demoCopiedCaption ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                    <span>{demoCopiedCaption ? 'কপি হয়েছে' : 'ক্যাপশন কপি'}</span>
                  </button>
                </div>

                <button
                  onClick={handleTransferToStudio}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow-md transition active:scale-[0.98]"
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

            {/* Poster Canvas Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between mb-2 text-xs text-[#877461] px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>লাইভ ক্যানভাস রেন্ডারার • {demoPoster.size.replace('x', '×')}px</span>
                </span>
                <span className="text-[#d4af37] font-medium">নিখুঁত আরবি ও বাংলা ফন্ট</span>
              </div>

              <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-[#0f0b08] p-2 border border-[#332519] flex items-center justify-center">
                <canvas
                  ref={demoCanvasRef}
                  width={1080}
                  height={demoPoster.size === '1080x1080' ? 1080 : demoPoster.size === '1080x1350' ? 1350 : 1920}
                  className="w-full h-auto max-h-[540px] object-contain rounded-xl shadow-lg border border-[#3b2a1a]/60"
                />
              </div>

              <div className="mt-3 text-center text-[11px] text-[#786654]">
                <span>ক্যানভাসে জেনারেট হওয়া পোস্টারের হাই-রেজোলিউশন কোয়ালিটি সরাসরি প্রিভিউ হচ্ছে</span>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 2: PRESET SAVER DEMO */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'presets' && (
          <div className="bg-[#17110c] border border-[#2d2117] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="max-w-2xl">
                <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">ফিচার ২</span>
                <h3 className="text-xl font-bold text-[#f4eee2] mt-1">স্টাইল প্রিসেট সংরক্ষণ ও অটো-অ্যাপ্লাই সিস্টেম</h3>
                <p className="text-xs text-[#9b8976] mt-1.5 leading-relaxed">
                  আপনার পেজ বা ব্র্যান্ডের সিগনেচার স্টাইল (ফন্ট, সাইজ, মেহরাব বর্ডার, রঙ ও লোগোর অবস্থান) একবার প্রিসেট হিসেবে সেভ করুন। যেকোনো নতুন আয়াত বা হাদিসে ১-ক্লিকেই পুরো ফরম্যাট প্রয়োগ হয়ে যাবে।
                </p>
              </div>

              {/* Simulation Save Form */}
              <form
                onSubmit={handleSimulateSavePreset}
                className="bg-[#120e0a] border border-[#2d2117] rounded-2xl p-3.5 space-y-2 shrink-0 md:w-80"
              >
                <span className="text-xs font-semibold text-[#f7df94] block">টেস্ট প্রিসেট সেভ করুন:</span>
                <input
                  type="text"
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  placeholder="উদাঃ আমার পেইজের গোল্ডেন স্টাইল"
                  className="w-full px-3 py-1.5 bg-[#17110c] border border-[#3b2a1a] rounded-lg text-xs text-[#f4eee2] outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#d4af37] hover:bg-[#e6c878] text-[#140e0a] font-bold text-xs transition"
                >
                  প্রিসেট সংরক্ষণ টেস্ট করুন
                </button>
              </form>
            </div>

            {/* Presets Grid Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {demoPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-5 rounded-2xl bg-[#120e0a] border border-[#2d2117] hover:border-[#d4af37]/60 transition space-y-3 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#f7df94] truncate">{preset.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#f7df94] shrink-0">
                        {preset.category || 'প্রিসেট'}
                      </span>
                    </div>
                    <p className="text-xs text-[#877461] mt-1 line-clamp-2">{preset.description}</p>
                    
                    <div
                      className="h-20 rounded-xl border border-[#3b2a1a] flex items-center justify-center p-3 text-center text-xs font-semibold mt-3"
                      style={{ background: preset.previewGradient }}
                    >
                      <span className="text-[#f7df94] drop-shadow">{preset.name}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyPresetToDemo(preset)}
                    className="w-full py-2.5 rounded-xl bg-[#201710] hover:bg-[#2b1f16] border border-[#38281b] hover:border-[#d4af37] text-xs font-semibold text-[#f7df94] transition flex items-center justify-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>এই স্টাইলটি ডেমোতে প্রয়োগ করুন</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 3: QURAN & HADITH API BROWSER */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'library' && (
          <div className="bg-[#17110c] border border-[#2d2117] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="max-w-2xl">
                <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">ফিচার ৩</span>
                <h3 className="text-xl font-bold text-[#f4eee2] mt-1">সহীহ হাদিস ও পূর্ণাঙ্গ আল-কুরআন এপিআই ব্রাউজার</h3>
                <p className="text-xs text-[#9b8976] mt-1.5 leading-relaxed">
                  সহীহ বুখারী, মুসলিম এবং আল-কুরআনের পূর্ণাঙ্গ ১১৪টি সূরার আয়াত অনুসন্ধান করুন এবং ব্রাউজার থেকেই সরাসরি ১-ক্লিকে ডেমো বা স্টুডিওতে লোড করুন।
                </p>
              </div>

              <button
                onClick={() => setCurrentView('captions')}
                className="px-4 py-2.5 rounded-xl bg-[#241a12] border border-[#d4af37]/40 text-[#f7df94] text-xs font-bold hover:bg-[#322318] transition flex items-center gap-1.5 shrink-0"
              >
                <BookOpen className="w-4 h-4 text-[#d4af37]" />
                <span>সম্পূর্ণ লাইব্রেরিতে যান</span>
              </button>
            </div>

            {/* Sample Quran/Hadith Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="p-5 rounded-2xl bg-[#120e0a] border border-[#2d2117] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full font-bold">
                    কুরআনুল কারীম
                  </span>
                  <p dir="rtl" className="text-base font-arabic text-[#f7df94] leading-relaxed">
                    يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ
                  </p>
                  <p className="text-xs text-[#baa791]">
                    "হে ঈমানদারগণ! তোমরা ধৈর্য ও সালাতের মাধ্যমে সাহায্য প্রার্থনা করো। নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#261b12] text-xs">
                  <span className="text-[#877461]">সূরা আল-বাকারা, আয়াত: ১৫৩</span>
                  <button
                    onClick={() =>
                      handleLoadLibraryItemToDemo({
                        bn: 'হে ঈমানদারগণ! তোমরা ধৈর্য ও সালাতের মাধ্যমে সাহায্য প্রার্থনা করো। নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।',
                        ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
                        ref: 'সূরা আল-বাকারা, আয়াত: ১৫৩',
                      })
                    }
                    className="text-[#d4af37] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>ডেমোতে লোড করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-5 rounded-2xl bg-[#120e0a] border border-[#2d2117] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full font-bold">
                    সহীহ আল-বুখারী
                  </span>
                  <p dir="rtl" className="text-base font-arabic text-[#f7df94] leading-relaxed">
                    إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى
                  </p>
                  <p className="text-xs text-[#baa791]">
                    "নিশ্চয়ই সকল কাজের ফলাফল নিয়তের ওপর নির্ভরশীল, আর প্রতিটি মানুষ কেবল তাই পাবে যা সে নিয়ত করেছে।"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#261b12] text-xs">
                  <span className="text-[#877461]">সহীহ আল-বুখারী, হাদিস: ১</span>
                  <button
                    onClick={() =>
                      handleLoadLibraryItemToDemo({
                        bn: 'নিশ্চয়ই সকল কাজের ফলাফল নিয়তের ওপর নির্ভরশীল, আর প্রতিটি মানুষ কেবল তাই পাবে যা সে নিয়ত করেছে।',
                        ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
                        ref: 'সহীহ আল-বুখারী, হাদিস: ১',
                      })
                    }
                    className="text-[#d4af37] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>ডেমোতে লোড করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-5 rounded-2xl bg-[#120e0a] border border-[#2d2117] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full font-bold">
                    কুরআনুল কারীম
                  </span>
                  <p dir="rtl" className="text-base font-arabic text-[#f7df94] leading-relaxed">
                    فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا
                  </p>
                  <p className="text-xs text-[#baa791]">
                    "নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#261b12] text-xs">
                  <span className="text-[#877461]">সূরা আশ-শারহ, আয়াত: ৫-৬</span>
                  <button
                    onClick={() =>
                      handleLoadLibraryItemToDemo({
                        bn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
                        ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
                        ref: 'সূরা আশ-শারহ, আয়াত: ৫-৬',
                      })
                    }
                    className="text-[#d4af37] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>ডেমোতে লোড করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 4 */}
              <div className="p-5 rounded-2xl bg-[#120e0a] border border-[#2d2117] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full font-bold">
                    সহিহ মুসলিম (জুমার স্পেশাল)
                  </span>
                  <p dir="rtl" className="text-base font-arabic text-[#f7df94] leading-relaxed">
                    خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ
                  </p>
                  <p className="text-xs text-[#baa791]">
                    "সূর্য উদিত হওয়া দিনগুলোর মধ্যে সর্বোত্তম দিন হলো জুমার দিন।"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#261b12] text-xs">
                  <span className="text-[#877461]">সহিহ মুসলিম, হাদিস: ৮৫৪</span>
                  <button
                    onClick={() =>
                      handleLoadLibraryItemToDemo({
                        bn: 'সূর্য উদিত হওয়া দিনগুলোর মধ্যে সর্বোত্তম দিন হলো জুমার দিন।',
                        ar: 'خَيْرُ يَوْমٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ',
                        ref: 'সহিহ মুসলিম, হাদিস: ৮৫৪',
                      })
                    }
                    className="text-[#d4af37] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>ডেমোতে লোড করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 4: RBAC & SUPER ADMIN SECURITY DEMO */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'rbac' && (
          <div className="bg-[#17110c] border border-[#2d2117] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="max-w-2xl">
              <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">ফিচার ৪</span>
              <h3 className="text-xl font-bold text-[#f4eee2] mt-1">রোল-বেসড অ্যাক্সেস কন্ট্রোল (RBAC) ও সুপার এডমিন</h3>
              <p className="text-xs text-[#9b8976] mt-1.5 leading-relaxed">
                কনটেন্টের বিশুদ্ধতা ও প্ল্যাটফর্মের সুরক্ষা নিশ্চিত করতে তিন স্তরের ব্যবহারকারী কাঠামো রয়েছে। নিচের বাটনে ক্লিক করে প্রতিটি রোলের অভিজ্ঞতা পরীক্ষা করুন:
              </p>
            </div>

            {/* Interactive Role Simulator Selector */}
            <div className="flex flex-wrap gap-2 p-1 bg-[#120e0a] border border-[#2d2117] rounded-2xl max-w-xl">
              <button
                onClick={() => setSimulatedRole('basic_user')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                  simulatedRole === 'basic_user'
                    ? 'bg-amber-950/80 border border-amber-700 text-amber-300 shadow'
                    : 'text-[#877461] hover:text-[#baa791]'
                }`}
              >
                ১. বেসিক (পেন্ডিং অনবোর্ডিং)
              </button>
              <button
                onClick={() => setSimulatedRole('approved_user')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                  simulatedRole === 'approved_user'
                    ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300 shadow'
                    : 'text-[#877461] hover:text-[#baa791]'
                }`}
              >
                ২. অনুমোদিত ক্রিয়েটর
              </button>
              <button
                onClick={() => setSimulatedRole('super_admin')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                  simulatedRole === 'super_admin'
                    ? 'bg-[#2a1d13] border border-[#d4af37] text-[#f7df94] shadow'
                    : 'text-[#877461] hover:text-[#baa791]'
                }`}
              >
                ৩. সুপার এডমিন (Master)
              </button>
            </div>

            {/* Simulator Output View */}
            <div className="p-5 rounded-2xl bg-[#120e0a] border border-[#2d2117] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#261b12]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#877461]">সিমুলেটেড রোল ভিউ:</span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      simulatedRole === 'super_admin'
                        ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f7df94]'
                        : simulatedRole === 'approved_user'
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : 'bg-amber-950 border-amber-600 text-amber-300'
                    }`}
                  >
                    {simulatedRole === 'super_admin'
                      ? '👑 Super Admin (realsafikul@gmail.com)'
                      : simulatedRole === 'approved_user'
                      ? '✨ Approved Creator'
                      : '⏳ Basic User (Pending Approval)'}
                  </span>
                </div>

                <span className="text-[11px] text-[#877461]">
                  স্ট্যাটাস:{' '}
                  <strong className={simulatedRole === 'basic_user' ? 'text-amber-400' : 'text-emerald-400'}>
                    {simulatedRole === 'basic_user' ? 'অনুমোদন অপেক্ষমাণ' : 'সক্রিয়'}
                  </strong>
                </span>
              </div>

              {simulatedRole === 'basic_user' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200">
                      <p className="font-semibold">এক্সেস কন্ট্রোল রেস্ট্রিকশন বার্তা:</p>
                      <p className="mt-1 text-amber-300/80">
                        "আপনার একাউন্টটি এখনো সুপার এডমিন কর্তৃক অনুমোদিত হয়নি। আপনি ডেমো ও পাবলিক হাদিস ব্রাউজ করতে পারবেন, তবে পোস্টার এক্সপোর্ট ও সেভ করতে এডমিন অনুমোদনের প্রয়োজন।"
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-[#877461]">
                    ✓ কুরআন ও হাদিস ব্রাউজিং উন্মুক্ত • ✗ হাই-রেজোলিউশন স্টুডিও সেভিং লকড
                  </div>
                </div>
              )}

              {simulatedRole === 'approved_user' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-200">
                      <p className="font-semibold">পূর্ণ ক্রিয়েটর সুবিধা সক্রিয়:</p>
                      <p className="mt-1 text-emerald-300/80">
                        "আনলিমিটেড পোস্টার তৈরি, ক্লাউড প্রিসেট অটো-অ্যাপ্লাই, কাস্টম ব্র্যান্ডিং ও এইচডি এক্সপোর্ট সক্ষম।"
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-[#877461]">
                    ✓ সকল পোস্টার ফরম্যাট • ✓ ক্লাউড সিঙ্ক • ✓ এসইও ফেসবুক পোস্ট জেনারেটর
                  </div>
                </div>
              )}

              {simulatedRole === 'super_admin' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#241a12] border border-[#d4af37]/60 flex items-start gap-3">
                    <Crown className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#f7df94]">
                      <p className="font-semibold">সুপার এডমিন কন্ট্রোল এক্সেস (realsafikul@gmail.com):</p>
                      <p className="mt-1 text-[#e8dcbe]">
                        "নতুন আবেদনকারীদের তালিকা দেখুন এবং ১-ক্লিকেই তাদের ক্রিয়েটর হিসেবে অনুমোদন বা বাতিল করুন।"
                      </p>
                    </div>
                  </div>

                  {/* Mock Admin Table inside Demo */}
                  <div className="rounded-xl border border-[#2d2117] overflow-hidden">
                    <div className="px-3.5 py-2 bg-[#1a130d] text-[11px] font-bold text-[#f7df94]">
                      ইউজার অনবোর্ডিং সিমুলেশন প্যানেল
                    </div>
                    {mockApprovalList.map((usr) => (
                      <div
                        key={usr.id}
                        className="px-3.5 py-2.5 flex items-center justify-between text-xs border-t border-[#261b12] bg-[#140e0a]"
                      >
                        <div>
                          <span className="font-semibold text-[#f4eee2] block">{usr.name}</span>
                          <span className="text-[10px] text-[#877461]">{usr.email}</span>
                        </div>
                        <button
                          onClick={() => {
                            setMockApprovalList((prev) =>
                              prev.map((item) =>
                                item.id === usr.id
                                  ? {
                                      ...item,
                                      status: item.status === 'pending' ? 'active' : 'pending',
                                      role: item.status === 'pending' ? 'approved_user' : 'basic_user',
                                    }
                                  : item
                              )
                            );
                            showToast(`${usr.name}-এর স্ট্যাটাস আপডেট হয়েছে!`);
                          }}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition ${
                            usr.status === 'pending'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {usr.status === 'pending' ? 'অনুমোদন দিন' : 'অনুমোদন বাতিল করুন'}
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
      {/* SUBSCRIPTION / ACCESS TIERS PREVIEW */}
      {/* ────────────────────────────────────────────────────────── */}
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
              onClick={() => {
                if (currentUser) {
                  setCurrentView('dashboard');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#201710] hover:bg-[#2b1f16] text-[#baa791] hover:text-[#f4eee2] border border-[#38281b] text-xs font-semibold transition"
            >
              {currentUser ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'সাইন-ইন করুন'}
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
                if (currentUser) {
                  setCurrentView('dashboard');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow-md transition"
            >
              {currentUser ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'সাইন-আপ করে শুরু করুন'}
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
