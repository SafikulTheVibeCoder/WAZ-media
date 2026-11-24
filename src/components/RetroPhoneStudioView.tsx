import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { downloadBlob } from '../utils/canvasRenderer';
import {
  DEFAULT_RETRO_PHONE_CONFIG,
  RETRO_SCREEN_PRESETS,
  parseRetroPhoneConfigJson,
  renderRetroPhonePoster,
  serializeRetroPhoneConfig,
} from '../utils/retroPhoneRenderer';
import {
  RetroPhonePosterConfig,
  RetroPhoneSavedPreset,
  RetroScreenPresetId,
} from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import {
  Download,
  Copy,
  Check,
  RotateCcw,
  BookmarkPlus,
  Upload,
  FileJson,
  Maximize2,
  Minimize2,
  Smartphone,
  Trash2,
  FolderOpen,
  Sliders,
  X,
} from 'lucide-react';

const RETRO_ACTIVE_STORAGE_KEY = 'waz_retro_phone_config_v3';
const RETRO_PAGE_NAME_STORAGE_KEY = 'waz_retro_phone_custom_page_name_v1';
const RETRO_SAVED_PRESETS_KEY = 'waz_retro_phone_saved_presets_v1';

const QUICK_EMOJIS = ['🌙', '🤲', '❤️', '✨', '🤍', '📿', '🕌', '🌸'];

export const RetroPhoneStudioView: React.FC = () => {
  const { brand, showToast, incrementStat } = useApp();
  const brandPageName = (brand.name || '').trim() || (brand.handle || '').trim() || 'WAZ MEDIA';

  const [config, setConfig] = useState<RetroPhonePosterConfig>(() => {
    let customPageName: string | null = null;
    try {
      customPageName = localStorage.getItem(RETRO_PAGE_NAME_STORAGE_KEY);
    } catch {
      customPageName = null;
    }

    try {
      const saved = localStorage.getItem(RETRO_ACTIVE_STORAGE_KEY);
      if (saved) {
        const parsed = parseRetroPhoneConfigJson(saved);
        if (parsed) {
          return {
            ...parsed,
            bottomTag: customPageName !== null ? customPageName : (parsed.bottomTag || brandPageName),
          };
        }
      }
    } catch {
      // Fallback to clean default with user's branding name
    }
    return {
      ...DEFAULT_RETRO_PHONE_CONFIG,
      bottomTag: customPageName !== null ? customPageName : brandPageName,
    };
  });

  const [savedPresets, setSavedPresets] = useState<RetroPhoneSavedPreset[]>(() => {
    try {
      const raw = localStorage.getItem(RETRO_SAVED_PRESETS_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch {
      // Fallback empty
    }
    return [];
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [copiedImg, setCopiedImg] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(() =>
    serializeRetroPhoneConfig(DEFAULT_RETRO_PHONE_CONFIG)
  );
  const [showAdvancedDisplay, setShowAdvancedDisplay] = useState(false);

  // Persist current JSON config smoothly to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(RETRO_ACTIVE_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage quota errors
    }
    if (showJsonInspector) {
      setJsonDraft(serializeRetroPhoneConfig(config));
    }
  }, [config, showJsonInspector]);

  // Sync bottom-center branding dynamically with brand.name unless user set a custom override
  useEffect(() => {
    try {
      if (localStorage.getItem(RETRO_PAGE_NAME_STORAGE_KEY) === null) {
        setConfig((prev) =>
          prev.bottomTag === brandPageName ? prev : { ...prev, bottomTag: brandPageName }
        );
      }
    } catch {
      // Ignore storage read errors
    }
  }, [brandPageName]);

  useEffect(() => {
    try {
      localStorage.setItem(RETRO_SAVED_PRESETS_KEY, JSON.stringify(savedPresets));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedPresets]);

  // Live Canvas2D render whenever config changes
  useEffect(() => {
    let active = true;
    const draw = async () => {
      await document.fonts.ready;
      if (active && canvasRef.current) {
        await renderRetroPhonePoster(canvasRef.current, config);
      }
    };
    draw();
    return () => {
      active = false;
    };
  }, [config]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  const updateField = <K extends keyof RetroPhonePosterConfig>(
    key: K,
    value: RetroPhonePosterConfig[K]
  ) => {
    if (key === 'bottomTag') {
      try {
        localStorage.setItem(RETRO_PAGE_NAME_STORAGE_KEY, String(value));
      } catch {
        // Ignore storage quota errors
      }
    }
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleInsertEmoji = (emoji: string) => {
    const el = textAreaRef.current;
    if (!el) {
      updateField('text', `${config.text}${emoji}`);
      return;
    }
    const start = el.selectionStart ?? config.text.length;
    const end = el.selectionEnd ?? config.text.length;
    const next = config.text.slice(0, start) + emoji + config.text.slice(end);
    updateField('text', next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleDownloadPng = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      await renderRetroPhonePoster(canvasRef.current, config);
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const slug = (config.bottomTag || 'retro-phone')
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-+|-+$/g, '') || 'retro-phone';
          const filename = `retro-mobile-${slug}-${config.size}.png`;
          downloadBlob(blob, filename);
          incrementStat('exports');
          showToast(`হাই-রেজোলিউশন PNG (${filename}) ডাউনলোড হয়েছে`);
        } else {
          showToast('PNG তৈরি করতে সমস্যা হয়েছে');
        }
        setIsExporting(false);
      }, 'image/png');
    } catch {
      showToast('PNG ডাউনলোড ব্যর্থ হয়েছে');
      setIsExporting(false);
    }
  };

  const handleCopyPng = async () => {
    if (!canvasRef.current) return;
    try {
      await renderRetroPhonePoster(canvasRef.current, config);
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopiedImg(true);
          setTimeout(() => setCopiedImg(false), 2200);
          showToast('পোস্টার ছবি ক্লিপবোর্ডে কপি হয়েছে');
        } catch {
          showToast('সরাসরি ছবি কপি ব্রাউজারে সমর্থিত নয় — Download PNG ব্যবহার করুন');
        }
      }, 'image/png');
    } catch {
      showToast('ছবি কপি করা যায়নি');
    }
  };

  const handleReset = () => {
    try {
      localStorage.removeItem(RETRO_PAGE_NAME_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    const nextConfig: RetroPhonePosterConfig = {
      ...DEFAULT_RETRO_PHONE_CONFIG,
      bottomTag: brandPageName,
    };
    setConfig(nextConfig);
    setJsonDraft(serializeRetroPhoneConfig(nextConfig));
    showToast('ডিফল্ট অ্যাম্বার রেট্রো ফোন সেটিংস রিসেট হয়েছে');
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPresetName.trim();
    if (!trimmed) {
      showToast('প্রিসেট সেভ করতে একটি নাম দিন');
      return;
    }
    const preset: RetroPhoneSavedPreset = {
      id: `retro-${Date.now()}`,
      name: trimmed,
      createdAt: Date.now(),
      config: { ...config },
    };
    setSavedPresets((prev) => [preset, ...prev]);
    setNewPresetName('');
    showToast(`"${trimmed}" JSON প্রিসেট সংরক্ষিত হয়েছে`);
  };

  const handleLoadPreset = (preset: RetroPhoneSavedPreset) => {
    const validated = parseRetroPhoneConfigJson(JSON.stringify(preset.config));
    if (validated) {
      setConfig(validated);
      showToast(`"${preset.name}" লোড করা হয়েছে`);
    }
  };

  const handleDeletePreset = (id: string) => {
    setSavedPresets((prev) => prev.filter((p) => p.id !== id));
    showToast('সংরক্ষিত প্রিসেট মুছে ফেলা হয়েছে');
  };

  const handleDownloadJson = () => {
    const json = serializeRetroPhoneConfig(config);
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, 'retro-phone-poster-config.json');
    showToast('JSON কনফিগারেশন ফাইল ডাউনলোড হয়েছে');
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(serializeRetroPhoneConfig(config));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
      showToast('JSON কনফিগারেশন কপি হয়েছে');
    } catch {
      showToast('JSON কপি করা যায়নি');
    }
  };

  const handleUploadJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string') {
        const parsed = parseRetroPhoneConfigJson(content);
        if (parsed) {
          setConfig(parsed);
          setJsonDraft(serializeRetroPhoneConfig(parsed));
          showToast('JSON ফাইল থেকে সেটিংস লোড হয়েছে');
        } else {
          showToast('সঠিক JSON কনফিগারেশন ফাইল নির্বাচন করুন');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleApplyJsonDraft = () => {
    const parsed = parseRetroPhoneConfigJson(jsonDraft);
    if (!parsed) {
      showToast('JSON ফরম্যাটে ত্রুটি রয়েছে, অনুগ্রহ করে যাচাই করুন');
      return;
    }
    setConfig(parsed);
    showToast('কাস্টম JSON সেটিংস ক্যানভাসে প্রয়োগ হয়েছে');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Header
        title="রেট্রো ফিচার ফোন পোস্টার জেনারেটর"
        subtitle="পুরনো কিপ্যাড মোবাইলের উষ্ণ অ্যাম্বার-হলুদ স্ক্রিনে বাংলা, আরবি, ইংরেজি ও ইমোজি বাণীসহ সোশ্যাল পোস্টার তৈরি করুন।"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#b6b0a6] hover:text-[#f5f3ee] border border-white/[0.08] text-xs font-medium transition min-h-[40px] whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F7B500] hover:bg-[#FFA800] text-[#111111] font-bold text-xs transition min-h-[40px] whitespace-nowrap disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Stage: Live Pure Black Preview Canvas */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
          <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Stage Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08] text-xs">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-[#F7B500] shrink-0" />
                <span className="font-semibold text-[#f5f3ee]">লাইভ প্রিভিউ</span>
                <span aria-hidden="true" className="text-[#807a72]">
                  ·
                </span>
                <span className="font-mono tabular-nums text-[#b6b0a6]">
                  {config.size.replace('x', ' × ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg bg-[#0e0e12] p-0.5 border border-white/[0.08]">
                  {(['1080x1080', '1080x1350'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => updateField('size', sz)}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition whitespace-nowrap ${
                        config.size === sz
                          ? 'bg-[#F7B500] text-[#111111]'
                          : 'text-[#807a72] hover:text-[#f5f3ee]'
                      }`}
                    >
                      {sz === '1080x1080' ? '১:১ স্কয়ার' : '৪:৫ পোর্ট্রেট'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  aria-label="ফুলস্ক্রিন প্রিভিউ"
                  title="ফুলস্ক্রিন প্রিভিউ"
                  className="w-9 h-9 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#b6b0a6] hover:text-[#f5f3ee] border border-white/[0.08] flex items-center justify-center transition shrink-0"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas Container — pure #000000 backdrop */}
            <div className="w-full rounded-xl bg-[#000000] p-2 sm:p-4 flex items-center justify-center overflow-hidden border border-white/[0.06]">
              <canvas
                ref={canvasRef}
                className="block max-w-full h-auto object-contain max-h-[64vh]"
              />
            </div>

            {/* Primary Export Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadPng}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F7B500] hover:bg-[#FFA800] text-[#111111] font-bold text-sm transition active:scale-[0.98] min-h-[46px] disabled:opacity-60"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{isExporting ? 'তৈরি হচ্ছে...' : 'Download PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPng}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/[0.08] font-semibold text-sm transition min-h-[46px]"
              >
                {copiedImg ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-[#F7B500] shrink-0" />
                )}
                <span>{copiedImg ? 'ছবি কপি হয়েছে' : 'ছবি কপি করুন'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Inputs, Screen Brightness/Glow & JSON Config Manager */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-5">
          {/* Core Text & Identity Inputs */}
          <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="retro-main-text"
                  className="text-xs font-semibold text-[#f5f3ee]"
                >
                  মূল পোস্টার টেক্সট (বাংলা, আরবি, ইংরেজি ও ইমোজি)
                </label>
                <span className="text-[11px] text-[#807a72] tabular-nums">
                  {toBengaliNumber(config.text.length)} অক্ষর
                </span>
              </div>
              <textarea
                id="retro-main-text"
                ref={textAreaRef}
                rows={4}
                value={config.text}
                onChange={(e) => updateField('text', e.target.value)}
                placeholder="আপনার বাংলা, আরবি, ইংরেজি লেখা ও ইমোজি হুবহু লিখুন..."
                className="w-full p-3.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-sm text-[#f5f3ee] placeholder:text-[#807a72] focus:border-[#F7B500] focus:outline-none resize-y leading-relaxed"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-[#807a72]">
                  প্রদত্ত লেখা হুবহু রাখা হয়; প্রয়োজনে দ্রুত ইমোজি যোগ করুন:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => handleInsertEmoji(em)}
                      className="w-7 h-7 rounded-lg bg-[#0e0e12] hover:bg-[#1b1b22] border border-white/[0.08] text-sm flex items-center justify-center transition"
                      title={`${em} যোগ করুন`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="retro-top-time" className="text-xs font-semibold text-[#b6b0a6] block">
                  উপরের সময় (Top Time)
                </label>
                <input
                  id="retro-top-time"
                  type="text"
                  value={config.time}
                  onChange={(e) => updateField('time', e.target.value)}
                  placeholder="10:34"
                  className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-sm font-mono tabular-nums text-[#f5f3ee] placeholder:text-[#807a72] focus:border-[#F7B500] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="retro-bottom-tag"
                  className="text-xs font-semibold text-[#b6b0a6] block"
                >
                  পেজের নাম (Page Name)
                </label>
                <div className="relative">
                  <input
                    id="retro-bottom-tag"
                    type="text"
                    value={config.bottomTag}
                    onChange={(e) => updateField('bottomTag', e.target.value)}
                    placeholder="আপনার পেজ বা ব্র্যান্ডের নাম..."
                    className="w-full px-3.5 py-2.5 pr-9 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-sm text-[#f5f3ee] placeholder:text-[#807a72] focus:border-[#F7B500] focus:outline-none"
                  />
                  {config.bottomTag && (
                    <button
                      type="button"
                      onClick={() => updateField('bottomTag', '')}
                      aria-label="পেজের নাম মুছুন"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#807a72] hover:text-[#f5f3ee] p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Screen Tone, Brightness & Glow */}
          <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#f5f3ee]">
                স্ক্রিনের রঙ ও আলো (Amber Display)
              </span>
              <button
                type="button"
                onClick={() => setShowAdvancedDisplay((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs text-[#F7B500] hover:underline font-medium"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showAdvancedDisplay ? 'সংক্ষিপ্ত করুন' : 'ফন্ট ও আইকন'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(RETRO_SCREEN_PRESETS) as RetroScreenPresetId[]).map((presetKey) => {
                const p = RETRO_SCREEN_PRESETS[presetKey];
                const isActive = config.screenPreset === presetKey;
                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => updateField('screenPreset', presetKey)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 min-h-[44px] ${
                      isActive
                        ? 'bg-[#1b1b22] border-[#F7B500] text-[#f5f3ee]'
                        : 'bg-[#0e0e12] border-white/[0.08] text-[#b6b0a6] hover:border-white/20'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-md border border-black/30 shrink-0"
                      style={{
                        background: `radial-gradient(circle, ${p.centerHex} 0%, ${p.midHex} 70%, ${p.edgeHex} 100%)`,
                      }}
                    />
                    <span className="text-xs font-medium truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between text-xs text-[#b6b0a6] mb-1.5">
                  <span>স্ক্রিন ব্রাইটনেস</span>
                  <span className="font-mono tabular-nums text-[#F7B500] font-semibold">
                    {toBengaliNumber(Math.round(config.screenBrightness * 100))}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.02"
                  value={config.screenBrightness}
                  onChange={(e) => updateField('screenBrightness', Number(e.target.value))}
                  className="w-full accent-[#F7B500] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#b6b0a6] mb-1.5">
                  <span>ব্যাকলাইট গ্লো (Glow)</span>
                  <span className="font-mono tabular-nums text-[#F7B500] font-semibold">
                    {toBengaliNumber(Math.round(config.screenGlow * 100))}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.screenGlow}
                  onChange={(e) => updateField('screenGlow', Number(e.target.value))}
                  className="w-full accent-[#F7B500] cursor-pointer"
                />
              </div>
            </div>

            {showAdvancedDisplay && (
              <div className="pt-3 border-t border-white/[0.08] space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-[#807a72] block mb-1">বাংলা ফন্ট</label>
                    <select
                      value={config.bengaliFont}
                      onChange={(e) =>
                        updateField(
                          'bengaliFont',
                          e.target.value as RetroPhonePosterConfig['bengaliFont']
                        )
                      }
                      className="w-full px-3 py-2 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-xs text-[#f5f3ee] focus:border-[#F7B500] outline-none"
                    >
                      <option value="Noto Sans Bengali">Noto Sans Bengali</option>
                      <option value="Hind Siliguri">Hind Siliguri</option>
                      <option value="Anek Bangla">Anek Bangla</option>
                      <option value="Noto Serif Bengali">Noto Serif Bengali</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#807a72] block mb-1">আরবি ফন্ট (RTL)</label>
                    <select
                      value={config.arabicFont}
                      onChange={(e) =>
                        updateField(
                          'arabicFont',
                          e.target.value as RetroPhonePosterConfig['arabicFont']
                        )
                      }
                      className="w-full px-3 py-2 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-xs text-[#f5f3ee] focus:border-[#F7B500] outline-none"
                    >
                      <option value="Amiri">Amiri (Classical Naskh)</option>
                      <option value="Noto Naskh Arabic">Noto Naskh Arabic</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#807a72] block mb-1">
                      UI / English ফন্ট
                    </label>
                    <select
                      value={config.uiFont}
                      onChange={(e) =>
                        updateField('uiFont', e.target.value as RetroPhonePosterConfig['uiFont'])
                      }
                      className="w-full px-3 py-2 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-xs text-[#f5f3ee] focus:border-[#F7B500] outline-none"
                    >
                      <option value="Barlow Condensed">Barlow Condensed (Retro Bold)</option>
                      <option value="Archivo">Archivo (Crisp Sans)</option>
                      <option value="Noto Sans Bengali">Noto Sans Bengali</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs text-[#b6b0a6] mb-1">
                      <span>সর্বোচ্চ ফন্ট সাইজ</span>
                      <span className="font-mono tabular-nums text-[#F7B500]">
                        {toBengaliNumber(config.fontSize)}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="28"
                      max="64"
                      step="2"
                      value={config.fontSize}
                      onChange={(e) => updateField('fontSize', Number(e.target.value))}
                      className="w-full accent-[#F7B500] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-[#b6b0a6] mb-1">
                      <span>সিগন্যাল / ব্যাটারি</span>
                      <span className="font-mono tabular-nums text-[#F7B500]">
                        {config.signalLevel}/{config.batteryLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={config.signalLevel}
                        onChange={(e) => updateField('signalLevel', Number(e.target.value))}
                        className="w-full accent-[#F7B500] cursor-pointer"
                        title="Signal bars"
                      />
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={config.batteryLevel}
                        onChange={(e) => updateField('batteryLevel', Number(e.target.value))}
                        className="w-full accent-[#F7B500] cursor-pointer"
                        title="Battery level"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-[#b6b0a6] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showEnvelope}
                      onChange={(e) => updateField('showEnvelope', e.target.checked)}
                      className="rounded border-white/20 accent-[#F7B500]"
                    />
                    <span>টপ বারে মেসেজ আইকন দেখান</span>
                  </label>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#807a72]">সফট-কি:</span>
                    <input
                      type="text"
                      value={config.leftSoftKey}
                      onChange={(e) => updateField('leftSoftKey', e.target.value)}
                      className="w-16 px-2 py-1 rounded-lg bg-[#0e0e12] border border-white/[0.08] text-xs text-[#f5f3ee]"
                    />
                    <input
                      type="text"
                      value={config.rightSoftKey}
                      onChange={(e) => updateField('rightSoftKey', e.target.value)}
                      className="w-16 px-2 py-1 rounded-lg bg-[#0e0e12] border border-white/[0.08] text-xs text-[#f5f3ee]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reusable JSON Configuration (Save / Load / Reset) */}
          <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-[#F7B500] shrink-0" />
                <span className="text-xs font-semibold text-[#f5f3ee]">
                  JSON সেটিংস সেভ ও লোড
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setJsonDraft(serializeRetroPhoneConfig(config));
                  setShowJsonInspector((v) => !v);
                }}
                className="text-xs text-[#F7B500] hover:underline font-medium"
              >
                {showJsonInspector ? 'JSON লুকান' : 'JSON দেখুন / এডিট করুন'}
              </button>
            </div>

            {/* Save Current State as Named Preset */}
            <form onSubmit={handleSavePreset} className="flex gap-2">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="প্রিসেটের নাম লিখুন..."
                className="flex-1 min-w-0 px-3 py-2 bg-[#0e0e12] border border-white/[0.08] rounded-xl text-xs text-[#f5f3ee] placeholder:text-[#807a72] focus:border-[#F7B500] outline-none min-h-[40px]"
              />
              <button
                type="submit"
                aria-label="প্রিসেট সেভ করুন"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#F7B500] border border-[#F7B500]/30 text-xs font-semibold transition shrink-0 min-h-[40px]"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>সেভ</span>
              </button>
            </form>

            {/* Saved Presets List */}
            {savedPresets.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {savedPresets.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#0e0e12] border border-white/[0.06] text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadPreset(p)}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left text-[#f5f3ee] hover:text-[#F7B500] transition"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#F7B500] shrink-0" />
                      <span className="truncate font-medium">{p.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(p.id)}
                      aria-label={`${p.name} মুছুন`}
                      className="text-[#807a72] hover:text-rose-400 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* JSON Import / Export / Copy / Reset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="py-2 px-2.5 rounded-xl bg-[#0e0e12] hover:bg-[#1b1b22] border border-white/[0.08] text-xs text-[#b6b0a6] hover:text-[#f5f3ee] transition flex items-center justify-center gap-1.5 min-h-[38px]"
              >
                <Download className="w-3.5 h-3.5 text-[#F7B500]" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-2.5 rounded-xl bg-[#0e0e12] hover:bg-[#1b1b22] border border-white/[0.08] text-xs text-[#b6b0a6] hover:text-[#f5f3ee] transition flex items-center justify-center gap-1.5 min-h-[38px]"
              >
                <Upload className="w-3.5 h-3.5 text-[#F7B500]" />
                <span>Load JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleUploadJsonFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleCopyJson}
                className="py-2 px-2.5 rounded-xl bg-[#0e0e12] hover:bg-[#1b1b22] border border-white/[0.08] text-xs text-[#b6b0a6] hover:text-[#f5f3ee] transition flex items-center justify-center gap-1.5 min-h-[38px]"
              >
                {copiedJson ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#F7B500]" />
                )}
                <span>{copiedJson ? 'কপি!' : 'Copy JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-2.5 rounded-xl bg-[#0e0e12] hover:bg-[#1b1b22] border border-white/[0.08] text-xs text-[#b6b0a6] hover:text-[#f5f3ee] transition flex items-center justify-center gap-1.5 min-h-[38px]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#F7B500]" />
                <span>Reset</span>
              </button>
            </div>

            {showJsonInspector && (
              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <textarea
                  rows={8}
                  value={jsonDraft}
                  onChange={(e) => setJsonDraft(e.target.value)}
                  spellCheck={false}
                  className="w-full p-3 rounded-xl bg-[#0b0b0e] border border-white/[0.08] font-mono text-[11px] text-[#f2d77d] focus:border-[#F7B500] outline-none resize-y"
                />
                <button
                  type="button"
                  onClick={handleApplyJsonDraft}
                  className="w-full py-2 px-3 rounded-xl bg-[#F7B500] hover:bg-[#FFA800] text-[#111111] font-bold text-xs transition min-h-[38px]"
                >
                  JSON কনফিগ প্রয়োগ করুন
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Lightbox */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="রেট্রো ফোন ফুলস্ক্রিন প্রিভিউ"
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
        >
          <div
            className="absolute top-4 right-4 flex items-center gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7B500] hover:bg-[#FFA800] text-[#111111] font-bold text-xs min-h-[40px]"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              aria-label="বন্ধ করুন"
              className="w-10 h-10 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] border border-white/15 text-[#f5f3ee] flex items-center justify-center transition"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[86vh] flex items-center justify-center"
          >
            <img
              src={canvasRef.current?.toDataURL('image/png') || ''}
              alt="Retro Feature Phone Poster Preview"
              className="max-h-[84vh] w-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
