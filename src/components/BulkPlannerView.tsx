import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateBulkMediaPlan } from '../services/bulkPlannerService';
import { BulkPosterScheduleItem, AspectRatio, ThemeId } from '../types';
import { THEME_PRESETS } from '../data/quotes';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { 
  Calendar, 
  Sparkles, 
  Clock, 
  Compass, 
  Copy, 
  Check, 
  Download, 
  ArrowRight, 
  Layers, 
  Grid, 
  ListFilter, 
  Info,
  CalendarCheck2,
  Moon,
  Sun,
  Flame,
  BookmarkCheck,
  Send
} from 'lucide-react';

export const BulkPlannerView: React.FC = () => {
  const { setPoster, setCurrentView, showToast, triggerAccessGuard } = useApp();

  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'ramadan_30'>('week');
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate media plan based on selected timeframe and start date
  const mediaPlan = useMemo(() => {
    const parts = startDateStr.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return generateBulkMediaPlan(dateObj, timeframe);
  }, [startDateStr, timeframe]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (filterCategory === 'all') return mediaPlan.items;
    if (filterCategory === 'special') return mediaPlan.items.filter((item) => item.isSpecialOccasion);
    return mediaPlan.items.filter((item) => item.occasionCategory === filterCategory);
  }, [mediaPlan.items, filterCategory]);

  const handleCopyTextCopy = (item: BulkPosterScheduleItem) => {
    const text = `${item.quoteSnippet.ar ? item.quoteSnippet.ar + '\n\n' : ''}${item.quoteSnippet.bn}\n\n— ${item.quoteSnippet.ref}\n\n[তারিখ: ${item.gregorianDate} | ${item.hijriDateFormatted}]\n[উপলক্ষ: ${item.occasionName}]\n[পোস্ট করার সময়: ${item.recommendedPostTime}]`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.posterId);
    showToast('পোস্টের টেক্সট ও রেফারেন্স কপি করা হয়েছে');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyAllJson = () => {
    const jsonStr = JSON.stringify(mediaPlan, null, 2);
    navigator.clipboard.writeText(jsonStr);
    showToast('সম্পূর্ণ বাল্ক মিডিয়া প্ল্যানের JSON ডেটা কপি হয়েছে');
  };

  const handleCopyStructuredSummary = () => {
    let summary = `WAZ MEDIA - বাল্ক সোশ্যাল মিডিয়া প্ল্যান (${timeframe === 'week' ? '১ সপ্তাহ / ৭ দিন' : '১ মাস / ৩০ দিন'})\n`;
    summary += `ক্যালেন্ডার রেঞ্জ: ${mediaPlan.items[0]?.gregorianDate} থেকে ${mediaPlan.items[mediaPlan.items.length - 1]?.gregorianDate}\n`;
    summary += `মোট পোস্টার: ${mediaPlan.totalDays}টি | বিশেষ ইসলামিক দিবস: ${mediaPlan.specialEventsCount}টি | জুমার দিন: ${mediaPlan.jummahCount}টি\n`;
    summary += `====================================================================\n\n`;

    mediaPlan.items.forEach((item) => {
      summary += `[Poster ID: ${item.posterId} - ক্রমিক #${item.dayIndex}]\n`;
      summary += `তারিখ: ${item.gregorianDate} (${item.dayName}) | ${item.hijriDateFormatted}\n`;
      summary += `উপলক্ষ: ${item.occasionName}\n`;
      summary += `প্রস্তাবিত থিম ও সাইজ: ${item.suggestedTheme} | ${item.suggestedRatio}\n`;
      if (item.quoteSnippet.ar) summary += `আরবি বাণী: ${item.quoteSnippet.ar}\n`;
      summary += `বাংলা অনুবাদ: ${item.quoteSnippet.bn}\n`;
      summary += `রেফারেন্স: ${item.quoteSnippet.ref}\n`;
      summary += `পোস্ট করার সময়: ${item.recommendedPostTime}\n`;
      summary += `পাবলিশিং গাইডলাইন: ${item.publishingGuideline}\n`;
      summary += `--------------------------------------------------------------------\n\n`;
    });

    navigator.clipboard.writeText(summary);
    showToast('সম্পূর্ণ স্ট্রাকচার্ড সিডিউল রিপোর্ট কপি হয়েছে');
  };

  const handleExportCsv = () => {
    const headers = [
      'Poster ID',
      'Day Index',
      'Gregorian Date',
      'Day Name',
      'Hijri Date',
      'Occasion Name',
      'Suggested Theme',
      'Suggested Ratio',
      'Topic',
      'Bengali Text',
      'Arabic Text',
      'Reference',
      'Recommended Post Time',
      'Publishing Guideline',
    ];

    const rows = mediaPlan.items.map((item) => [
      `"${item.posterId}"`,
      item.dayIndex,
      `"${item.gregorianDate}"`,
      `"${item.dayName}"`,
      `"${item.hijriDateFormatted}"`,
      `"${item.occasionName}"`,
      `"${item.suggestedTheme}"`,
      `"${item.suggestedRatio}"`,
      `"${item.quoteSnippet.topic || ''}"`,
      `"${item.quoteSnippet.bn.replace(/"/g, '""')}"`,
      `"${(item.quoteSnippet.ar || '').replace(/"/g, '""')}"`,
      `"${item.quoteSnippet.ref.replace(/"/g, '""')}"`,
      `"${item.recommendedPostTime.replace(/"/g, '""')}"`,
      `"${item.publishingGuideline.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `waz_media_bulk_plan_${mediaPlan.startDateIso}_to_${mediaPlan.endDateIso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('সিডিউল CSV ফাইল সফলভাবে ডাউনলোড হয়েছে');
  };

  const handleOpenInPosterStudio = (item: BulkPosterScheduleItem) => {
    if (!triggerAccessGuard('পোস্টার ক্যানভাস ওপেন ও এডিটিং')) {
      return;
    }

    const th = THEME_PRESETS.find((t) => t.id === item.suggestedTheme);
    setPoster((prev) => ({
      ...prev,
      bn: item.quoteSnippet.bn,
      ar: item.quoteSnippet.ar || '',
      ref: item.quoteSnippet.ref,
      showAr: Boolean(item.quoteSnippet.ar),
      theme: item.suggestedTheme,
      size: item.suggestedRatio,
      ...(th ? { textColor: th.text, accentColor: th.accent, arabicColor: th.ar } : {}),
    }));

    setCurrentView('poster');
    showToast(`পোস্টার স্টুডিওতে ${item.gregorianDate} এর ডিজাইন লোড হয়েছে`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#1c140d] via-[#241910] to-[#1a120b] border border-[#3b2a1a] shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-[#f7df94]">
              বাল্ক মিডিয়া ও ইসলামিক ক্যালেন্ডার প্ল্যানার
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              হিজরি ও গ্রেগোরিয়ান সিঙ্ক
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#bba993] max-w-2xl leading-relaxed">
            এক ক্লিকে ১ সপ্তাহ (৭ দিন) বা ১ মাসের (৩০ দিন) সম্পূর্ণ সোশ্যাল মিডিয়া পোস্টার সিডিউল তৈরি করুন।
            প্রতিটি দিনের জন্য স্বয়ংক্রিয় হিজরি হিসাব, ইসলামিক দিবস শনাক্তকরণ ও সেরা পোস্টিং সময় সংযুক্ত।
          </p>
        </div>

        {/* Quick export actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyStructuredSummary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#261b12] hover:bg-[#322317] text-xs font-semibold text-[#f7df94] border border-[#3d2b1d] transition"
            title="সম্পূর্ণ সিডিউল টেক্সট কপি করুন"
          >
            <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>টেক্সট রিপোর্ট</span>
          </button>

          <button
            onClick={handleCopyAllJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#261b12] hover:bg-[#322317] text-xs font-semibold text-[#baa791] hover:text-[#f4eee2] border border-[#3d2b1d] transition"
            title="JSON ফরম্যাট কপি করুন"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>JSON কপি</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] text-xs font-bold shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="p-4 rounded-2xl bg-[#17100b] border border-[#2e2116] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Timeframe Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#baa791] shrink-0">সময়সীমা:</span>
          <div className="grid grid-cols-3 gap-1.5 bg-[#120c08] p-1 rounded-xl border border-[#2b1f15]">
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeframe === 'week'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow'
                  : 'text-[#baa791] hover:text-[#f4eee2]'
              }`}
            >
              ১ সপ্তাহ (৭ দিন)
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeframe === 'month'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow'
                  : 'text-[#baa791] hover:text-[#f4eee2]'
              }`}
            >
              ১ মাস (৩০ দিন)
            </button>
            <button
              onClick={() => setTimeframe('ramadan_30')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                timeframe === 'ramadan_30'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] shadow'
                  : 'text-[#baa791] hover:text-[#f4eee2]'
              }`}
            >
              <Moon className="w-3 h-3 text-amber-400" />
              <span>রমজান ৩০ দিন</span>
            </button>
          </div>
        </div>

        {/* Date Selector & Presets */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="plannerStartDate" className="text-xs font-medium text-[#baa791] shrink-0">
              শুরুর তারিখ:
            </label>
            <input
              id="plannerStartDate"
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="bg-[#120c08] border border-[#3b2a1a] text-[#f4eee2] text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              onClick={() => setStartDateStr(new Date().toISOString().split('T')[0])}
              className="px-2 py-1 rounded-lg bg-[#241910] hover:bg-[#322317] text-[#baa791] hover:text-[#f7df94] border border-[#38281b] transition"
            >
              আজ থেকে
            </button>
            <button
              onClick={() => {
                // Next Friday
                const d = new Date();
                d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
                setStartDateStr(d.toISOString().split('T')[0]);
              }}
              className="px-2 py-1 rounded-lg bg-[#241910] hover:bg-[#322317] text-[#baa791] hover:text-[#f7df94] border border-[#38281b] transition"
            >
              আগামী জুমা
            </button>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
              viewMode === 'cards'
                ? 'bg-[#d4af37]/20 border-[#d4af37]/40 text-[#f7df94]'
                : 'bg-[#1a120b] border-[#2e2116] text-[#8e7c6b] hover:text-[#baa791]'
            }`}
            title="ভিজ্যুয়াল কার্ড ভিউ"
          >
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">কার্ড</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
              viewMode === 'table'
                ? 'bg-[#d4af37]/20 border-[#d4af37]/40 text-[#f7df94]'
                : 'bg-[#1a120b] border-[#2e2116] text-[#8e7c6b] hover:text-[#baa791]'
            }`}
            title="স্ট্রাকচার্ড টেবিল ভিউ"
          >
            <ListFilter className="w-4 h-4" />
            <span className="hidden sm:inline">টেবিল</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#17100b] border border-[#2e2116] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37]">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-[#f7df94]">
              {toBengaliNumber(mediaPlan.totalDays)} দিন
            </div>
            <div className="text-[11px] text-[#8e7c6b]">মোট প্ল্যান সময়কাল</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17100b] border border-[#2e2116] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-emerald-400">
              {toBengaliNumber(mediaPlan.specialEventsCount)} টি
            </div>
            <div className="text-[11px] text-[#8e7c6b]">বিশেষ ইসলামিক দিবস</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17100b] border border-[#2e2116] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-amber-400">
              {toBengaliNumber(mediaPlan.jummahCount)} টি
            </div>
            <div className="text-[11px] text-[#8e7c6b]">পবিত্র জুমার দিন</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17100b] border border-[#2e2116] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#f4eee2] truncate">
              {mediaPlan.items[0]?.hijriMonthNameBn || 'হিজরি মাস'}
            </div>
            <div className="text-[11px] text-[#8e7c6b] truncate">
              {mediaPlan.items[0]?.hijriYear ? `${toBengaliNumber(mediaPlan.items[0].hijriYear)} হিজরি` : '১৪৪৮ হিজরি'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#2b1f16] pb-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            filterCategory === 'all'
              ? 'bg-[#d4af37] text-[#140e0a]'
              : 'text-[#baa791] hover:bg-[#1f150d] hover:text-[#f4eee2]'
          }`}
        >
          সবগুলো ({toBengaliNumber(mediaPlan.items.length)})
        </button>
        <button
          onClick={() => setFilterCategory('special')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
            filterCategory === 'special'
              ? 'bg-[#d4af37] text-[#140e0a]'
              : 'text-[#baa791] hover:bg-[#1f150d] hover:text-[#f4eee2]'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>বিশেষ দিবস ({toBengaliNumber(mediaPlan.specialEventsCount)})</span>
        </button>
        <button
          onClick={() => setFilterCategory('jummah')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            filterCategory === 'jummah'
              ? 'bg-[#d4af37] text-[#140e0a]'
              : 'text-[#baa791] hover:bg-[#1f150d] hover:text-[#f4eee2]'
          }`}
        >
          জুমার দিন ({toBengaliNumber(mediaPlan.jummahCount)})
        </button>
        <button
          onClick={() => setFilterCategory('ramadan')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
            filterCategory === 'ramadan'
              ? 'bg-[#d4af37] text-[#140e0a]'
              : 'text-[#baa791] hover:bg-[#1f150d] hover:text-[#f4eee2]'
          }`}
        >
          <Moon className="w-3 h-3" />
          <span>রমজান ও রোজা</span>
        </button>
      </div>

      {/* Schedule Content */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const themeConfig = THEME_PRESETS.find((t) => t.id === item.suggestedTheme) || THEME_PRESETS[0];
            const isCopied = copiedId === item.posterId;

            return (
              <div
                key={item.posterId}
                className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                  item.isSpecialOccasion
                    ? 'bg-gradient-to-br from-[#21160d] to-[#160f09] border-[#d4af37]/40 shadow-md'
                    : 'bg-[#150f0a] border-[#281c13] hover:border-[#3d2b1d]'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Poster ID, Dates, & Occasion */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#281c13] pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#2b1e14] text-[#d4af37] border border-[#3f2c1d]">
                          #{toBengaliNumber(item.dayIndex)}
                        </span>
                        <h2 className="text-sm font-bold text-[#f7df94]">
                          {item.gregorianDate}
                        </h2>
                        <span className="text-xs text-[#b8a691] font-medium">
                          ({item.dayName})
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                        <Moon className="w-3 h-3" />
                        <span>{item.hijriDateFormatted}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.occasionCategory === 'jummah'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : item.occasionCategory === 'ramadan'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : item.occasionCategory === 'eid'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : item.isSpecialOccasion
                            ? 'bg-[#d4af37]/20 text-[#f7df94] border-[#d4af37]/40'
                            : 'bg-[#241910] text-[#8e7c6b] border-[#38281b]'
                        }`}
                      >
                        {item.occasionName}
                      </span>
                    </div>
                  </div>

                  {/* Visual Theme & Size Suggestion */}
                  <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-xl bg-[#1b130c] border border-[#2e2015]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#8e7c6b]">প্রস্তাবিত থিম:</span>
                      <span className="font-semibold text-[#f7df94]">
                        {themeConfig.name} ({themeConfig.nameEn})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#8e7c6b]">
                      <span>সাইজ:</span>
                      <span className="font-mono text-[10px] text-[#baa791] font-bold">
                        {item.suggestedRatio}
                      </span>
                    </div>
                  </div>

                  {/* Text Copy Snippet */}
                  <div className="p-3 rounded-xl bg-[#100a06] border border-[#24180f] space-y-2">
                    {item.quoteSnippet.ar && (
                      <p className="font-arabic text-sm text-[#f7df94] leading-relaxed text-right dir-rtl font-medium">
                        {item.quoteSnippet.ar}
                      </p>
                    )}
                    <p className="text-xs text-[#f4eee2] leading-relaxed line-clamp-3">
                      "{item.quoteSnippet.bn}"
                    </p>
                    <div className="text-[11px] text-[#baa791] font-medium flex items-center justify-between pt-1 border-t border-[#1f140c]">
                      <span>— {item.quoteSnippet.ref}</span>
                      {item.quoteSnippet.topic && (
                        <span className="text-[10px] text-[#d4af37] bg-[#24170d] px-1.5 py-0.5 rounded border border-[#3b2716]">
                          {item.quoteSnippet.topic}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Publishing Guideline & Best Timing */}
                  <div className="p-2.5 rounded-xl bg-[#18110a] border border-[#2b1d12] space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#d4af37]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>পোস্ট করার সময়: {item.recommendedPostTime}</span>
                    </div>
                    <p className="text-[11px] text-[#8e7c6b] leading-normal">
                      💡 {item.publishingGuideline}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-[#281c13] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyTextCopy(item)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#21160d] hover:bg-[#2b1d12] text-[11px] font-semibold text-[#baa791] hover:text-[#f4eee2] border border-[#352417] transition"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>ক্যাপশন কপি</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenInPosterStudio(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] text-xs font-bold transition shadow"
                  >
                    <span>পোস্টার স্টুডিওতে খুলুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Structured Table View */
        <div className="overflow-x-auto rounded-2xl border border-[#2b1f16] bg-[#140d08]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2b1f16] bg-[#1c130c] text-[#d4af37] font-semibold">
                <th className="py-3 px-3">ক্রমিক</th>
                <th className="py-3 px-3">টার্গেট তারিখ (ইংরেজি | হিজরি)</th>
                <th className="py-3 px-3">উপলক্ষ / ইভেন্ট</th>
                <th className="py-3 px-3">প্রস্তাবিত থিম ও সাইজ</th>
                <th className="py-3 px-3 min-w-[280px]">বাণী ও ক্যাপশন টেক্সট</th>
                <th className="py-3 px-3 min-w-[200px]">পোস্ট টাইম ও গাইডলাইন</th>
                <th className="py-3 px-3 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#261a11]">
              {filteredItems.map((item) => (
                <tr
                  key={item.posterId}
                  className={`hover:bg-[#1b120b] transition ${
                    item.isSpecialOccasion ? 'bg-[#1a110a]' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-mono text-[#8e7c6b] font-bold">
                    #{toBengaliNumber(item.dayIndex)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#f4eee2] whitespace-nowrap">
                      {item.gregorianDate}
                    </div>
                    <div className="text-[11px] text-[#baa791]">
                      {item.dayName}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium mt-0.5 whitespace-nowrap">
                      {item.hijriDateFormatted}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        item.isSpecialOccasion
                          ? 'bg-[#d4af37]/20 text-[#f7df94] border-[#d4af37]/30'
                          : 'bg-[#241910] text-[#baa791] border-[#38281b]'
                      }`}
                    >
                      {item.occasionName}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-[#f7df94] whitespace-nowrap">
                      {THEME_PRESETS.find((t) => t.id === item.suggestedTheme)?.name || item.suggestedTheme}
                    </div>
                    <div className="text-[10px] text-[#8e7c6b] font-mono">
                      {item.suggestedRatio}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-xs text-[#f4eee2] line-clamp-2 leading-relaxed">
                      "{item.quoteSnippet.bn}"
                    </p>
                    <div className="text-[10px] text-[#baa791] mt-0.5">
                      — {item.quoteSnippet.ref}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-xs font-semibold text-[#d4af37] whitespace-nowrap">
                      {item.recommendedPostTime}
                    </div>
                    <div className="text-[10px] text-[#8e7c6b] line-clamp-2 mt-0.5">
                      {item.publishingGuideline}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleOpenInPosterStudio(item)}
                      className="px-2.5 py-1 rounded-lg bg-[#d4af37] hover:bg-[#e3be47] text-[#140e0a] font-bold text-[11px] transition inline-flex items-center gap-1 shadow"
                    >
                      <span>ডিজাইন</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
