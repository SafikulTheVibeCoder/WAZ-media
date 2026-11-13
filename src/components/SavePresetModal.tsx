import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_PRESETS, ASPECT_RATIOS } from '../data/quotes';
import { ModalShell } from './ui/ModalShell';
import { Bookmark, Layout, Type, Palette, Shield } from 'lucide-react';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({ isOpen, onClose }) => {
  const { poster, saveCurrentAsPreset } = useApp();

  const [presetName, setPresetName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('সাধারণ');

  const currentTheme = THEME_PRESETS.find((t) => t.id === poster.theme);
  const currentRatio = ASPECT_RATIOS.find((r) => r.id === poster.size);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName =
      presetName.trim() || `কাস্টম ${currentRatio?.label || 'ডিজাইন'} প্রিসেট`;
    saveCurrentAsPreset(finalName, description, category);
    onClose();
  };

  const SUGGESTED_NAMES = [
    'আমার সিগনেচার স্টাইল',
    'জুম্মা স্পেশাল গোল্ড',
    'রিলস ও স্টোরি ফরম্যাট',
    'কুরআন আয়াত ব্যানার',
    'মিনিমাল ডার্ক লুক',
    'ডেইলি হাদিস টেমপ্লেট',
  ];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="ডিজাইন প্রিসেট হিসেবে সংরক্ষণ"
      subtitle="ভবিষ্যতে এক ক্লিকে হুবহু একই স্টাইল প্রয়োগ করুন"
      icon={<Bookmark className="w-4 h-4 fill-current" />}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="save-preset-name"
            className="text-xs font-semibold text-[#b6b0a6] flex items-center justify-between"
          >
            <span>প্রিসেটের নাম *</span>
            <span className="text-[11px] text-[#807a72]">সহজে চেনার মতো নাম দিন</span>
          </label>
          <input
            id="save-preset-name"
            type="text"
            required
            autoFocus
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="যেমন: গোল্ডেন জুম্মা পোস্ট"
            className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/10 focus:border-[#d4af37] rounded-xl text-sm text-[#f5f3ee] outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_NAMES.map((name) => (
            <button
              type="button"
              key={name}
              onClick={() => setPresetName(name)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#1b1b22] hover:bg-[#23232c] text-[#b6b0a6] hover:text-[#f5f3ee] border border-white/[0.06] transition"
            >
              + {name}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-[#b6b0a6] block">ক্যাটাগরি</span>
          <div className="flex flex-wrap gap-1.5">
            {['সাধারণ', 'কুরআন ও হাদিস', 'জুম্মা স্পেশাল', 'সোশ্যাল স্টোরি', 'ব্যানার'].map(
              (cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition ${
                    category === cat
                      ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                      : 'bg-[#1b1b22] text-[#807a72] hover:text-[#f5f3ee]'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="save-preset-desc"
            className="text-xs font-semibold text-[#b6b0a6] block"
          >
            বিবরণ (ঐচ্ছিক)
          </label>
          <input
            id="save-preset-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="যেমন: ফেসবুক পেজের জন্য শুক্রবারের থিম"
            className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/10 focus:border-[#d4af37] rounded-xl text-xs text-[#f5f3ee] outline-none"
          />
        </div>

        {/* Summary */}
        <div className="p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#b6b0a6]">সংরক্ষিত কনফিগারেশন</span>
            <span className="text-[11px] text-[#d4af37]">বাণী অপরিবর্তিত থাকবে</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#b6b0a6]">
            <div className="flex items-center gap-2 truncate">
              <Layout className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span className="truncate">{currentRatio?.label || poster.size}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <Palette className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span className="truncate">{currentTheme?.name || poster.theme}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <Type className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span className="truncate">{poster.font}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <Shield className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span className="truncate">বর্ডার: {poster.borderStyle}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#1b1b22] hover:bg-[#24242d] text-[#b6b0a6] hover:text-[#f5f3ee] text-xs font-semibold transition min-h-[40px]"
          >
            বাতিল
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition min-h-[40px]"
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>প্রিসেট সংরক্ষণ</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
