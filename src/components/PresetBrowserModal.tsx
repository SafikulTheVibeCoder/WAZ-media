import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PosterPreset } from '../types';
import { THEME_PRESETS, ASPECT_RATIOS } from '../data/quotes';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { ModalShell } from './ui/ModalShell';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { EmptyState } from './ui/EmptyState';
import {
  Bookmark,
  Check,
  Trash2,
  Plus,
  Search,
  Sparkles,
  RotateCcw,
  CheckCheck,
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
  const { presets, activePresetId, applyPreset, deletePreset, resetPresetsToDefault } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'builtin'>('all');
  const [presetToDelete, setPresetToDelete] = useState<PosterPreset | null>(null);

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

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        title={`পোস্টার ডিজাইন প্রিসেট (${toBengaliNumber(presets.length)}টি)`}
        subtitle="যে কোনো প্রিসেটে ক্লিক করলে বর্তমান বাণীর ওপর সম্পূর্ণ স্টাইল অটো-প্রয়োগ হবে"
        icon={<Sparkles className="w-5 h-5" />}
        maxWidthClass="max-w-4xl"
        headerActions={
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSaveModal();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#24242d] text-[#f2d77d] border border-white/10 text-xs font-semibold transition min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden sm:inline">স্টাইল সেভ করুন</span>
            <span className="sm:hidden">সেভ</span>
          </button>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#807a72]">
            <button
              type="button"
              onClick={resetPresetsToDefault}
              className="inline-flex items-center gap-1.5 text-xs text-[#b6b0a6] hover:text-[#f2d77d] transition min-h-[36px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ডিফল্ট প্রিসেট রিস্টোর করুন</span>
            </button>
            <span>নতুন স্টাইল যোগ করতে "স্টাইল সেভ করুন" চাপুন</span>
          </div>
        }
      >
        <div className="flex flex-col">
          {/* Search & Tabs */}
          <div className="p-4 border-b border-white/[0.08] bg-[#0e0e12] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between sticky top-0 z-10">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#807a72]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="প্রিসেটের নাম বা সাইজ খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 bg-[#141419] border border-white/10 rounded-xl text-xs text-[#f5f3ee] focus:border-[#d4af37] outline-none min-h-[40px]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition tabular-nums min-h-[38px] ${
                  activeTab === 'all'
                    ? 'bg-[#d4af37] text-[#0b0b0e]'
                    : 'bg-[#141419] text-[#b6b0a6] hover:text-[#f5f3ee]'
                }`}
              >
                সব ({toBengaliNumber(presets.length)})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition tabular-nums min-h-[38px] ${
                  activeTab === 'custom'
                    ? 'bg-[#d4af37] text-[#0b0b0e]'
                    : 'bg-[#141419] text-[#b6b0a6] hover:text-[#f5f3ee]'
                }`}
              >
                আমার সেভ ({toBengaliNumber(customCount)})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('builtin')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition tabular-nums min-h-[38px] ${
                  activeTab === 'builtin'
                    ? 'bg-[#d4af37] text-[#0b0b0e]'
                    : 'bg-[#141419] text-[#b6b0a6] hover:text-[#f5f3ee]'
                }`}
              >
                বিল্ট-ইন ({toBengaliNumber(builtinCount)})
              </button>
            </div>
          </div>

          {/* Presets Grid */}
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => {
              const isCurrent = activePresetId === preset.id;
              const ratioObj = ASPECT_RATIOS.find((r) => r.id === preset.config.size);
              const themeObj = THEME_PRESETS.find((t) => t.id === preset.config.theme);

              return (
                <div
                  key={preset.id}
                  onClick={() => handleApply(preset)}
                  className={`rounded-xl border p-4 flex flex-col justify-between cursor-pointer transition group ${
                    isCurrent
                      ? 'bg-[#1b1b22] border-[#d4af37]'
                      : 'bg-[#0e0e12] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div>
                    <div
                      className="h-12 rounded-lg px-3 flex items-center justify-between mb-3 border border-white/[0.08]"
                      style={{
                        background: preset.previewGradient || themeObj?.previewBg || '#1b1b22',
                      }}
                    >
                      <span className="text-[11px] font-semibold text-[#f2d77d]">
                        {preset.category || 'প্রিসেট'}
                      </span>
                      <span className="text-[11px] text-[#b6b0a6]">
                        {preset.isBuiltIn ? 'বিল্ট-ইন' : 'কাস্টম'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-sm text-[#f5f3ee] group-hover:text-[#f2d77d] transition">
                        {preset.name}
                      </h4>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#d4af37] shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          সক্রিয়
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#807a72] line-clamp-2 leading-relaxed mb-3">
                      {preset.description || `${ratioObj?.label} · ${preset.config.font}`}
                    </p>

                    <div className="text-[11px] text-[#b6b0a6] flex flex-wrap items-center gap-x-2 gap-y-1 pb-3 border-b border-white/[0.06]">
                      <span>{ratioObj?.label || preset.config.size}</span>
                      <span className="text-[#807a72]">·</span>
                      <span>{preset.config.font}</span>
                      <span className="text-[#807a72]">·</span>
                      <span>{themeObj?.name || preset.config.theme}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(preset);
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs flex items-center justify-center gap-1.5 transition min-h-[38px]"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>প্রয়োগ করুন</span>
                    </button>

                    {!preset.isBuiltIn && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPresetToDelete(preset);
                        }}
                        aria-label={`${preset.name} মুছুন`}
                        className="w-10 h-10 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredPresets.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={<Bookmark className="w-6 h-6" />}
                  title="কোনো প্রিসেট মেলেনি"
                  description="অন্য কোনো শব্দ দিয়ে খুঁজুন অথবা ফিল্টার পরিবর্তন করুন।"
                />
              </div>
            )}
          </div>
        </div>
      </ModalShell>

      <ConfirmDialog
        isOpen={Boolean(presetToDelete)}
        onClose={() => setPresetToDelete(null)}
        onConfirm={() => {
          if (presetToDelete) {
            deletePreset(presetToDelete.id);
            setPresetToDelete(null);
          }
        }}
        title="প্রিসেট মুছে ফেলবেন?"
        description={`আপনি কি নিশ্চিত যে "${presetToDelete?.name || ''}" প্রিসেটটি স্থায়ীভাবে মুছে ফেলতে চান?`}
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
      />
    </>
  );
};
