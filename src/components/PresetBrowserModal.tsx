import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PosterPreset } from '../types';
import { THEME_PRESETS, ASPECT_RATIOS } from '../data/quotes';
import { toBengaliNumber } from '../utils/bengaliUtils';
import {
  Bookmark,
  Check,
  Trash2,
  Plus,
  Search,
  Sparkles,
  X,
  Layout,
  Type,
  Palette,
  RotateCcw,
  CheckCheck,
  ShieldCheck
} from 'lucide-react';

interface PresetBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSaveModal: () => void;
}

export const PresetBrowserModal: React.FC<PresetBrowserModalProps> = ({
  isOpen,
  onClose,
  onOpenSaveModal,
}) => {
  const { presets, activePresetId, applyPreset, deletePreset, resetPresetsToDefault, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'builtin'>('all');

  if (!isOpen) return null;

  const filteredPresets = presets.filter((p) => {
    if (activeTab === 'custom' && p.isBuiltIn) return false;
    if (activeTab === 'builtin' && !p.isBuiltIn) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      return matchName || matchCat || matchDesc;
    }
    return true;
  });

  const customCount = presets.filter((p) => !p.isBuiltIn).length;
  const builtinCount = presets.filter((p) => p.isBuiltIn).length;

  const handleApply = (preset: PosterPreset) => {
    applyPreset(preset.id);
    onClose();
  };

  const handleDelete = (preset: PosterPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`আপনি কি নিশ্চিত যে "${preset.name}" প্রিসেটটি মুছে ফেলতে চান?`)) {
      deletePreset(preset.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#17110c] border border-[#3d2a1c] rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#2d2117] flex items-center justify-between bg-[#140e0a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#17110c] flex items-center justify-center text-[#d4af37] border border-[#d4af37]/40 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#f4eee2] flex items-center gap-2">
                <span>পোস্টার ডিজাইন প্রিসেট ও টেমপ্লেট</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#2a1d13] text-[#d4af37] border border-[#44301d]">
                  {toBengaliNumber(presets.length)} টি
                </span>
              </h3>
              <p className="text-xs text-[#877461]">
                যে কোনো প্রিসেটে ক্লিক করলে বর্তমান বাণীর ওপর সম্পূর্ণ লেআউট, রঙ ও ফন্ট অটো-প্রয়োগ হবে
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSaveModal();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#281b10] hover:bg-[#382617] text-[#f7df94] border border-[#4d361c] text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden sm:inline">বর্তমান স্টাইল সেভ করুন</span>
              <span className="sm:hidden">সেভ প্রিসেট</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#241a12] text-[#877461] hover:text-[#f4eee2] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-[#231a12] bg-[#120e0a] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#877461]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রিসেটের নাম, সাইজ বা ক্যাটাগরি খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 bg-[#19110b] border border-[#2d2117] rounded-xl text-xs text-[#f4eee2] focus:border-[#d4af37] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'all'
                  ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                  : 'bg-[#1f1610] text-[#877461] hover:text-[#f4eee2]'
              }`}
            >
              সবগুলো ({toBengaliNumber(presets.length)})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'custom'
                  ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                  : 'bg-[#1f1610] text-[#877461] hover:text-[#f4eee2]'
              }`}
            >
              আমার সংরক্ষিত ({toBengaliNumber(customCount)})
            </button>
            <button
              onClick={() => setActiveTab('builtin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'builtin'
                  ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                  : 'bg-[#1f1610] text-[#877461] hover:text-[#f4eee2]'
              }`}
            >
              বিল্ট-ইন থিম ({toBengaliNumber(builtinCount)})
            </button>
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map((preset) => {
            const isCurrent = activePresetId === preset.id;
            const ratioObj = ASPECT_RATIOS.find((r) => r.id === preset.config.size);
            const themeObj = THEME_PRESETS.find((t) => t.id === preset.config.theme);

            return (
              <div
                key={preset.id}
                onClick={() => handleApply(preset)}
                className={`rounded-2xl border p-4 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl group relative overflow-hidden ${
                  isCurrent
                    ? 'bg-[#221811] border-[#d4af37] ring-1 ring-[#d4af37]/60 shadow-lg'
                    : 'bg-[#17110c] border-[#2d2117] hover:border-[#4d361c]'
                }`}
              >
                <div>
                  {/* Card Header Banner with Gradient preview */}
                  <div
                    className="h-14 rounded-xl p-2.5 flex items-center justify-between relative overflow-hidden mb-3 border border-white/5"
                    style={{ background: preset.previewGradient || themeObj?.previewBg || '#20160f' }}
                  >
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/50 text-[#f7df94] backdrop-blur-sm border border-white/10">
                      {preset.category || 'প্রিসেট'}
                    </span>
                    {preset.isBuiltIn ? (
                      <span className="text-[10px] text-[#baa791] bg-black/40 px-2 py-0.5 rounded">
                        স্ট্যান্ডার্ড
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/30">
                        কাস্টম
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-bold text-sm text-[#f4eee2] group-hover:text-[#f7df94] transition">
                      {preset.name}
                    </h4>
                    {isCurrent && (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#d4af37] text-black shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                        সক্রিয়
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#877461] line-clamp-2 leading-relaxed mb-3">
                    {preset.description || `${ratioObj?.label} • ${preset.config.font}`}
                  </p>

                  {/* Meta Specs Pills */}
                  <div className="grid grid-cols-2 gap-1.5 mb-3 text-[10px]">
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-[#1f1610] text-[#a9947c] border border-[#2b1f15] truncate">
                      <Layout className="w-3 h-3 text-[#d4af37] shrink-0" />
                      <span className="truncate">{ratioObj?.label || preset.config.size}</span>
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-[#1f1610] text-[#a9947c] border border-[#2b1f15] truncate">
                      <Type className="w-3 h-3 text-[#d4af37] shrink-0" />
                      <span className="truncate">{preset.config.font}</span>
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-[#1f1610] text-[#a9947c] border border-[#2b1f15] truncate">
                      <Palette className="w-3 h-3 text-[#d4af37] shrink-0" />
                      <span className="truncate">{themeObj?.name || preset.config.theme}</span>
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-[#1f1610] text-[#a9947c] border border-[#2b1f15] truncate">
                      <ShieldCheck className="w-3 h-3 text-[#d4af37] shrink-0" />
                      <span className="truncate">বর্ডার: {preset.config.borderStyle}</span>
                    </span>
                  </div>

                  {/* Color Swatch row */}
                  <div className="flex items-center justify-between text-[10px] text-[#7a6a58] pt-2 border-t border-[#231a12]">
                    <span>রঙ প্যালেট:</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: preset.config.textColor }}
                        title="টেক্সট রঙ"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: preset.config.accentColor }}
                        title="অ্যাকসেন্ট রঙ"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: preset.config.arabicColor }}
                        title="আরবি রঙ"
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#231a12]">
                  <button
                    onClick={() => handleApply(preset)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-98"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>প্রয়োগ করুন</span>
                  </button>

                  {!preset.isBuiltIn && (
                    <button
                      onClick={(e) => handleDelete(preset, e)}
                      className="p-2 rounded-xl bg-[#281313] hover:bg-[#381a1a] text-red-400 border border-red-900/40 text-xs transition"
                      title="প্রিসেটটি মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredPresets.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-[#877461]">
              <Bookmark className="w-8 h-8 opacity-40 mx-auto mb-2 text-[#d4af37]" />
              <p className="text-sm font-semibold text-[#baa791]">কোনো প্রিসেট মেলেনি</p>
              <p className="mt-1">অন্য কোনো শব্দ দিয়ে খুঁজুন অথবা ফিল্টার পরিবর্তন করুন।</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2d2117] bg-[#140e0a] flex items-center justify-between text-xs text-[#877461]">
          <button
            onClick={resetPresetsToDefault}
            className="flex items-center gap-1.5 text-[11px] text-[#baa791] hover:text-[#f7df94] transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ডিফল্ট প্রিসেট রিস্টোর করুন</span>
          </button>

          <span className="text-[11px]">
            বর্তমান স্টাইল সংরক্ষণ করতে <strong>"সেভ করুন"</strong> চাপুন
          </span>
        </div>
      </div>
    </div>
  );
};
