import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { INITIAL_QUOTES, CATEGORIES } from '../data/quotes';
import { QuoteItem, ContentType } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import {
  Search,
  Copy,
  Check,
  Palette,
  Bookmark,
  BookOpen,
  Filter,
  Share2,
  Sparkles
} from 'lucide-react';

export const CaptionsView: React.FC = () => {
  const { loadQuoteToPoster, showToast, toggleFavorite, isFavorite, incrementStat } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredQuotes = useMemo(() => {
    return INITIAL_QUOTES.filter((q) => {
      // Favorites filter
      if (onlyFavorites && !isFavorite(q.id)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'সব' && !q.cats.includes(selectedCategory)) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && q.type !== selectedType) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchBn = q.bn.toLowerCase().includes(query);
        const matchAr = q.ar.includes(query);
        const matchRef = q.ref.toLowerCase().includes(query);
        const matchTopic = q.topic?.toLowerCase().includes(query);
        const matchCats = q.cats.some(c => c.toLowerCase().includes(query));
        return matchBn || matchAr || matchRef || matchTopic || matchCats;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedType, onlyFavorites, isFavorite]);

  const handleCopy = (quote: QuoteItem) => {
    const text = `${quote.ar}\n\n${quote.bn}\n\n— ${quote.ref}\n\n#WAZMEDIA #IslamicQuotes`;
    navigator.clipboard.writeText(text);
    setCopiedId(quote.id);
    incrementStat('caps');
    setTimeout(() => setCopiedId(null), 2000);
    showToast('ক্যাপশন কপি করা হয়েছে');
  };

  const handleShare = async (quote: QuoteItem) => {
    const text = `${quote.ar}\n\n${quote.bn}\n\n— ${quote.ref}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WAZ MEDIA - ইসলামিক বাণী',
          text: text,
        });
      } catch {
        handleCopy(quote);
      }
    } else {
      handleCopy(quote);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header
        title="ইসলামিক বাণী ও ক্যাপশন ভাণ্ডার"
        subtitle="কুরআন ও সহীহ হাদিস থেকে সংগৃহীত শতভাগ রেফারেন্সযুক্ত বাণী। এক ক্লিকে কপি করুন অথবা পোস্টার বানিয়ে নিন।"
      />

      {/* Filter and Search Bar */}
      <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl p-4 md:p-5 shadow-lg space-y-4">
        {/* Top search & Type selector */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#877461]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="আয়াত, হাদিস, শব্দ বা রেফারেন্স দিয়ে খুঁজুন (উদাঃ ধৈর্য, সালাত, বুখারি)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#120e0a] border border-[#2d2117] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl text-sm text-[#f4eee2] placeholder-[#7a6a58] outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#877461] hover:text-[#f4eee2]"
              >
                মুছুন
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition shrink-0 ${
                selectedType === 'all'
                  ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                  : 'bg-[#1f1610] text-[#a9947c] hover:bg-[#2a1d13]'
              }`}
            >
              সকল ধরন
            </button>
            <button
              onClick={() => setSelectedType('quran')}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition shrink-0 ${
                selectedType === 'quran'
                  ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                  : 'bg-[#1f1610] text-[#a9947c] hover:bg-[#2a1d13]'
              }`}
            >
              কুরআন
            </button>
            <button
              onClick={() => setSelectedType('hadith')}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition shrink-0 ${
                selectedType === 'hadith'
                  ? 'bg-[#d4af37] text-[#140e0a] font-bold'
                  : 'bg-[#1f1610] text-[#a9947c] hover:bg-[#2a1d13]'
              }`}
            >
              হাদিস
            </button>
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg font-medium transition shrink-0 border ${
                onlyFavorites
                  ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f7df94]'
                  : 'bg-[#1f1610] border-[#2d2117] text-[#a9947c] hover:text-[#f4eee2]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
              <span>পছন্দের তালিকা</span>
            </button>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#231a12]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs transition ${
                selectedCategory === cat
                  ? 'bg-[#d4af37] text-[#140e0a] font-bold shadow'
                  : 'bg-[#1f1610] text-[#9b8976] hover:bg-[#2a1d13] hover:text-[#d3c2ad]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between text-xs text-[#877461] px-1">
        <span>
          পাওয়া গেছে: <strong className="text-[#f7df94]">{toBengaliNumber(filteredQuotes.length)}</strong> টি বাণী
        </span>
        {onlyFavorites && (
          <span className="text-amber-400">শুধুমাত্র পছন্দের বাণী প্রদর্শিত হচ্ছে</span>
        )}
      </div>

      {/* Quotes Cards Grid */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-[#5a4837] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#f4eee2]">কোনো বাণী খুঁজে পাওয়া যায়নি</h3>
          <p className="text-xs text-[#877461] mt-1">অন্য কোনো শব্দ দিয়ে খুঁজুন অথবা ফিল্টার রিসেট করুন।</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('সব');
              setSelectedType('all');
              setOnlyFavorites(false);
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-[#241a12] text-[#f7df94] border border-[#3f2f1d] hover:border-[#d4af37]"
          >
            সবগুলো দেখুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuotes.map((item) => {
            const favorited = isFavorite(item.id);
            return (
              <div
                key={item.id}
                className="bg-[#17110c] border border-[#2d2117] hover:border-[#423122] rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg group"
              >
                <div>
                  {/* Card Header: Type Badge & Favorite */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#271d15] text-[#d4af37] border border-[#3f2f1d]">
                        {item.type === 'quran' ? 'কুরআন' : item.type === 'hadith' ? 'হাদিস' : 'উক্তি'}
                      </span>
                      {item.cats.slice(1, 3).map((c) => (
                        <span key={c} className="text-[10px] text-[#877461]">
                          #{c}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={`p-1.5 rounded-md hover:bg-[#241a12] transition ${
                        favorited ? 'text-[#d4af37]' : 'text-[#6e5f50] hover:text-[#d4af37]'
                      }`}
                      title="পছন্দে রাখুন"
                    >
                      <Bookmark className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Arabic text */}
                  {item.ar && (
                    <p
                      dir="rtl"
                      className="font-arabic text-xl text-[#f7df94] leading-loose mb-3 text-right"
                    >
                      {item.ar}
                    </p>
                  )}

                  {/* Bengali text */}
                  <p className="font-bengali text-base text-[#f0e7d5] leading-relaxed mb-3">
                    {item.bn}
                  </p>
                </div>

                {/* Footer: Ref & Actions */}
                <div className="pt-3 border-t border-[#231a12] flex items-center justify-between">
                  <span className="text-xs font-medium text-[#c49b3a] truncate max-w-[50%]">
                    {item.ref}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#221811] hover:bg-[#2b1f16] text-[#e0d2bf] text-xs font-medium border border-[#3a2a1d] transition"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>কপি</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>কপি</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => loadQuoteToPoster(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e6c878] text-[#140e0a] text-xs font-bold transition shadow"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>পোস্টার</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
