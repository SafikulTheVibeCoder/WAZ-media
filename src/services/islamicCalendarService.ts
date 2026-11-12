/**
 * Islamic Calendar & Occasion Calculation Engine for WAZ MEDIA
 * Accurately calculates Gregorian & Hijri date synchronization,
 * Islamic months, and notable Islamic events/occasions.
 */

import { toBengaliNumber } from '../utils/bengaliUtils';

export interface HijriDateDetails {
  day: number;
  monthIndex: number; // 1-12
  monthNameEn: string;
  monthNameBn: string;
  year: number;
  formattedBn: string;
  formattedEn: string;
}

export const ISLAMIC_MONTHS: { index: number; nameEn: string; nameBn: string; meaning: string }[] = [
  { index: 1, nameEn: 'Muharram', nameBn: 'মুহাররম', meaning: 'পবিত্র মাস, আশুরার মাস' },
  { index: 2, nameEn: 'Safar', nameBn: 'সফর', meaning: 'শান্তি ও আত্মসংযমের মাস' },
  { index: 3, nameEn: "Rabi' al-Awwal", nameBn: "রবিউল আউয়াল", meaning: 'রাসূলুল্লাহ (সা.)-এর বিলাদতের মাস' },
  { index: 4, nameEn: "Rabi' al-Thani", nameBn: "রবিউস সানি", meaning: 'বরকতময় মাস' },
  { index: 5, nameEn: 'Jumada al-Ula', nameBn: 'জমাদিউল আউয়াল', meaning: 'শীতের আগমনী মাস' },
  { index: 6, nameEn: 'Jumada al-Akhirah', nameBn: 'জমাদিউস সানি', meaning: 'বরকতময় মাস' },
  { index: 7, nameEn: 'Rajab', nameBn: 'রজব', meaning: 'পবিত্র সম্মানিত চার মাসের এক মাস, মেরাজের মাস' },
  { index: 8, nameEn: "Sha'ban", nameBn: "শাবান", meaning: 'রমজানের প্রস্তুতি ও শবে বরাতের মাস' },
  { index: 9, nameEn: 'Ramadan', nameBn: 'রমজান', meaning: 'রহমত, মাগফিরাত ও নাজাতের মাহে রমজান' },
  { index: 10, nameEn: 'Shawwal', nameBn: 'শাওয়াল', meaning: 'ঈদুল ফিতর ও ছয় রোজার মাস' },
  { index: 11, nameEn: "Dhu al-Qi'dah", nameBn: "জিলকদ", meaning: 'হজের প্রস্তুতি ও সম্মানিত মাস' },
  { index: 12, nameEn: 'Dhu al-Hijjah', nameBn: 'জিলহজ্জ', meaning: 'পবিত্র হজ ও ঈদুল আজহার মাস' },
];

export interface IslamicOccasionRule {
  month: number; // 1-12
  day?: number; // exact day if fixed, or range
  dayRange?: [number, number];
  nameBn: string;
  nameEn: string;
  category: 'jummah' | 'ramadan' | 'eid' | 'fasting' | 'special_night' | 'daily';
  suggestedTheme: 'golden' | 'emerald' | 'black' | 'classic' | 'sapphire';
  suggestedRatio: '1080x1080' | '1080x1350' | '1080x1920';
  recommendedPostTime: string;
  guideline: string;
  preferredTopic: string;
}

export const ISLAMIC_OCCASIONS: IslamicOccasionRule[] = [
  // Muharram
  {
    month: 1,
    day: 1,
    nameBn: 'পবিত্র হিজরি নববর্ষ (১ম মুহাররম)',
    nameEn: 'Islamic New Year',
    category: 'special_night',
    suggestedTheme: 'golden',
    suggestedRatio: '1080x1080',
    recommendedPostTime: 'আগের দিন মাগরিবের পর (সন্ধ্যা ৬:৩০ - ৭:৩০)',
    guideline: 'নতুন হিজরি বর্ষে তাওবা, আত্মশুদ্ধি এবং কল্যাণের দোয়া সম্বলিত পোস্টার শেয়ার করুন।',
    preferredTopic: 'হিজরি নববর্ষ ও তাওবা'
  },
  {
    month: 1,
    day: 9,
    nameBn: 'পবিত্র আশুরার পূর্ব রোজা (৯ই মুহাররম)',
    nameEn: 'Tasu’a (9th Muharram)',
    category: 'fasting',
    suggestedTheme: 'emerald',
    suggestedRatio: '1080x1350',
    recommendedPostTime: 'বিকেল ৫:০০ - সন্ধ্যা ৬:০০ (ইফতার ও সেহরির তাগিদ)',
    guideline: 'আশুরার সওয়াব ও ৯-১০ মুহাররম রোজার গুরুত্ব তুলে ধরুন।',
    preferredTopic: 'আশুরার রোজা ও ফজিলত'
  },
  {
    month: 1,
    day: 10,
    nameBn: 'পবিত্র আশুরা (১০ই মুহাররম)',
    nameEn: 'Day of Ashura',
    category: 'special_night',
    suggestedTheme: 'black',
    suggestedRatio: '1080x1080',
    recommendedPostTime: 'সকাল ৭:০০ - ৮:৩০',
    guideline: 'ঐতিহাসিক আশুরার শিক্ষা ও মূসা (আ.)-এর মুক্তির ঐতিহাসিক ঘটনা ও রোজা।',
    preferredTopic: 'পবিত্র আশুরার গুরুত্ব ও ইতিহাস'
  },
  // Rajab
  {
    month: 7,
    day: 27,
    nameBn: 'পবিত্র শবে মেরাজ (২৭শে রজব)',
    nameEn: 'Shab-e-Meraj (Isra & Mi’raj)',
    category: 'special_night',
    suggestedTheme: 'sapphire',
    suggestedRatio: '1080x1080',
    recommendedPostTime: '২৬শে রজব সন্ধ্যা (মাগরিবের পর)',
    guideline: 'মেরাজের ঘটনা ও ৫ ওয়াক্ত নামাজের উপহারের ফজিলত তুলে ধরুন।',
    preferredTopic: 'মেরাজের রাতে সালাতের উপহার'
  },
  // Sha'ban
  {
    month: 8,
    day: 15,
    nameBn: 'পবিত্র শবে বরাত (১৫ই শাবান দিবাগত রাত)',
    nameEn: 'Shab-e-Barat (Lailatul Bara’at)',
    category: 'special_night',
    suggestedTheme: 'golden',
    suggestedRatio: '1080x1080',
    recommendedPostTime: '১৪ই শাবান বিকেল ও রাতে',
    guideline: 'ক্ষমা প্রার্থনা, ইস্তিগফার এবং নফল ইবাদতের দোয়া শেয়ার করুন।',
    preferredTopic: 'শবে বরাতে আল্লাহর অসীম ক্ষমা'
  },
  // Ramadan
  {
    month: 9,
    day: 1,
    nameBn: 'মাহে রমজানের শুভ সূচনা (১ম রোজা)',
    nameEn: '1st Ramadan Welcome',
    category: 'ramadan',
    suggestedTheme: 'golden',
    suggestedRatio: '1080x1350',
    recommendedPostTime: 'চাঁদ দেখার পর রাতে অথবা ১ম রোজার সেহরির পূর্বে',
    guideline: 'রমজানুল মোবারকের শুভেচ্ছা এবং রোজা রাখার নিয়ত ও সেহরি-ইফতারের ফজিলত।',
    preferredTopic: 'মাহে রমজানের শুভাগমন'
  },
  {
    month: 9,
    day: 17,
    nameBn: 'ঐতিহাসিক বদর দিবস (১৭ই রমজান)',
    nameEn: 'Battle of Badr Day (17th Ramadan)',
    category: 'ramadan',
    suggestedTheme: 'black',
    suggestedRatio: '1080x1080',
    recommendedPostTime: 'সকাল ৮:০০ - ৯:০০',
    guideline: 'সত্য ও মিথ্যার পার্থক্যের ঐতিহাসিক বদর প্রান্তরের ঈমানী শিক্ষার পোস্টার।',
    preferredTopic: 'বদর প্রান্তরে ঈমানী বিজয়'
  },
  {
    month: 9,
    day: 27,
    nameBn: 'পবিত্র শবে কদর (২৭শে রমজানের মহিমান্বিত রাত)',
    nameEn: 'Laylatul Qadr (27th Ramadan)',
    category: 'special_night',
    suggestedTheme: 'golden',
    suggestedRatio: '1080x1920',
    recommendedPostTime: '২৬শে রমজান সন্ধ্যা ৬:০০ - ৭:০০',
    guideline: 'হাজার মাসের শ্রেষ্ঠ রাত, ক্ষমা ও লাইলাতুল কদরের মাসনূন দোয়া।',
    preferredTopic: 'শবে কদরের সর্বশ্রেষ্ঠ দোয়া'
  },
  // Shawwal
  {
    month: 10,
    day: 1,
    nameBn: 'পবিত্র ঈদুল ফিতর (১লা শাওয়াল)',
    nameEn: 'Eid-ul-Fitr Mubarak',
    category: 'eid',
    suggestedTheme: 'golden',
    suggestedRatio: '1080x1080',
    recommendedPostTime: 'চাঁদ রাতে ও ঈদের দিন সকালে ঈদের নামাজের পূর্বে',
    guideline: 'তাকাব্বালাল্লাহু মিন্না ওয়া মিনকুম, সদকাতুল ফিতর ও ঈদের শুভেচ্ছা।',
    preferredTopic: 'ঈদুল ফিতরের শুভেচ্ছা ও তাকবির'
  },
  // Dhul Hijjah
  {
    month: 12,
    day: 1,
    nameBn: 'জিলহজ্জের প্রথম দশকের সূচনা (১লা জিলহজ্জ)',
    nameEn: 'First 10 Days of Dhul-Hijjah',
    category: 'special_night',
    suggestedTheme: 'emerald',
    suggestedRatio: '1080x1080',
    recommendedPostTime: 'সকাল ৭:০০ - ৮:০০',
    guideline: 'দুনিয়ার শ্রেষ্ঠ ১০ দিনের আমল ও ফজিলত।',
    preferredTopic: 'জিলহজের শ্রেষ্ঠ ১০ দিনের আমল'
  },
  {
    month: 12,
    day: 9,
    nameBn: 'পবিত্র আরাফাহ দিবস ও হজের দিন (৯ই জিলহজ্জ)',
    nameEn: 'Day of Arafah',
    category: 'fasting',
    suggestedTheme: 'golden',
    suggestedRatio: '1080x1350',
    recommendedPostTime: '৮ই জিলহজ্জ রাত ও আরাফার দিন সকাল',
    guideline: 'আরাফার দিনের রোজা বিগত ও আগামী ১ বছরের গুনাহ মাফ করে।',
    preferredTopic: 'আরাফাহ দিবসের রোজা ও দোয়া'
  },
  {
    month: 12,
    day: 10,
    nameBn: 'পবিত্র ঈদুল আজহা ও কুরবানি (১০ই জিলহজ্জ)',
    nameEn: 'Eid-ul-Adha',
    category: 'eid',
    suggestedTheme: 'golden',
    suggestedRatio: '1080x1080',
    recommendedPostTime: 'ঈদের দিন সকাল ৭:০০',
    guideline: 'কুরবানির শিক্ষা, ইব্রাহিম (আ.)-এর ত্যাগ ও তাকবিরে তাশরিক।',
    preferredTopic: 'ঈদুল আজহা ও ত্যাগের মহিমা'
  }
];

/**
 * Accurately calculate the Hijri Date for any given Gregorian Date
 * using standard Intl.DateTimeFormat islamic-umalqura
 */
export function getHijriDateDetails(date: Date): HijriDateDetails {
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    const parts = formatter.formatToParts(date);
    let day = 1;
    let monthIndex = 1;
    let year = 1448;

    for (const p of parts) {
      if (p.type === 'day') day = parseInt(p.value, 10);
      else if (p.type === 'month') monthIndex = parseInt(p.value, 10);
      else if (p.type === 'year') year = parseInt(p.value, 10);
    }

    const monthObj = ISLAMIC_MONTHS.find((m) => m.index === monthIndex) || ISLAMIC_MONTHS[0];

    const formattedBn = `${toBengaliNumber(day)} ${monthObj.nameBn}, ${toBengaliNumber(year)} হিজরি`;
    const formattedEn = `${day} ${monthObj.nameEn}, ${year} AH`;

    return {
      day,
      monthIndex,
      monthNameEn: monthObj.nameEn,
      monthNameBn: monthObj.nameBn,
      year,
      formattedBn,
      formattedEn,
    };
  } catch {
    // Robust mathematical fallback
    const jd = Math.floor(date.getTime() / 86400000) + 2440587.5;
    const l = Math.floor(jd) - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;

    const mObj = ISLAMIC_MONTHS[(month - 1) % 12] || ISLAMIC_MONTHS[0];
    return {
      day: Math.max(1, Math.min(30, day)),
      monthIndex: Math.max(1, Math.min(12, month)),
      monthNameEn: mObj.nameEn,
      monthNameBn: mObj.nameBn,
      year,
      formattedBn: `${toBengaliNumber(day)} ${mObj.nameBn}, ${toBengaliNumber(year)} হিজরি`,
      formattedEn: `${day} ${mObj.nameEn}, ${year} AH`,
    };
  }
}

/**
 * Check if a given date has a special Islamic occasion or is Friday (Jummah)
 */
export function detectIslamicOccasion(
  gregorianDate: Date,
  hijri: HijriDateDetails
): {
  isSpecial: boolean;
  name: string;
  category: 'jummah' | 'ramadan' | 'eid' | 'fasting' | 'special_night' | 'daily';
  suggestedTheme: 'golden' | 'emerald' | 'black' | 'classic' | 'sapphire';
  suggestedRatio: '1080x1080' | '1080x1350' | '1080x1920';
  recommendedPostTime: string;
  guideline: string;
  preferredTopic?: string;
} {
  const dayOfWeek = gregorianDate.getDay(); // 5 = Friday

  // 1. Check fixed annual Islamic Occasions
  for (const occ of ISLAMIC_OCCASIONS) {
    if (occ.month === hijri.monthIndex && occ.day === hijri.day) {
      return {
        isSpecial: true,
        name: occ.nameBn,
        category: occ.category,
        suggestedTheme: occ.suggestedTheme,
        suggestedRatio: occ.suggestedRatio,
        recommendedPostTime: occ.recommendedPostTime,
        guideline: occ.guideline,
        preferredTopic: occ.preferredTopic,
      };
    }
  }

  // 2. Check Ramadan Daily Routine (Days 1 to 30)
  if (hijri.monthIndex === 9) {
    return {
      isSpecial: true,
      name: `মাহে রমজান - ${toBengaliNumber(hijri.day)}তম রোজা`,
      category: 'ramadan',
      suggestedTheme: dayOfWeek === 5 ? 'emerald' : 'golden',
      suggestedRatio: '1080x1350',
      recommendedPostTime: 'সেহরির পূর্বে (ভোর ৩:৩০ - ৪:১৫) বা ইফতারের আগে (বিকেল ৫:১৫)',
      guideline: `রমজানের ${toBengaliNumber(hijri.day)}তম রোজার রহমত, বরকত ও দোয়া সমৃদ্ধ কার্ড।`,
      preferredTopic: 'রমজানের আমল ও দোয়া',
    };
  }

  // 3. Check Friday (Jummah)
  if (dayOfWeek === 5) {
    return {
      isSpecial: true,
      name: 'পবিত্র জুমাবার (জুম্মা মোবারক)',
      category: 'jummah',
      suggestedTheme: 'emerald',
      suggestedRatio: '1080x1080',
      recommendedPostTime: 'বৃহস্পতিবার রাত ৮:০০ টা অথবা শুক্রবার সকাল ৮:০০ - ১০:৩০',
      guideline: 'সূরা আল-কাহাফ তেলাওয়াত, বেশি বেশি দরূদ পাঠ ও জুমার জামাতে অংশগ্রহণের তাগিদ।',
      preferredTopic: 'জুমার দিনের ফজিলত ও দরূদ',
    };
  }

  // 4. Check Ayyam al-Beed (13, 14, 15 of any Islamic month - Sunnah fasting)
  if (hijri.day >= 13 && hijri.day <= 15) {
    return {
      isSpecial: true,
      name: `আইয়ামে বীজের সুন্নাহ রোজা (${toBengaliNumber(hijri.day)}ই ${hijri.monthNameBn})`,
      category: 'fasting',
      suggestedTheme: 'classic',
      suggestedRatio: '1080x1080',
      recommendedPostTime: 'আগের দিন আসরের পর (বিকাল ৪:৩০ - ৫:৩০)',
      guideline: 'মাসের ১৩, ১৪ ও ১৫ তারিখে আইয়ামে বীজের তিনটি সুন্নাত রোজা রাখার সওয়াব ও উদ্বুদ্ধকরণ।',
      preferredTopic: 'আইয়ামে বীজের রোজা',
    };
  }

  // 5. Standard Daily Content
  const dailyThemes: Array<'golden' | 'classic' | 'sapphire'> = ['golden', 'classic', 'sapphire'];
  const theme = dailyThemes[hijri.day % dailyThemes.length];

  return {
    isSpecial: false,
    name: 'দৈনিক ইসলামিক বাণী ও আত্মশুদ্ধি',
    category: 'daily',
    suggestedTheme: theme,
    suggestedRatio: '1080x1080',
    recommendedPostTime: 'সকাল ৭:০০ - ৯:০০ (দিনের সূচনা) অথবা রাত ৮:৩০ - ৯:৩০',
    guideline: 'দৈনন্দিন জীবনকে পবিত্র ও সুন্দর করতে কুরআনের হেদায়াত ও সহীহ হাদিসের উপদেশ।',
    preferredTopic: 'দৈনিক হেদায়েত ও অনুপ্রেরণা',
  };
}
