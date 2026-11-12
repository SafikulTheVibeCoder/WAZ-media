/**
 * Bulk Content Generation & Social Media Media Planner for WAZ MEDIA
 * Supports generating 1 week (7 days) or 1 full month (30 days) of structured
 * posters synchronized with Hijri calendar, Islamic occasions, and optimal post timings.
 */

import { BulkPosterScheduleItem, BulkMediaPlanResult, AspectRatio, ThemeId } from '../types';
import { getHijriDateDetails, detectIslamicOccasion } from './islamicCalendarService';
import { INITIAL_QUOTES } from '../data/quotes';
import { toBengaliNumber } from '../utils/bengaliUtils';

const DAY_NAMES_BN = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

const MONTH_NAMES_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

/**
 * Find the most contextually relevant quote for an event or topic
 */
function findBestQuoteForOccasion(category: string, preferredTopic?: string, fallbackSeed = 0) {
  // Try matching preferredTopic in quotes
  if (preferredTopic) {
    const matched = INITIAL_QUOTES.find((q) =>
      q.topic?.toLowerCase().includes(preferredTopic.toLowerCase()) ||
      q.bn.toLowerCase().includes(preferredTopic.toLowerCase())
    );
    if (matched) return matched;
  }

  // Category matching
  if (category === 'jummah') {
    const jummahQuotes = INITIAL_QUOTES.filter((q) => q.cats.includes('জুমার দিন'));
    if (jummahQuotes.length > 0) {
      return jummahQuotes[fallbackSeed % jummahQuotes.length];
    }
  }

  if (category === 'ramadan' || category === 'fasting') {
    const fastingQuotes = INITIAL_QUOTES.filter((q) =>
      q.bn.includes('রোজা') || q.bn.includes('রমজান') || q.cats.includes('তাওবা ও ক্ষমা') || q.cats.includes('সবর ও শোকর')
    );
    if (fastingQuotes.length > 0) {
      return fastingQuotes[fallbackSeed % fastingQuotes.length];
    }
  }

  if (category === 'special_night' || category === 'eid') {
    const nightQuotes = INITIAL_QUOTES.filter((q) => q.cats.includes('দোয়া') || q.cats.includes('তাওবা ও ক্ষমা'));
    if (nightQuotes.length > 0) {
      return nightQuotes[fallbackSeed % nightQuotes.length];
    }
  }

  // General rotating seed across all verified quotes
  return INITIAL_QUOTES[fallbackSeed % INITIAL_QUOTES.length];
}

/**
 * Generate a complete, high-precision Bulk Media Plan for 1 week or 1 full month
 */
export function generateBulkMediaPlan(
  startDate: Date = new Date(),
  timeframe: 'week' | 'month' | 'ramadan_30' = 'week'
): BulkMediaPlanResult {
  const totalDays = timeframe === 'week' ? 7 : timeframe === 'ramadan_30' ? 30 : 30;
  const items: BulkPosterScheduleItem[] = [];

  let specialEventsCount = 0;
  let jummahCount = 0;

  for (let i = 0; i < totalDays; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + i);

    const hijri = getHijriDateDetails(targetDate);
    const occasion = detectIslamicOccasion(targetDate, hijri);

    if (occasion.isSpecial) specialEventsCount++;
    if (occasion.category === 'jummah') jummahCount++;

    const quote = findBestQuoteForOccasion(occasion.category, occasion.preferredTopic, i * 7 + 3);

    const dayOfWeek = targetDate.getDay();
    const dayName = DAY_NAMES_BN[dayOfWeek];

    const gDay = toBengaliNumber(targetDate.getDate());
    const gMonth = MONTH_NAMES_BN[targetDate.getMonth()];
    const gYear = toBengaliNumber(targetDate.getFullYear());
    const gregorianDate = `${gDay} ${gMonth} ${gYear} খ্রি.`;
    const gregorianIso = targetDate.toISOString().split('T')[0];

    const posterId = `bulk_poster_${gregorianIso}_d${i + 1}`;

    const scheduleItem: BulkPosterScheduleItem = {
      posterId,
      dayIndex: i + 1,
      gregorianDate,
      gregorianIso,
      dayName,
      hijriDateFormatted: hijri.formattedBn,
      hijriDay: hijri.day,
      hijriMonthNumber: hijri.monthIndex,
      hijriMonthNameBn: hijri.monthNameBn,
      hijriYear: hijri.year,
      isSpecialOccasion: occasion.isSpecial,
      occasionName: occasion.name,
      occasionCategory: occasion.category,
      suggestedTheme: occasion.suggestedTheme as ThemeId,
      suggestedRatio: occasion.suggestedRatio as AspectRatio,
      quoteSnippet: {
        bn: quote.bn,
        ar: quote.ar,
        ref: quote.ref,
        topic: quote.topic || occasion.name,
      },
      recommendedPostTime: occasion.recommendedPostTime,
      publishingGuideline: occasion.guideline,
      status: 'planned',
    };

    items.push(scheduleItem);
  }

  const endTargetDate = new Date(startDate);
  endTargetDate.setDate(endTargetDate.getDate() + totalDays - 1);

  return {
    id: `plan_${Date.now()}_${timeframe}`,
    timeframe,
    startDateIso: startDate.toISOString().split('T')[0],
    endDateIso: endTargetDate.toISOString().split('T')[0],
    totalDays,
    specialEventsCount,
    jummahCount,
    items,
    generatedAt: Date.now(),
  };
}
