import { PosterConfig, BrandConfig } from '../types';

// Map of common Surah and Hadith names to SEO-friendly English slugs
const ISLAMIC_TRANSLITERATION_MAP: Record<string, string> = {
  'আল-ফাতিহা': 'surah-al-fatiha',
  'আল-বাকারা': 'surah-al-baqarah',
  'আলে ইমরান': 'surah-al-imran',
  'আন-নিসা': 'surah-an-nisa',
  'আল-মায়েদা': 'surah-al-maidah',
  'আল-আনআম': 'surah-al-anam',
  'আল-আরাফ': 'surah-al-araf',
  'আল-আনফাল': 'surah-al-anfal',
  'আত-তাওবা': 'surah-at-tawbah',
  'ইউনুস': 'surah-yunus',
  'হুদ': 'surah-hud',
  'ইউসুফ': 'surah-yusuf',
  'আর-রা\'দ': 'surah-ar-rad',
  'ইবরাহীম': 'surah-ibrahim',
  'আল-হিজর': 'surah-al-hijr',
  'আন-নাহল': 'surah-an-nahl',
  'আল-ইসরা': 'surah-al-isra',
  'আল-কাহফ': 'surah-al-kahf',
  'মারিয়াম': 'surah-maryam',
  'ত্বা-হা': 'surah-taha',
  'আল-আম্বিয়া': 'surah-al-anbiya',
  'আল-হজ': 'surah-al-hajj',
  'আল-মুমিনুন': 'surah-al-muminun',
  'আন-নূর': 'surah-an-nur',
  'আল-ফুরকান': 'surah-al-furqan',
  'আশ-শুআরা': 'surah-ash-shuara',
  'আন-নামল': 'surah-an-naml',
  'আল-কাসাস': 'surah-al-qasas',
  'আল-আনকাবুত': 'surah-al-ankabut',
  'আর-রূম': 'surah-ar-rum',
  'লুকমান': 'surah-luqman',
  'আস-সাজদাহ': 'surah-as-sajdah',
  'আল-আহযাব': 'surah-al-ahzab',
  'সাবা': 'surah-saba',
  'ফাতির': 'surah-fatir',
  'ইয়াসীন': 'surah-yasin',
  'আস-সাফফাত': 'surah-as-saffat',
  'সোয়াদ': 'surah-sad',
  'আয-যুমার': 'surah-az-zumar',
  'আল-মু’মিন': 'surah-ghafir',
  'হা-মীম আস-সাজদা': 'surah-fussilat',
  'আশ-শূরা': 'surah-ash-shura',
  'আয-যুখরুফ': 'surah-az-zukhruf',
  'আদ-দুখান': 'surah-ad-dukhan',
  'আল-জাসিয়াহ': 'surah-al-jathiyah',
  'আল-আহকাফ': 'surah-al-ahqaf',
  'মুহাম্মদ': 'surah-muhammad',
  'আল-ফাতহ': 'surah-al-fath',
  'আল-হুজুরাত': 'surah-al-hujurat',
  'ক্বাফ': 'surah-qaf',
  'আয-যারিয়াত': 'surah-adh-dhariyat',
  'আত-তূর': 'surah-at-tur',
  'আন-নাজম': 'surah-an-najm',
  'আল-ক্বামার': 'surah-al-qamar',
  'আর-রহমান': 'surah-ar-rahman',
  'আল-ওয়াকিয়াহ': 'surah-al-waqiah',
  'আল-হাদীদ': 'surah-al-hadid',
  'আল-মুজাদালাহ': 'surah-al-mujadila',
  'আল-হাশর': 'surah-al-hashr',
  'আল-মুমতাহিনাহ': 'surah-al-mumtahanah',
  'আস-সাফ': 'surah-as-saff',
  'আল-জুমুআহ': 'surah-al-jumuah',
  'আল-মুনাফিকুন': 'surah-al-munafiqun',
  'আত-তাগাবুন': 'surah-at-taghabun',
  'আত-ত্বালাক': 'surah-at-talaq',
  'আত-তাহরীম': 'surah-at-tahrim',
  'আল-মুলক': 'surah-al-mulk',
  'আল-ক্বলম': 'surah-al-qalam',
  'আল-হাক্বক্বাহ': 'surah-al-haqqah',
  'আল-মাআরিজ': 'surah-al-maarij',
  'নূহ': 'surah-nuh',
  'আল-জ্বিন': 'surah-al-jinn',
  'আল-মুয্যাম্মিল': 'surah-al-muzzammil',
  'আল-মুদ্দাসসির': 'surah-al-muddathir',
  'আল-ক্বিয়ামাহ': 'surah-al-qiyamah',
  'আল-ইনসান': 'surah-al-insan',
  'আল-মুরসালাত': 'surah-al-mursalat',
  'আন-নাবা': 'surah-an-naba',
  'আন-নাযিআত': 'surah-an-naziat',
  'আবাসা': 'surah-abasa',
  'আত-তাকবীর': 'surah-at-takwir',
  'আল-ইনফিতার': 'surah-al-infitar',
  'আল-মুতাফফিফীন': 'surah-al-mutaffifin',
  'আল-ইনশিক্বাক্ব': 'surah-al-inshiqaq',
  'আল-বুরূজ': 'surah-al-buruj',
  'আত-তারিক্ব': 'surah-at-tariq',
  'আল-আলা': 'surah-al-ala',
  'আল-গাশিয়াহ': 'surah-al-ghashiyah',
  'আল-ফাজর': 'surah-al-fajr',
  'আল-বালাদ': 'surah-al-balad',
  'আশ-শামস': 'surah-ash-shams',
  'আল-লাইল': 'surah-al-layl',
  'আদ্ব-দুহা': 'surah-ad-duha',
  'আল-ইনশিরাহ': 'surah-al-inshirah',
  'আত-তীন': 'surah-at-tin',
  'আল-আলাক্ব': 'surah-al-alaq',
  'আল-ক্বদর': 'surah-al-qadr',
  'আল-বাইয়িনাহ': 'surah-al-bayyinah',
  'আয-যিলযাল': 'surah-az-zalzalah',
  'আল-আদিয়াত': 'surah-al-adiyat',
  'আল-ক্বারিআহ': 'surah-al-qariah',
  'আত-তাকাসুর': 'surah-at-takathur',
  'আল-আসর': 'surah-al-asr',
  'আল-হুমাযাহ': 'surah-al-humazah',
  'আল-ফীল': 'surah-al-fil',
  'কুরাইশ': 'surah-quraysh',
  'আল-মাউন': 'surah-al-maun',
  'আল-কাওসার': 'surah-al-kawthar',
  'আল-কাফিরুন': 'surah-al-kafirun',
  'আন-নাসর': 'surah-an-nasr',
  'আল-লাহাব': 'surah-al-lahab',
  'আল-ইখলাস': 'surah-al-ikhlas',
  'আল-ফালাক্ব': 'surah-al-falaq',
  'আন-নাস': 'surah-an-nas',
  // Hadith Books
  'সহিহ বুখারি': 'sahih-al-bukhari',
  'সহিহ মুসলিম': 'sahih-muslim',
  'জামে আত-তিরমিযি': 'jami-at-tirmidhi',
  'সুনান ইবনে মাজাহ': 'sunan-ibn-majah',
  'সুনানে আবু দাউদ': 'sunan-abu-dawood',
  'সুনানে আন-নাসায়ী': 'sunan-an-nasai',
};

// Map Bengali digits to English digits
const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function convertBnDigitsToEn(str: string): string {
  return str.replace(/[০-৯]/g, (d) => BN_TO_EN_DIGITS[d] || d);
}

/**
 * Builds an SEO-friendly filename for Google Images, Facebook & Pinterest.
 * Example output:
 * "quran-surah-al-baqarah-ayah-153-waz-media.png"
 * "hadith-sahih-al-bukhari-1-niyat-waz-media.jpg"
 */
export function generateSeoFilename(
  poster: { bn?: string; ar?: string; ref?: string; [key: string]: any },
  brand: BrandConfig,
  extension: 'png' | 'jpg' = 'png'
): string {
  const ref = poster.ref || '';
  const brandSlug = (brand.name || 'waz-media')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  let prefix = 'islamic-quote';
  let refSlug = '';

  // Detect Quran vs Hadith
  if (ref.includes('সূরা') || ref.includes('সুরা')) {
    prefix = 'quran';
    // Find matching surah in map
    for (const [bnName, enSlug] of Object.entries(ISLAMIC_TRANSLITERATION_MAP)) {
      if (ref.includes(bnName)) {
        refSlug = enSlug;
        break;
      }
    }
    // Extract verse number
    const numbersMatch = ref.match(/[০-৯\d]+/g);
    if (numbersMatch && numbersMatch.length > 0) {
      const lastNum = numbersMatch[numbersMatch.length - 1];
      const enNum = convertBnDigitsToEn(lastNum);
      refSlug += `-ayah-${enNum}`;
    }
  } else if (ref.includes('হাদিস') || ref.includes('বুখারি') || ref.includes('মুসলিম') || ref.includes('তিরমিযি')) {
    prefix = 'hadith';
    for (const [bnName, enSlug] of Object.entries(ISLAMIC_TRANSLITERATION_MAP)) {
      if (ref.includes(bnName)) {
        refSlug = enSlug;
        break;
      }
    }
    const numbersMatch = ref.match(/[০-৯\d]+/g);
    if (numbersMatch && numbersMatch.length > 0) {
      const lastNum = numbersMatch[numbersMatch.length - 1];
      const enNum = convertBnDigitsToEn(lastNum);
      refSlug += `-hadith-${enNum}`;
    }
  }

  if (!refSlug) {
    // Fallback: extract sanitized chars
    refSlug = ref
      .replace(/[^\u0980-\u09FFa-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  }

  // Add keywords based on text
  let keyword = '';
  const text = (poster.bn || '').toLowerCase();
  if (text.includes('ধৈর্য') || text.includes('সবর')) keyword = 'sabr-patience';
  else if (text.includes('সালাত') || text.includes('নামাজ')) keyword = 'salat-prayer';
  else if (text.includes('তওবা') || text.includes('ক্ষমা')) keyword = 'tawbah-forgiveness';
  else if (text.includes('দোয়া') || text.includes('রব')) keyword = 'dua-supplication';
  else if (text.includes('জান্নাত')) keyword = 'jannah-paradise';
  else if (text.includes('মৃত্যু')) keyword = 'death-afterlife';
  else if (text.includes('জ্ঞান') || text.includes('ইলম')) keyword = 'knowledge-ilm';
  else if (text.includes('রিজিক') || text.includes('ভরসা')) keyword = 'tawakkul-provision';
  else if (text.includes('পিতা-মাতা') || text.includes('মা-বাবা')) keyword = 'parents-kindness';
  else if (text.includes('জুমার')) keyword = 'jummah-mubarak';

  const parts = [prefix, refSlug, keyword, brandSlug].filter(Boolean);
  const finalSlug = parts
    .join('-')
    .toLowerCase()
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');

  return `${finalSlug}.${extension}`;
}

/**
 * Generates high-engagement, fully SEO-optimized Facebook Post copy.
 */
export function generateLocalFacebookPost(
  poster: { bn: string; ar?: string; ref?: string; [key: string]: any },
  brand: BrandConfig
): {
  seoTitle: string;
  seoFilename: string;
  fbCaption: string;
  hashtags: string[];
  altText: string;
  isAiGenerated?: boolean;
} {
  const brandName = brand.name || 'WAZ MEDIA';
  const brandHandle = brand.handle || '@wazmedia.bd';
  const ref = poster.ref || 'কুরআন ও সহীহ হাদিস';
  const isHadith = ref.includes('হাদিস') || ref.includes('বুখারি') || ref.includes('মুসলিম') || ref.includes('তিরমিযি');

  // Extract verse or hadith number for tags
  const nums = ref.match(/[০-৯\d]+/g) || [];
  const primaryNum = nums.length > 0 ? nums[nums.length - 1] : '';

  // Determine post title hook
  let hook = 'জীবন বদলে দেওয়ার মতো এক ঐশী বাণী';
  const text = poster.bn || '';
  if (text.includes('ধৈর্য') || text.includes('সবর')) {
    hook = 'বিপদে মন শান্ত রাখার মহৌষধ | পরম ধৈর্যের পুরস্কার';
  } else if (text.includes('সালাত')) {
    hook = 'সালাত: অন্তরের নূর ও আল্লাহর সাথে কথোপকথন';
  } else if (text.includes('ক্ষমা') || text.includes('তওবা')) {
    hook = 'আল্লাহর রহমত থেকে কখনো নিরাশ হবেন না | ক্ষমার সুসংবাদ';
  } else if (text.includes('দোয়া')) {
    hook = 'বিপদ-আপদে আল্লাহর কাছে প্রার্থনা ও ইজাবত';
  } else if (text.includes('পিতা-মাতা')) {
    hook = 'পিতা-মাতার খেদমত ও তাদের জন্য শ্রেষ্ঠ দোয়া';
  } else if (text.includes('জুমার')) {
    hook = 'জুমার দিনের শ্রেষ্ঠত্ব, বরকত ও সুন্নত আমল';
  }

  const seoTitle = `${hook} — ${ref}`;
  const seoFilename = generateSeoFilename(poster, brand, 'png').replace('.png', '');

  // Tag bank
  const tags: string[] = [
    `#${brandName.replace(/[\s.-]+/g, '')}`,
    isHadith ? '#সহীহ_হাদিস' : '#কুরআনের_বাণী',
    isHadith ? '#রাসূলের_সুন্নাহ' : '#সূরা_ও_আয়াত',
    '#ইসলামিক_পোস্টার',
    '#দৈনিক_আমল',
    '#দ্বীনি_দাওয়াহ',
    '#IslamicPost',
    '#QuranAyat',
    '#IslamicReminder',
    '#WazMediaStudio',
  ];

  if (primaryNum) {
    tags.unshift(isHadith ? `#হাদিস_${primaryNum}` : `#আয়াত_${primaryNum}`);
  }

  const fbCaption = `🌸 ${seoTitle} 🌸

${poster.showAr && poster.ar ? `بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\n\n${poster.ar}\n\n` : ''}❝ ${poster.bn} ❞

📌 সূত্র: ${ref}

💡 হৃদয়স্পর্শী উপলব্ধি:
জীবনের কঠিনতম মুহূর্তে এই বাণীটি আমাদের অন্তরে স্থিরতা এনে দেয়। মহান আল্লাহর প্রতিটি ফয়সালার মধ্যেই আমাদের জন্য কল্যাণ লুকিয়ে থাকে।

🤲 দোয়া:
হে আমাদের পালনকর্তা! আমাদের ঈমানকে মজবুত করুন, সঠিক পথে অবিচল রাখুন এবং এই পবিত্র বাণীর ওপর আমল করার তৌফিক দান করুন। আমীন।

───────────────
📢 নিয়মিত বিশুদ্ধ ইসলামিক কনটেন্ট পেতে আমাদের পেজে যুক্ত থাকুন: ${brandHandle}
❤️ পোস্টটি ভালো লাগলে লাইক ও শেয়ার করে সদকায়ে জারিয়া হিসেবে অপরকে জানার সুযোগ করে দিন।

${tags.join(' ')}`;

  const altText = `${ref}: ${poster.bn} - ${brandName} ইসলামিক সোশ্যাল মিডিয়া পোস্টার`;

  return {
    seoTitle,
    seoFilename,
    fbCaption,
    hashtags: tags,
    altText,
  };
}
