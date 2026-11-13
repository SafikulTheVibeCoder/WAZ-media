import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { EmptyState } from './ui/EmptyState';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { formatDateBn } from '../utils/bengaliUtils';
import { downloadBlob, renderPoster } from '../utils/canvasRenderer';
import { SavedDesign } from '../types';
import { generateSeoFilename, generateLocalFacebookPost } from '../utils/seoUtils';
import {
  FolderHeart,
  Edit3,
  Download,
  Copy,
  Trash2,
  PlusCircle,
  Search,
} from 'lucide-react';

export const SavedDesignsView: React.FC = () => {
  const {
    savedDesigns,
    deleteDesign,
    loadDesignForEdit,
    setCurrentView,
    startNewDesign,
    brand,
    showToast,
    incrementStat,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [designToDelete, setDesignToDelete] = useState<SavedDesign | null>(null);

  const filteredDesigns = savedDesigns.filter((d) => {
    if (sizeFilter !== 'all' && d.poster.size !== sizeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = (
        d.poster.bn +
        ' ' +
        (d.poster.ar || '') +
        ' ' +
        (d.poster.ref || '')
      ).toLowerCase();
      return text.includes(q);
    }
    return true;
  });

  const handleDownload = async (design: SavedDesign) => {
    setDownloadingId(design.id);
    try {
      const canvas = document.createElement('canvas');
      await renderPoster(canvas, design.poster, brand);
      const filename = generateSeoFilename(design.poster, brand, 'png');

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, filename);
          incrementStat('exports');
          showToast(`এসইও ফাইলনেমে (${filename}) সফলভাবে ডাউনলোড হয়েছে`);
        }
        setDownloadingId(null);
      }, 'image/png');
    } catch {
      showToast('ডাউনলোড করতে ব্যর্থ হয়েছে');
      setDownloadingId(null);
    }
  };

  const handleCopyCaption = (design: SavedDesign) => {
    const post = generateLocalFacebookPost(design.poster, brand);
    navigator.clipboard.writeText(post.fbCaption);
    showToast('এসইও ফেসবুক পোস্ট ক্লিপবোর্ডে কপি হয়েছে');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Header
        title="সংরক্ষিত পোস্টার গ্যালারি"
        subtitle="আপনার পূর্বে তৈরিকৃত সকল পোস্টার এখানে সংরক্ষিত রয়েছে। যেকোনো সময় সম্পাদনা, ডাউনলোড বা শেয়ার করুন।"
        actionButton={
          <button
            type="button"
            onClick={() => {
              startNewDesign();
              setCurrentView('poster');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs sm:text-sm transition min-h-[40px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন পোস্টার</span>
          </button>
        }
      />

      {savedDesigns.length > 0 && (
        <div className="bg-[#141419] border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#807a72]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সংরক্ষিত ডিজাইনে খুঁজুন..."
              className="w-full pl-10 pr-3 py-2 bg-[#0e0e12] border border-white/10 rounded-xl text-xs text-[#f5f3ee] focus:border-[#d4af37] outline-none min-h-[40px]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'সবগুলো' },
              { id: '1080x1080', label: 'বর্গাকার (১:১)' },
              { id: '1080x1350', label: 'পোর্ট্রেট (৪:৫)' },
              { id: '1080x1920', label: 'স্টোরি (৯:১৬)' },
              { id: '1200x630', label: 'ব্যানার' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSizeFilter(s.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition min-h-[36px] ${
                  sizeFilter === s.id
                    ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                    : 'bg-[#1b1b22] text-[#b6b0a6] hover:text-[#f5f3ee]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredDesigns.length === 0 ? (
        <EmptyState
          icon={<FolderHeart className="w-6 h-6" />}
          title={
            savedDesigns.length === 0
              ? 'এখনো কোনো ডিজাইন সংরক্ষণ করা হয়নি'
              : 'কোনো ফলাফল পাওয়া যায়নি'
          }
          description={
            savedDesigns.length === 0
              ? 'পোস্টার স্টুডিওতে যান এবং নতুন ডিজাইন বানিয়ে “সংরক্ষণ করুন” বাটনে চাপুন।'
              : 'অনুসন্ধানের শব্দ বা ফিল্টার পরিবর্তন করে চেষ্টা করুন।'
          }
          action={
            <button
              type="button"
              onClick={() => {
                if (savedDesigns.length === 0) {
                  setCurrentView('poster');
                } else {
                  setSearchQuery('');
                  setSizeFilter('all');
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-white/10 text-xs font-semibold min-h-[42px]"
            >
              {savedDesigns.length === 0 ? 'পোস্টার স্টুডিওতে যান' : 'ফিল্টার রিসেট করুন'}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredDesigns.map((d) => (
            <article
              key={d.id}
              className="bg-[#141419] border border-white/[0.08] hover:border-white/20 rounded-2xl overflow-hidden flex flex-col justify-between transition group"
            >
              <button
                type="button"
                onClick={() => loadDesignForEdit(d)}
                className="relative bg-black/50 overflow-hidden flex items-center justify-center w-full"
                style={{
                  aspectRatio:
                    d.poster.size === '1080x1920'
                      ? '9/16'
                      : d.poster.size === '1080x1350'
                      ? '4/5'
                      : d.poster.size === '1200x630'
                      ? '1.91/1'
                      : '1/1',
                }}
              >
                <img
                  src={d.thumb}
                  alt={d.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141419] text-[#f2d77d] border border-white/15 text-xs font-semibold">
                    <Edit3 className="w-3.5 h-3.5" />
                    সম্পাদনা করুন
                  </span>
                </div>
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 text-[#f2d77d] text-[10px] font-mono border border-white/10">
                  {d.poster.size.replace('x', '×')}
                </span>
              </button>

              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <p className="font-bengali text-xs text-[#f5f3ee] line-clamp-2 leading-relaxed mb-1.5">
                    {d.poster.bn}
                  </p>
                  <p className="text-[11px] text-[#807a72] truncate">
                    {formatDateBn(d.updated)} {d.poster.ref ? `· ${d.poster.ref}` : ''}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => loadDesignForEdit(d)}
                    className="flex items-center justify-center min-h-[38px] rounded-lg bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-white/[0.08] transition"
                    title="সম্পাদনা করুন"
                    aria-label="সম্পাদনা করুন"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={downloadingId === d.id}
                    onClick={() => handleDownload(d)}
                    className="flex items-center justify-center min-h-[38px] rounded-lg bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/[0.08] transition disabled:opacity-50"
                    title="PNG ডাউনলোড"
                    aria-label="PNG ডাউনলোড"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyCaption(d)}
                    className="flex items-center justify-center min-h-[38px] rounded-lg bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/[0.08] transition"
                    title="ক্যাপশন কপি"
                    aria-label="ক্যাপশন কপি"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDesignToDelete(d)}
                    className="flex items-center justify-center min-h-[38px] rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                    title="মুছে ফেলুন"
                    aria-label="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(designToDelete)}
        onClose={() => setDesignToDelete(null)}
        onConfirm={() => {
          if (designToDelete) {
            deleteDesign(designToDelete.id);
            setDesignToDelete(null);
          }
        }}
        title="পোস্টার ডিজাইন মুছে ফেলবেন?"
        description="আপনি কি নিশ্চিত যে এই সংরক্ষিত পোস্টারটি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর পুনরুদ্ধার করা যাবে না।"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
      />
    </div>
  );
};
