import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { renderPoster, generateThumbnail, downloadBlob } from '../utils/canvasRenderer';
import { THEME_PRESETS, ASPECT_RATIOS, INITIAL_QUOTES, CATEGORIES } from '../data/quotes';
import { AspectRatio, BorderStyle, PatternStyle, ThemeId, BrandPosition } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
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
  X
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
  } = useApp();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '100'>('fit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'theme' | 'format' | 'bg' | 'decor' | 'brand'>('text');
  const [copiedImg, setCopiedImg] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

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
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const ext = format === 'png' ? 'png' : 'jpg';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `waz-media-${poster.size}-${timestamp}.${ext}`;

      canvasRef.current.toBlob(
        (blob) => {
          if (blob) {
            downloadBlob(blob, filename);
            incrementStat('exports');
            showToast(`${ext.toUpperCase()} সফলভাবে ডাউনলোড হয়েছে`);
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
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCat, setPickerCat] = useState('সব');

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
            <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-[#2d2117] text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#241a12] text-[#d4af37] font-semibold border border-[#3f2f1d]">
                  {poster.size.replace('x', ' × ')}
                </span>
                <span className="text-[#877461] hidden sm:inline">
                  {ASPECT_RATIOS.find((r) => r.id === poster.size)?.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel((z) => (z === 'fit' ? '100' : 'fit'))}
                  className="px-2.5 py-1 rounded bg-[#241a12] hover:bg-[#322318] text-[#a9947c] border border-[#382a1d] transition"
                >
                  {zoomLevel === 'fit' ? '১০০% ভিউ' : 'স্ক্রিন ফিট'}
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

            {/* Quick Export Actions Bar below Canvas */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
              <button
                disabled={isExporting}
                onClick={() => handleDownload('png')}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow-md transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>PNG ডাউনলোড</span>
              </button>

              <button
                disabled={isExporting}
                onClick={() => handleDownload('jpeg')}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#241a12] hover:bg-[#322419] text-[#f7df94] font-medium text-xs border border-[#44301d] transition"
              >
                <Download className="w-4 h-4" />
                <span>JPG ডাউনলোড</span>
              </button>

              <button
                onClick={handleCopyImage}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#241a12] hover:bg-[#322419] text-[#e0d2bf] font-medium text-xs border border-[#382a1d] transition"
                title="সরাসরি সোশ্যাল মিডিয়ায় পেস্ট করতে"
              >
                {copiedImg ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                <span>{copiedImg ? 'ছবি কপি হয়েছে!' : 'ছবি কপি'}</span>
              </button>

              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#2d1f14] hover:bg-[#3d2a1c] text-[#f7df94] font-semibold text-xs border border-[#523a23] transition shadow"
              >
                <Save className="w-4 h-4 text-[#d4af37]" />
                <span>{activeEditingId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</span>
              </button>
            </div>

            <div className="w-full flex items-center justify-between text-xs text-[#877461] mt-3 px-1">
              <span>রেজোলিউশন: ১০৮০p আল্ট্রা-এইচডি (প্রিন্ট ও সোশ্যাল রেডি)</span>
              <button
                onClick={handleCopyCaption}
                className="text-[#d4af37] hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copiedCaption ? 'ক্যাপশন কপি হয়েছে' : 'ক্যাপশন টেক্সট কপি'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Controls Panel */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#17110c] border border-[#2d2117] rounded-2xl shadow-xl overflow-hidden sticky top-4">
          
          {/* Tabs navigation */}
          <div className="grid grid-cols-6 border-b border-[#2d2117] bg-[#140e0a]">
            {[
              { id: 'text', label: 'টেক্সট', icon: Type },
              { id: 'theme', label: 'থিম', icon: Palette },
              { id: 'format', label: 'লেআউট', icon: Layout },
              { id: 'bg', label: 'ব্যাকগ্রাউন্ড', icon: ImageIcon },
              { id: 'decor', label: 'সাজসজ্জা', icon: Sparkles },
              { id: 'brand', label: 'ব্র্যান্ডিং', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center py-3 text-[11px] font-medium transition ${
                    isActive
                      ? 'text-[#f7df94] border-b-2 border-[#d4af37] bg-[#1c140d]'
                      : 'text-[#877461] hover:text-[#d3c2ad] hover:bg-[#1a120b]'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{tab.label}</span>
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
          <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#2d2117] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-bold text-base text-[#f4eee2]">লাইব্রেরি থেকে বাণী নির্বাচন করুন</h3>
              </div>
              <button
                onClick={() => setShowQuotePicker(false)}
                className="p-1 rounded-lg hover:bg-[#241a12] text-[#877461] hover:text-[#f4eee2] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search */}
            <div className="p-4 border-b border-[#231a12] space-y-3 bg-[#140e0a]">
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
          </div>
        </div>
      )}
    </div>
  );
};
