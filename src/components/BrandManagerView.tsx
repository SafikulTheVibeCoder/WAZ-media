import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { BRAND_LOGO_PRESETS } from '../data/quotes';
import { uploadBrandLogoToStorage } from '../services/firebaseDb';
import {
  BadgeCheck,
  Upload,
  RotateCcw,
  Download,
  FileUp,
  Eye,
  Cloud,
  Loader2,
} from 'lucide-react';

export const BrandManagerView: React.FC = () => {
  const {
    brand,
    updateBrandField,
    resetBrandDefaults,
    showToast,
    exportBackup,
    importBackup,
    currentUser,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('লোগো ফাইলের আকার ৩ মেগাবাইটের কম হতে হবে');
      return;
    }

    setIsUploadingLogo(true);
    try {
      if (currentUser) {
        const downloadUrl = await uploadBrandLogoToStorage(currentUser.uid, file);
        updateBrandField('logo', downloadUrl);
        showToast('লোগো ফায়ারবেস ক্লাউড স্টোরেজে সফলভাবে আপলোড হয়েছে!');
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          updateBrandField('logo', result);
          showToast('লোগো লোড হয়েছে। ক্লাউডে সেভ করতে সাইন-ইন করুন।');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      showToast('লোগো আপলোড ব্যর্থ হয়েছে');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
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
    <div className="space-y-6 animate-in fade-in duration-200">
      <Header
        title="ব্র্যান্ড ও পরিচিতি সেটিংস"
        subtitle="আপনার পেজ বা চ্যানেলের লোগো, নাম ও ট্যাগলাইন কনফিগার করুন যা প্রতিটি পোস্টারে প্রদর্শিত হবে।"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Form */}
        <section className="lg:col-span-7 bg-[#141419] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
            <BadgeCheck className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-base font-bold text-[#f5f3ee]">ব্র্যান্ড তথ্যসমূহ</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="brand-name-input"
                className="text-xs font-semibold text-[#b6b0a6] block mb-1.5"
              >
                পেজ বা চ্যানেলের নাম
              </label>
              <input
                id="brand-name-input"
                type="text"
                value={brand.name}
                onChange={(e) => updateBrandField('name', e.target.value)}
                placeholder="যেমন: WAZ MEDIA"
                className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="brand-tagline-input"
                className="text-xs font-semibold text-[#b6b0a6] block mb-1.5"
              >
                ট্যাগলাইন বা স্লোগান
              </label>
              <input
                id="brand-tagline-input"
                type="text"
                value={brand.tagline}
                onChange={(e) => updateBrandField('tagline', e.target.value)}
                placeholder="যেমন: INSPIRING FAITH, ILLUMINATING MINDS"
                className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="brand-handle-input"
                className="text-xs font-semibold text-[#b6b0a6] block mb-1.5"
              >
                সোশ্যাল মিডিয়া হ্যান্ডেল
              </label>
              <input
                id="brand-handle-input"
                type="text"
                value={brand.handle}
                onChange={(e) => updateBrandField('handle', e.target.value)}
                placeholder="যেমন: @wazmedia.bd"
                className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <span className="text-xs font-semibold text-[#b6b0a6] block mb-2">
                লোগো নির্বাচন (প্রিসেট অথবা কাস্টম আপলোড)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                {BRAND_LOGO_PRESETS.map((preset) => {
                  const isSelected = brand.logo === preset.svgData;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        updateBrandField('logo', preset.svgData);
                        showToast(`${preset.name} নির্বাচন করা হয়েছে`);
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition ${
                        isSelected
                          ? 'bg-[#1b1b22] border-[#d4af37] text-[#f2d77d]'
                          : 'bg-[#0e0e12] border-white/[0.08] text-[#807a72] hover:border-white/20'
                      }`}
                      title={preset.name}
                    >
                      <div className="w-10 h-10 p-1 flex items-center justify-center">
                        <img
                          src={preset.svgData}
                          alt={preset.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[11px] leading-tight font-medium truncate w-full">
                        {preset.name.split('(')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1b1b22] hover:bg-[#24242d] text-[#f2d77d] border border-white/10 rounded-xl text-xs font-semibold transition disabled:opacity-50 min-h-[42px]"
                >
                  {isUploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>
                    {isUploadingLogo ? 'আপলোড হচ্ছে...' : 'নিজস্ব লোগো আপলোড'}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={resetBrandDefaults}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs text-[#b6b0a6] hover:text-[#f5f3ee] hover:bg-[#1b1b22] transition min-h-[42px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ডিফল্ট রিসেট</span>
                </button>

                {Boolean(brand.logo?.startsWith('http')) && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>ক্লাউড URL</span>
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
              <span className="text-xs font-semibold text-[#b6b0a6] block">ডিফল্ট অপশন</span>
              {[
                { key: 'showTag' as const, label: 'পোস্টারে ট্যাগলাইন প্রদর্শন' },
                { key: 'showHandle' as const, label: 'পোস্টারে সোশ্যাল হ্যান্ডেল প্রদর্শন' },
                { key: 'watermark' as const, label: 'নিচে কপিরাইট ওয়াটারমার্ক চালু রাখুন' },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] cursor-pointer min-h-[44px]"
                >
                  <span className="text-xs text-[#f5f3ee]">{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(brand[opt.key])}
                    onChange={(e) => updateBrandField(opt.key, e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 text-[#d4af37] focus:ring-0 accent-[#d4af37]"
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Live Preview + Backup */}
        <div className="lg:col-span-5 space-y-5">
          <section className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/[0.08]">
              <Eye className="w-5 h-5 text-[#d4af37]" />
              <h2 className="text-base font-bold text-[#f5f3ee]">ব্র্যান্ডিং লাইভ প্রিভিউ</h2>
            </div>

            <div className="mb-4">
              <span className="text-[11px] text-[#807a72] block mb-1.5">ডার্ক ব্যাকগ্রাউন্ডে প্রিভিউ</span>
              <div className="p-5 rounded-xl bg-[#0e0e12] border border-white/[0.08] flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 flex items-center justify-center mb-2">
                  <img
                    src={brand.logo || '/logo.svg'}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-bold text-base tracking-widest text-[#f2d77d] uppercase">
                  {brand.name || 'WAZ MEDIA'}
                </h3>
                {brand.showTag && (
                  <p className="text-[11px] text-[#d4af37] tracking-wider mt-0.5">
                    {brand.tagline}
                  </p>
                )}
                {brand.showHandle && (
                  <p className="text-[11px] text-[#807a72] mt-1">{brand.handle}</p>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-[#807a72] block mb-1.5">
                গোল্ডেন ব্যাকগ্রাউন্ডে প্রিভিউ
              </span>
              <div className="p-5 rounded-xl bg-gradient-to-br from-[#edd390] to-[#b38627] flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 flex items-center justify-center mb-2">
                  <img
                    src={brand.logo || '/logo.svg'}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-bold text-base tracking-widest text-[#1c1005] uppercase">
                  {brand.name || 'WAZ MEDIA'}
                </h3>
                {brand.showTag && (
                  <p className="text-[11px] text-[#3d2306] tracking-wider font-semibold mt-0.5">
                    {brand.tagline}
                  </p>
                )}
                {brand.showHandle && (
                  <p className="text-[11px] text-[#4f2e09] mt-1 font-medium">
                    {brand.handle}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-[#141419] border border-white/[0.08] rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-bold text-[#f5f3ee] mb-1">ব্যাকআপ ও রিস্টোর</h3>
            <p className="text-xs text-[#807a72] mb-4 leading-relaxed">
              আপনার সংরক্ষিত সব ডিজাইন ও ব্র্যান্ড সেটিংস JSON ব্যাকআপ হিসেবে ডাউনলোড বা রিস্টোর করুন।
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={exportBackup}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/10 text-xs font-semibold transition min-h-[42px]"
              >
                <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>ব্যাকআপ ডাউনলোড</span>
              </button>
              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/10 text-xs font-semibold transition min-h-[42px]"
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
          </section>
        </div>
      </div>
    </div>
  );
};
