import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_PRESETS, ASPECT_RATIOS } from '../data/quotes';
import { Bookmark, Sparkles, X, Check, Layout, Type, Palette, Shield } from 'lucide-react';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({ isOpen, onClose }) => {
  const { poster, brand, saveCurrentAsPreset } = useApp();

  const [presetName, setPresetName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('সাধারণ');

  if (!isOpen) return null;

  const currentTheme = THEME_PRESETS.find((t) => t.id === poster.theme);
  const currentRatio = ASPECT_RATIOS.find((r) => r.id === poster.size);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = presetName.trim() || `কাস্টম ${currentRatio?.label || 'ডিজাইন'} প্রিসেট`;
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#17110c] border border-[#3d2a1c] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#2d2117] flex items-center justify-between bg-[#140e0a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#281b10] flex items-center justify-center text-[#d4af37] border border-[#44301d]">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#f4eee2]">ডিজাইন প্রিসেট হিসেবে সংরক্ষণ</h3>
              <p className="text-[11px] text-[#877461]">ভবিষ্যতে নতুন বাণীতে এক ক্লিকে হুবহু একই স্টাইল প্রয়োগ করতে পারবেন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#241a12] text-[#877461] hover:text-[#f4eee2] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Preset Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#baa791] flex items-center justify-between">
              <span>প্রিসেটের নাম (Preset Name) *</span>
              <span className="text-[10px] text-[#877461]">সহজে চেনার মতো একটি নাম দিন</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="যেমন: গোল্ডেন জুম্মা পোস্ট, ইনস্টাগ্রাম স্টোরি ইত্যাদি..."
              className="w-full px-3.5 py-2.5 bg-[#120e0a] border border-[#2d2117] focus:border-[#d4af37] rounded-xl text-sm text-[#f4eee2] outline-none"
            />
          </div>

          {/* Quick Name Suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_NAMES.map((name) => (
              <button
                type="button"
                key={name}
                onClick={() => setPresetName(name)}
                className="text-[10px] px-2.5 py-1 rounded-md bg-[#20160f] hover:bg-[#2b1f15] text-[#baa791] border border-[#352517] transition"
              >
                + {name}
              </button>
            ))}
          </div>

          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#baa791]">ক্যাটাগরি বা ট্যাগ</label>
            <div className="flex gap-2">
              {['সাধারণ', 'কুরআন ও হাদিস', 'জুম্মা স্পেশাল', 'সোশ্যাল স্টোরি', 'ব্যানার'].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg transition ${
                    category === cat
                      ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                      : 'bg-[#1f1610] text-[#877461] hover:text-[#f4eee2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#baa791]">বিবরণ (ঐচ্ছিক)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="যেমন: ফেসবুক পেজের জন্য বিশেষ শুক্রবারের থিম"
              className="w-full px-3 py-2 bg-[#120e0a] border border-[#2d2117] rounded-xl text-xs text-[#f4eee2] outline-none"
            />
          </div>

          {/* Visual Preview of Active Configuration to be Saved */}
          <div className="p-3.5 rounded-xl bg-[#120e0a] border border-[#2d2117] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#877461]">
              <span className="font-medium text-[#baa791]">যা যা প্রিসেটে সংরক্ষিত হবে:</span>
              <span className="text-[10px] text-[#d4af37]">মূল বাণী/টেক্সট অক্ষুণ্ণ থাকবে</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#1a120b] border border-[#261a10]">
                <Layout className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span className="truncate text-[#e8dcbe]">
                  সাইজ: <strong className="text-white">{currentRatio?.label}</strong> ({poster.size})
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#1a120b] border border-[#261a10]">
                <Palette className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span className="truncate text-[#e8dcbe]">
                  থিম: <strong className="text-white">{currentTheme?.name}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#1a120b] border border-[#261a10]">
                <Type className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span className="truncate text-[#e8dcbe]">
                  ফন্ট: <strong className="text-white">{poster.font}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#1a120b] border border-[#261a10]">
                <Shield className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span className="truncate text-[#e8dcbe]">
                  বর্ডার: <strong className="text-white">{poster.borderStyle}</strong>
                </span>
              </div>
            </div>

            {/* Color Swatch Dots */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#231a12] text-[10px] text-[#877461]">
              <span>রঙ প্যালেট:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: poster.textColor }} title="টেক্সট রঙ" />
                <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: poster.accentColor }} title="অ্যাকসেন্ট রঙ" />
                <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: poster.arabicColor }} title="আরবি রঙ" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#231a12]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1f1610] hover:bg-[#281b12] text-[#877461] hover:text-[#f4eee2] text-xs font-semibold transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow-lg transition active:scale-95"
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>প্রিসেট সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
