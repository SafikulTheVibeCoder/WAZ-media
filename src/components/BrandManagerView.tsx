import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { BRAND_LOGO_PRESETS } from '../data/quotes';
import { 
  BadgeCheck, 
  Upload, 
  RotateCcw, 
  Save, 
  Download, 
  FileUp, 
  Sparkles,
  Eye,
  Check
} from 'lucide-react';

export const BrandManagerView: React.FC = () => {
  const {
    brand,
    updateBrandField,
    resetBrandDefaults,
    showToast,
    exportBackup,
    importBackup,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('লোগো ফাইলের আকার ২ মেগাবাইটের কম হতে হবে');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      updateBrandField('logo', result);
      showToast('লোগো সফলভাবে আপলোড করা হয়েছে');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      importBackup(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header
        title="ব্র্যান্ড ও পরিচিতি সেটিংস"
        subtitle="আপনার পেজ, চ্যানেল বা প্রতিষ্ঠানের লোগো, নাম ও ট্যাগলাইন কনফিগার করুন যা প্রতিটি পোস্টারে প্রদর্শিত হবে।"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-7 bg-[#17110c] border border-[#2d2117] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[#2d2117]">
            <BadgeCheck className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-base font-semibold text-[#f4eee2]">ব্র্যান্ড তথ্যসমূহ</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#baa791] block mb-1">
                পেজ বা চ্যানেলের নাম
              </label>
              <input
                type="text"
                value={brand.name}
                onChange={(e) => updateBrandField('name', e.target.value)}
                placeholder="যেমন: WAZ MEDIA"
                className="w-full px-3.5 py-2.5 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#baa791] block mb-1">
                ট্যাগলাইন বা স্লোগান
              </label>
              <input
                type="text"
                value={brand.tagline}
                onChange={(e) => updateBrandField('tagline', e.target.value)}
                placeholder="যেমন: INSPIRING FAITH, ILLUMINATING MINDS"
                className="w-full px-3.5 py-2.5 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#baa791] block mb-1">
                সোশ্যাল মিডিয়া হ্যান্ডেল
              </label>
              <input
                type="text"
                value={brand.handle}
                onChange={(e) => updateBrandField('handle', e.target.value)}
                placeholder="যেমন: @wazmedia.bd"
                className="w-full px-3.5 py-2.5 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#baa791] block mb-2">
                লোগো নির্বাচন (প্রিসেট অথবা কাস্টম আপলোড)
              </label>
              
              {/* Presets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {BRAND_LOGO_PRESETS.map((preset) => {
                  const isSelected = brand.logo === preset.svgData;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        updateBrandField('logo', preset.svgData);
                        showToast(`${preset.name} নির্বাচন করা হয়েছে`);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center text-center gap-1.5 transition ${
                        isSelected
                          ? 'bg-[#2a1d13] border-[#d4af37] text-[#f7df94]'
                          : 'bg-[#120e0a] border-[#2d2117] text-[#877461] hover:border-[#44301d]'
                      }`}
                      title={preset.name}
                    >
                      <div className="w-10 h-10 p-1 flex items-center justify-center">
                        <img src={preset.svgData} alt={preset.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[10px] leading-tight font-medium truncate w-full">
                        {preset.name.split('(')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#221811] hover:bg-[#2e2016] text-[#f7df94] border border-[#3f2f1d] rounded-xl text-xs font-medium transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>নিজস্ব লোগো ফাইল আপলোড</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={resetBrandDefaults}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-[#877461] hover:text-[#d4af37] transition"
                  title="ডিফল্ট লোগো ও সেটিংসে ফিরুন"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>রিসেট</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#231a12] space-y-3">
              <span className="text-xs font-semibold text-[#baa791] block">ডিফল্ট অপশন</span>
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#120e0a] border border-[#2d2117] cursor-pointer">
                <span className="text-xs text-[#f4eee2]">পোস্টারে ট্যাগলাইন প্রদর্শন</span>
                <input
                  type="checkbox"
                  checked={brand.showTag}
                  onChange={(e) => updateBrandField('showTag', e.target.checked)}
                  className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#120e0a] border border-[#2d2117] cursor-pointer">
                <span className="text-xs text-[#f4eee2]">পোস্টারে সোশ্যাল হ্যান্ডেল প্রদর্শন</span>
                <input
                  type="checkbox"
                  checked={brand.showHandle}
                  onChange={(e) => updateBrandField('showHandle', e.target.checked)}
                  className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#120e0a] border border-[#2d2117] cursor-pointer">
                <span className="text-xs text-[#f4eee2]">নিচে কপিরাইট ওয়াটারমার্ক চালু রাখুন</span>
                <input
                  type="checkbox"
                  checked={brand.watermark}
                  onChange={(e) => updateBrandField('watermark', e.target.checked)}
                  className="rounded border-[#382a1d] text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right: Live Preview of the Brand Header */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#2d2117]">
              <Eye className="w-5 h-5 text-[#d4af37]" />
              <h2 className="text-base font-semibold text-[#f4eee2]">ব্র্যান্ডিং লাইভ প্রিভিউ</h2>
            </div>

            {/* Dark Theme preview */}
            <div className="mb-4">
              <span className="text-[11px] text-[#877461] block mb-1.5">ডার্ক ব্যাকগ্রাউন্ডে প্রিভিউ</span>
              <div className="p-5 rounded-xl bg-[#120e0a] border border-[#2d2117] flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 flex items-center justify-center mb-2">
                  <img
                    src={brand.logo || '/logo.svg'}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-bold text-base tracking-widest text-[#f7df94] uppercase">
                  {brand.name || 'WAZ MEDIA'}
                </h3>
                {brand.showTag && (
                  <p className="text-[11px] text-[#c9a24a] tracking-wider mt-0.5">
                    {brand.tagline}
                  </p>
                )}
                {brand.showHandle && (
                  <p className="text-[10px] text-[#877461] mt-1">
                    {brand.handle}
                  </p>
                )}
              </div>
            </div>

            {/* Gold Theme preview */}
            <div>
              <span className="text-[11px] text-[#877461] block mb-1.5">গোল্ডেন ব্যাকগ্রাউন্ডে প্রিভিউ</span>
              <div className="p-5 rounded-xl bg-gradient-to-br from-[#edd390] to-[#b38627] flex flex-col items-center justify-center text-center shadow-inner">
                <div className="w-14 h-14 flex items-center justify-center mb-2">
                  <img
                    src={brand.logo || '/logo.svg'}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-bold text-base tracking-widest text-[#241406] uppercase">
                  {brand.name || 'WAZ MEDIA'}
                </h3>
                {brand.showTag && (
                  <p className="text-[11px] text-[#4a2a05] tracking-wider font-semibold mt-0.5">
                    {brand.tagline}
                  </p>
                )}
                {brand.showHandle && (
                  <p className="text-[10px] text-[#5c370d] mt-1 font-medium">
                    {brand.handle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Backup & Restore Panel */}
          <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-[#f4eee2] mb-1">ব্যাকআপ ও রিস্টোর</h3>
            <p className="text-xs text-[#877461] mb-4">
              আপনার সংরক্ষিত সব ডিজাইন ও ব্র্যান্ড সেটিংস ব্যাকআপ ফাইল হিসেবে ডাউনলোড বা রিস্টোর করুন।
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={exportBackup}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#221811] hover:bg-[#2b1f16] text-[#e0d2bf] border border-[#3a2a1d] text-xs font-medium transition"
              >
                <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>ব্যাকআপ ডাউনলোড</span>
              </button>
              <button
                onClick={() => backupInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#221811] hover:bg-[#2b1f16] text-[#e0d2bf] border border-[#3a2a1d] text-xs font-medium transition"
              >
                <FileUp className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>ফাইল থেকে রিস্টোর</span>
              </button>
              <input
                ref={backupInputRef}
                type="file"
                accept="application/json"
                onChange={handleBackupFile}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
