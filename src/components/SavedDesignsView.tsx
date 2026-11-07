import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { formatDateBn, toBengaliNumber } from '../utils/bengaliUtils';
import { downloadBlob, renderPoster } from '../utils/canvasRenderer';
import { SavedDesign } from '../types';
import {
  FolderHeart,
  Edit3,
  Download,
  Copy,
  Trash2,
  CopyCheck,
  PlusCircle,
  Search,
  ExternalLink
} from 'lucide-react';

export const SavedDesignsView: React.FC = () => {
  const {
    savedDesigns,
    deleteDesign,
    duplicateDesign,
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

  const filteredDesigns = savedDesigns.filter((d) => {
    if (sizeFilter !== 'all' && d.poster.size !== sizeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = (d.poster.bn + ' ' + (d.poster.ar || '') + ' ' + (d.poster.ref || '')).toLowerCase();
      return text.includes(q);
    }
    return true;
  });

  const handleDownload = async (design: SavedDesign) => {
    setDownloadingId(design.id);
    try {
      const canvas = document.createElement('canvas');
      await renderPoster(canvas, design.poster, brand);
      const filename = `waz-media-${design.poster.size}-${Date.now()}.png`;

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, filename);
          incrementStat('exports');
          showToast('পোস্টার সফলভাবে ডাউনলোড হয়েছে');
        }
        setDownloadingId(null);
      }, 'image/png');
    } catch {
      showToast('ডাউনলোড করতে ব্যর্থ হয়েছে');
      setDownloadingId(null);
    }
  };

  const handleCopyCaption = (design: SavedDesign) => {
    const parts: string[] = [];
    if (design.poster.showAr && design.poster.ar) parts.push(design.poster.ar);
    if (design.poster.bn) parts.push(design.poster.bn);
    if (design.poster.ref) parts.push(`— ${design.poster.ref}`);
    parts.push(`\n#${brand.name.replace(/\s+/g, '')} #IslamicPost`);

    navigator.clipboard.writeText(parts.join('\n\n'));
    showToast('ক্যাপশন কপি করা হয়েছে');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header
        title="সংরক্ষিত পোস্টার গ্যালারি"
        subtitle="আপনার পূর্বে তৈরিকৃত সকল পোস্টার এখানে সংরক্ষিত রয়েছে। যে কোনো সময় সম্পাদনা, ডাউনলোড বা শেয়ার করতে পারেন।"
        actionButton={
          <button
            onClick={() => {
              startNewDesign();
              setCurrentView('poster');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-semibold text-sm shadow-lg transition-transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন পোস্টার</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      {savedDesigns.length > 0 && (
        <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-md">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#877461]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সংরক্ষিত ডিজাইনে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 bg-[#120e0a] border border-[#2d2117] rounded-xl text-xs text-[#f4eee2] focus:border-[#d4af37] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'সবগুলো' },
              { id: '1080x1080', label: 'বর্গাকার (১:১)' },
              { id: '1080x1350', label: 'পোর্ট্রেট (৪:৫)' },
              { id: '1080x1920', label: 'স্টোরি (৯:১৬)' },
              { id: '1200x630', label: 'ব্যানার' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSizeFilter(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  sizeFilter === s.id
                    ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                    : 'bg-[#1f1610] text-[#877461] hover:text-[#f4eee2]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      {filteredDesigns.length === 0 ? (
        <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#201710] flex items-center justify-center text-[#7e6d5b] mx-auto mb-4">
            <FolderHeart className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-lg font-semibold text-[#f4eee2]">
            {savedDesigns.length === 0 ? 'এখনো কোনো ডিজাইন সংরক্ষণ করা হয়নি' : 'কোনো ফলাফল পাওয়া যায়নি'}
          </h3>
          <p className="text-xs text-[#877461] mt-1 max-w-sm mx-auto">
            {savedDesigns.length === 0
              ? 'পোস্টার স্টুডিওতে যান এবং নতুন ডিজাইন বানিয়ে “সংরক্ষণ করুন” বাটনে চাপুন।'
              : 'অনুসন্ধানের শব্দ পরিবর্তন করে চেষ্টা করুন।'}
          </p>
          <button
            onClick={() => {
              if (savedDesigns.length === 0) {
                setCurrentView('poster');
              } else {
                setSearchQuery('');
                setSizeFilter('all');
              }
            }}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#241a12] text-[#f7df94] border border-[#3f2f1d] hover:border-[#d4af37] text-xs font-semibold"
          >
            {savedDesigns.length === 0 ? 'পোস্টার স্টুডিওতে যান' : 'ফিল্টার রিসেট করুন'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredDesigns.map((d) => (
            <div
              key={d.id}
              className="bg-[#17110c] border border-[#2d2117] hover:border-[#423122] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-all group"
            >
              {/* Thumbnail Container */}
              <div 
                onClick={() => loadDesignForEdit(d)}
                className="relative bg-black/60 overflow-hidden cursor-pointer flex items-center justify-center"
                style={{ aspectRatio: d.poster.size === '1080x1920' ? '9/16' : d.poster.size === '1080x1350' ? '4/5' : d.poster.size === '1200x630' ? '1.91/1' : '1/1' }}
              >
                <img
                  src={d.thumb}
                  alt={d.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#140e0a]/90 text-[#f7df94] text-xs font-semibold backdrop-blur-sm shadow-md">
                    <Edit3 className="w-3.5 h-3.5" />
                    সম্পাদনা করুন
                  </span>
                </div>
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#140e0a]/80 text-[#f7df94] text-[10px] font-medium backdrop-blur-sm border border-[#2d2117]">
                  {d.poster.size.replace('x', '×')}
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <p className="font-bengali text-xs text-[#e8dcbe] line-clamp-2 leading-relaxed mb-1.5">
                    {d.poster.bn}
                  </p>
                  <p className="text-[11px] text-[#877461]">
                    {formatDateBn(d.updated)} {d.poster.ref ? `• ${d.poster.ref}` : ''}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-[#231a12]">
                  <button
                    onClick={() => loadDesignForEdit(d)}
                    className="flex items-center justify-center py-2 rounded-lg bg-[#221811] hover:bg-[#2e2016] text-[#f7df94] border border-[#3a2a1d] text-xs transition"
                    title="সম্পাদনা করুন"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    disabled={downloadingId === d.id}
                    onClick={() => handleDownload(d)}
                    className="flex items-center justify-center py-2 rounded-lg bg-[#221811] hover:bg-[#2e2016] text-[#e0d2bf] border border-[#3a2a1d] text-xs transition"
                    title="PNG ডাউনলোড"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleCopyCaption(d)}
                    className="flex items-center justify-center py-2 rounded-lg bg-[#221811] hover:bg-[#2e2016] text-[#e0d2bf] border border-[#3a2a1d] text-xs transition"
                    title="ক্যাপশন কপি"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('আপনি কি নিশ্চিত যে এই ডিজাইনটি মুছে ফেলতে চান?')) {
                        deleteDesign(d.id);
                      }
                    }}
                    className="flex items-center justify-center py-2 rounded-lg bg-[#281313] hover:bg-[#381a1a] text-red-400 border border-red-900/40 text-xs transition"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
