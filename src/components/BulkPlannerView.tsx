import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { EmptyState } from './ui/EmptyState';
import { generateBulkMediaPlan } from '../services/bulkPlannerService';
import { getHijriDateDetails } from '../services/islamicCalendarService';
import { BulkPosterScheduleItem } from '../types';
import { THEME_PRESETS } from '../data/quotes';
import { toBengaliNumber, formatLocalIsoDate } from '../utils/bengaliUtils';
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
  CalendarCheck2,
  Moon,
  Sun,
} from 'lucide-react';

export const BulkPlannerView: React.FC = () => {
  const { setPoster, setCurrentView, showToast, triggerAccessGuard } = useApp();

  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'ramadan_30'>('week');
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    return formatLocalIsoDate(new Date());
  });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const mediaPlan = useMemo(() => {
    const parts = startDateStr.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return generateBulkMediaPlan(dateObj, timeframe);
  }, [startDateStr, timeframe]);

  const filteredItems = useMemo(() => {
    if (filterCategory === 'all') return mediaPlan.items;
    if (filterCategory === 'special') return mediaPlan.items.filter((item) => item.isSpecialOccasion);
    return mediaPlan.items.filter((item) => item.occasionCategory === filterCategory);
  }, [mediaPlan.items, filterCategory]);

  const handleCopyTextCopy = (item: BulkPosterScheduleItem) => {
    const text = `${item.quoteSnippet.ar ? item.quoteSnippet.ar + '\n\n' : ''}${
      item.quoteSnippet.bn
    }\n\n— ${item.quoteSnippet.ref}\n\n[তারিখ: ${item.gregorianDate} | ${
      item.hijriDateFormatted
    }]\n[উপলক্ষ: ${item.occasionName}]\n[পোস্ট করার সময়: ${item.recommendedPostTime}]`;
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
    const timeframeLabel =
      timeframe === 'week'
        ? '১ সপ্তাহ / ৭ দিন'
        : timeframe === 'ramadan_30'
        ? 'রমজান ৩০ দিন স্পেশাল'
        : '১ মাস / ৩০ দিন';
    let summary = `WAZ MEDIA - বাল্ক সোশ্যাল মিডিয়া প্ল্যান (${timeframeLabel})\n`;
    summary += `ক্যালেন্ডার রেঞ্জ: ${mediaPlan.items[0]?.gregorianDate} থেকে ${
      mediaPlan.items[mediaPlan.items.length - 1]?.gregorianDate
    }\n`;
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
    link.setAttribute(
      'download',
      `waz_media_bulk_plan_${mediaPlan.startDateIso}_to_${mediaPlan.endDateIso}.csv`
    );
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
    <div className="space-y-6 animate-in fade-in duration-200">
      <Header
        title="বাল্ক মিডিয়া ও হিজরি ক্যালেন্ডার প্ল্যানার"
        subtitle="১ সপ্তাহ বা ১ মাসের সম্পূর্ণ পোস্টার সিডিউল তৈরি করুন স্বয়ংক্রিয় হিজরি হিসাব ও পোস্টিং গাইডলাইনসহ।"
        actionButton={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyStructuredSummary}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141419] hover:bg-[#1b1b22] text-xs font-semibold text-[#f5f3ee] border border-white/10 transition min-h-[40px]"
            >
              <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>রিপোর্ট কপি</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAllJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141419] hover:bg-[#1b1b22] text-xs font-semibold text-[#b6b0a6] hover:text-[#f5f3ee] border border-white/10 transition min-h-[40px]"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] text-xs font-bold transition min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        }
      />

      {/* Control Bar */}
      <div className="p-4 rounded-2xl bg-[#141419] border border-white/[0.08] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Timeframe Segmented Control */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs font-medium text-[#b6b0a6] shrink-0">সময়সীমা:</span>
          <div className="grid grid-cols-3 gap-1 bg-[#0e0e12] p-1 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setTimeframe('week')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                timeframe === 'week'
                  ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                  : 'text-[#b6b0a6] hover:text-[#f5f3ee]'
              }`}
            >
              ১ সপ্তাহ
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                timeframe === 'month'
                  ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                  : 'text-[#b6b0a6] hover:text-[#f5f3ee]'
              }`}
            >
              ১ মাস
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeframe('ramadan_30');
                const parts = startDateStr.split('-');
                const currDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                if (getHijriDateDetails(currDate).monthIndex !== 9) {
                  const scan = new Date();
                  for (let offset = 0; offset < 365; offset++) {
                    const candidate = new Date(scan);
                    candidate.setDate(scan.getDate() + offset);
                    const h = getHijriDateDetails(candidate);
                    if (h.monthIndex === 9 && h.day === 1) {
                      setStartDateStr(formatLocalIsoDate(candidate));
                      break;
                    }
                  }
                }
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition inline-flex items-center justify-center gap-1 ${
                timeframe === 'ramadan_30'
                  ? 'bg-[#d4af37] text-[#0b0b0e] font-bold'
                  : 'text-[#b6b0a6] hover:text-[#f5f3ee]'
              }`}
            >
              <Moon className="w-3 h-3" />
              <span>রমজান ৩০</span>
            </button>
          </div>
        </div>

        {/* Start Date Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label
            htmlFor="plannerStartDate"
            className="text-xs font-medium text-[#b6b0a6] shrink-0"
          >
            শুরুর তারিখ:
          </label>
          <input
            id="plannerStartDate"
            type="date"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
            className="bg-[#0e0e12] border border-white/10 text-[#f5f3ee] text-xs rounded-xl px-3 py-2 focus:border-[#d4af37] outline-none min-h-[38px]"
          />
          <button
            type="button"
            onClick={() => setStartDateStr(formatLocalIsoDate(new Date()))}
            className="px-3 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-xs font-medium text-[#b6b0a6] hover:text-[#f2d77d] border border-white/[0.08] transition min-h-[38px]"
          >
            আজ থেকে
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
              setStartDateStr(formatLocalIsoDate(d));
            }}
            className="px-3 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-xs font-medium text-[#b6b0a6] hover:text-[#f2d77d] border border-white/[0.08] transition min-h-[38px]"
          >
            আগামী জুমা
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 self-end xl:self-center">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition min-h-[38px] ${
              viewMode === 'cards'
                ? 'bg-[#d4af37]/15 border-[#d4af37]/40 text-[#f2d77d]'
                : 'bg-[#0e0e12] border-white/[0.08] text-[#807a72] hover:text-[#f5f3ee]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>কার্ড</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition min-h-[38px] ${
              viewMode === 'table'
                ? 'bg-[#d4af37]/15 border-[#d4af37]/40 text-[#f2d77d]'
                : 'bg-[#0e0e12] border-white/[0.08] text-[#807a72] hover:text-[#f5f3ee]'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>টেবিল</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#141419] border border-white/[0.08] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center shrink-0">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#f5f3ee] tabular-nums">
              {toBengaliNumber(mediaPlan.totalDays)} দিন
            </div>
            <div className="text-[11px] text-[#807a72]">মোট প্ল্যান সময়কাল</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141419] border border-white/[0.08] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400 tabular-nums">
              {toBengaliNumber(mediaPlan.specialEventsCount)} টি
            </div>
            <div className="text-[11px] text-[#807a72]">বিশেষ ইসলামিক দিবস</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141419] border border-white/[0.08] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-amber-400 tabular-nums">
              {toBengaliNumber(mediaPlan.jummahCount)} টি
            </div>
            <div className="text-[11px] text-[#807a72]">পবিত্র জুমার দিন</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141419] border border-white/[0.08] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#f5f3ee] truncate">
              {mediaPlan.items[0]?.hijriMonthNameBn || 'হিজরি মাস'}
            </div>
            <div className="text-[11px] text-[#807a72] truncate tabular-nums">
              {mediaPlan.items[0]?.hijriYear
                ? `${toBengaliNumber(mediaPlan.items[0].hijriYear)} হিজরি`
                : '১৪৪৮ হিজরি'}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.08] pb-3">
        {[
          { id: 'all', label: `সবগুলো (${toBengaliNumber(mediaPlan.items.length)})` },
          { id: 'special', label: `বিশেষ দিবস (${toBengaliNumber(mediaPlan.specialEventsCount)})` },
          { id: 'jummah', label: `জুমার দিন (${toBengaliNumber(mediaPlan.jummahCount)})` },
          { id: 'ramadan', label: 'রমজান ও রোজা' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition tabular-nums min-h-[36px] ${
              filterCategory === tab.id
                ? 'bg-[#d4af37] text-[#0b0b0e]'
                : 'text-[#b6b0a6] hover:bg-[#141419] hover:text-[#f5f3ee]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-6 h-6" />}
          title="এই ফিল্টারে কোনো সিডিউল পাওয়া যায়নি"
          description="অন্য সময়সীমা বা ফিল্টার নির্বাচন করে দেখুন।"
          action={
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className="px-4 py-2 rounded-xl bg-[#1b1b22] text-[#f2d77d] border border-white/10 text-xs font-semibold"
            >
              সব দিন দেখুন
            </button>
          }
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const themeConfig =
              THEME_PRESETS.find((t) => t.id === item.suggestedTheme) || THEME_PRESETS[0];
            const isCopied = copiedId === item.posterId;

            return (
              <article
                key={item.posterId}
                className={`min-w-0 flex flex-col justify-between p-5 rounded-2xl border transition ${
                  item.isSpecialOccasion
                    ? 'bg-[#141419] border-[#d4af37]/35'
                    : 'bg-[#141419] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="space-y-3.5 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-white/[0.08]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-xs font-mono font-bold text-[#d4af37] tabular-nums">
                          #{toBengaliNumber(item.dayIndex)}
                        </span>
                        <h2 className="text-sm font-bold text-[#f5f3ee]">{item.gregorianDate}</h2>
                        <span className="text-xs text-[#807a72]">({item.dayName})</span>
                      </div>
                      <div className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.hijriDateFormatted}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold sm:text-right break-words ${
                        item.occasionCategory === 'jummah'
                          ? 'text-amber-400'
                          : item.occasionCategory === 'ramadan'
                          ? 'text-emerald-400'
                          : item.isSpecialOccasion
                          ? 'text-[#f2d77d]'
                          : 'text-[#807a72]'
                      }`}
                    >
                      {item.occasionName}
                    </span>
                  </div>

                  {/* Unboxed Theme & Size Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#b6b0a6]">
                    <span>
                      থিম: <strong className="text-[#f5f3ee]">{themeConfig.name}</strong>
                    </span>
                    <span className="font-mono text-[11px] text-[#807a72]">
                      {item.suggestedRatio}
                    </span>
                  </div>

                  {/* Quote Block */}
                  <div className="p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.06] space-y-2">
                    {item.quoteSnippet.ar && (
                      <p dir="rtl" className="font-arabic text-base text-[#f2d77d] leading-relaxed text-right">
                        {item.quoteSnippet.ar}
                      </p>
                    )}
                    <p className="text-xs text-[#f5f3ee] leading-relaxed line-clamp-3">
                      “{item.quoteSnippet.bn}”
                    </p>
                    <div className="text-[11px] text-[#807a72] pt-1.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                      <span>— {item.quoteSnippet.ref}</span>
                      {item.quoteSnippet.topic && (
                        <span className="text-[#d4af37] font-medium">{item.quoteSnippet.topic}</span>
                      )}
                    </div>
                  </div>

                  {/* Timing & Guideline */}
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-[#f2d77d]">
                      <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>সময়: {item.recommendedPostTime}</span>
                    </div>
                    <p className="text-[11px] text-[#807a72] leading-relaxed">
                      {item.publishingGuideline}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyTextCopy(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-xs font-semibold text-[#f5f3ee] border border-white/[0.08] transition min-h-[38px]"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>ক্যাপশন কপি</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenInPosterStudio(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] text-xs font-bold transition min-h-[38px]"
                  >
                    <span>স্টুডিওতে খুলুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#141419]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#101014] text-[#b6b0a6] font-semibold">
                <th className="py-3.5 px-3.5">ক্রমিক</th>
                <th className="py-3.5 px-3.5">তারিখ (ইংরেজি | হিজরি)</th>
                <th className="py-3.5 px-3.5">উপলক্ষ</th>
                <th className="py-3.5 px-3.5">থিম ও সাইজ</th>
                <th className="py-3.5 px-3.5 min-w-[260px]">বাণী ও ক্যাপশন</th>
                <th className="py-3.5 px-3.5 min-w-[190px]">পোস্ট টাইম</th>
                <th className="py-3.5 px-3.5 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredItems.map((item) => (
                <tr key={item.posterId} className="hover:bg-[#1b1b22]/60 transition">
                  <td className="py-3 px-3.5 font-mono text-[#807a72] font-bold tabular-nums">
                    #{toBengaliNumber(item.dayIndex)}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-[#f5f3ee] whitespace-nowrap">
                      {item.gregorianDate}
                    </div>
                    <div className="text-[11px] text-[#807a72]">{item.dayName}</div>
                    <div className="text-[11px] text-emerald-400 mt-0.5 whitespace-nowrap">
                      {item.hijriDateFormatted}
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-xs font-semibold whitespace-nowrap ${
                        item.isSpecialOccasion ? 'text-[#f2d77d]' : 'text-[#b6b0a6]'
                      }`}
                    >
                      {item.occasionName}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-[#f5f3ee] whitespace-nowrap">
                      {THEME_PRESETS.find((t) => t.id === item.suggestedTheme)?.name ||
                        item.suggestedTheme}
                    </div>
                    <div className="text-[11px] text-[#807a72] font-mono">
                      {item.suggestedRatio}
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <p className="text-xs text-[#f5f3ee] line-clamp-2 leading-relaxed">
                      “{item.quoteSnippet.bn}”
                    </p>
                    <div className="text-[11px] text-[#807a72] mt-0.5">
                      — {item.quoteSnippet.ref}
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="text-xs font-semibold text-[#d4af37] whitespace-nowrap">
                      {item.recommendedPostTime}
                    </div>
                    <div className="text-[11px] text-[#807a72] line-clamp-2 mt-0.5">
                      {item.publishingGuideline}
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenInPosterStudio(item)}
                      className="px-3 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition inline-flex items-center gap-1"
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
