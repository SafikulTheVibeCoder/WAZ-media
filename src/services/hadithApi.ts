/**
 * Hadith Service
 * Provides access to authentic Hadiths from Sahih al-Bukhari, Sahih Muslim,
 * Jami at-Tirmidhi, and 40 Hadith an-Nawawi.
 * Integrates Fawaz Ahmed Hadith API with verified fallback collections.
 */

export interface HadithItem {
  id: string;
  type: 'hadith';
  book: 'bukhari' | 'muslim' | 'tirmidhi' | 'nawawi' | 'abudawud';
  bookNameBn: string;
  hadithNumber: number;
  ar: string;
  bn: string;
  ref: string;
  topic: string;
  narrator?: string;
  cats: string[];
}

export const HADITH_TOPICS = [
  'সবর ও শোকর',
  'নিয়ত ও ইখলাস',
  'সালাত ও ইবাদত',
  'তাওবা ও ক্ষমা',
  'সদকা ও দান',
  'পিতা-মাতার খেদমত',
  'উত্তম চরিত্র ও আদব',
  'জ্ঞান ও কুরআন শিক্ষা',
  'রিজিক ও তাওয়াক্কুল',
  'মৃত্যু ও জান্নাত',
  'দোয়া ও জিকির',
  'ভ্রাতৃত্ব ও সামাজিক কল্যাণ',
] as const;

export const HADITH_BOOKS = [
  { id: 'all', nameBn: 'সকল সহীহ গ্রন্থ' },
  { id: 'bukhari', nameBn: 'সহীহ আল-বুখারী' },
  { id: 'muslim', nameBn: 'সহীহ মুসলিম' },
  { id: 'tirmidhi', nameBn: 'জামে আত-তিরমিযী' },
  { id: 'nawawi', nameBn: '৪০ হাদিস নববী' },
] as const;

// Curated authentic verified Hadith collection by topic
export const VERIFIED_HADITHS: HadithItem[] = [
  // 1. নিয়ত ও ইখলাস
  {
    id: 'h-bukhari-1',
    type: 'hadith',
    book: 'bukhari',
    bookNameBn: 'সহীহ আল-বুখারী',
    hadithNumber: 1,
    ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    bn: 'নিশ্চয়ই সমস্ত কাজের ফলাফল নিয়তের ওপর নির্ভরশীল। আর প্রত্যেক ব্যক্তি যা নিয়ত করবে তাই পাবে।',
    ref: 'সহীহ আল-বুখারী, হাদিস: ১',
    topic: 'নিয়ত ও ইখলাস',
    narrator: 'উমর ইবনুল খাত্তাব (রা.)',
    cats: ['হাদিস', 'নিয়ত ও ইখলাস', 'আমল'],
  },
  {
    id: 'h-muslim-2564',
    type: 'hadith',
    book: 'muslim',
    bookNameBn: 'সহীহ মুসলিম',
    hadithNumber: 2564,
    ar: 'إِنَّ اللَّهَ لاَ يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ',
    bn: 'নিশ্চয় আল্লাহ তোমাদের চেহারা ও ধন-সম্পদের দিকে তাকান না, বরং তিনি তোমাদের অন্তর ও আমলের দিকে তাকান।',
    ref: 'সহীহ মুসলিম, হাদিস: ২৫৬৪',
    topic: 'নিয়ত ও ইখলাস',
    narrator: 'আবু হুরায়রা (রা.)',
    cats: ['হাদিস', 'নিয়ত ও ইখলাস', 'অন্তর'],
  },

  // 2. সবর ও শোকর
  {
    id: 'h-muslim-2999',
    type: 'hadith',
    book: 'muslim',
    bookNameBn: 'সহীহ মুসলিম',
    hadithNumber: 2999,
    ar: 'عَجَبًا لأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ، إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ فَكَانَ خَيْرًا لَهُ، وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ',
    bn: 'মুমিনের বিষয় কতই না চমৎকার! তার প্রতিটি কাজই তার জন্য কল্যাণকর। সুখ-স্বাচ্ছন্দ্য এলে সে কৃতজ্ঞতা প্রকাশ করে—তা তার জন্য কল্যাণ বয়ে আনে। আর দুঃখ-বিপদ এলে সে ধৈর্য ধারণ করে—তাও তার জন্য কল্যাণকর হয়।',
    ref: 'সহীহ মুসলিম, হাদিস: ২৯৯৯',
    topic: 'সবর ও শোকর',
    narrator: 'সুহাইব (রা.)',
    cats: ['হাদিস', 'সবর ও শোকর', 'ঈমান'],
  },
  {
    id: 'h-bukhari-5645',
    type: 'hadith',
    book: 'bukhari',
    bookNameBn: 'সহীহ আল-বুখারী',
    hadithNumber: 5645,
    ar: 'مَا يُصِيبُ الْمُسْلِمَ مِنْ نَصَبٍ وَلاَ وَصَبٍ وَلاَ هَمٍّ وَلاَ حُزْنٍ وَلاَ أَذًى وَلاَ غَمٍّ حَتَّى الشَّوْكَةِ يُشَاكُهَا إِلاَّ كَفَّرَ اللَّهُ بِهَا مِنْ خَطَايَاهُ',
    bn: 'কোনো মুসলিম ক্লান্ত হলে, রোগাক্রান্ত হলে, দুশ্চিন্তাগ্রস্ত হলে, ব্যথিত হলে কিংবা কষ্টের শিকার হলে—এমনকি তার পায়ে একটি কাঁটা বিঁধলেও—আল্লাহ তা দ্বারা তার গুনাহসমূহ ক্ষমা করে দেন।',
    ref: 'সহীহ আল-বুখারী, হাদিস: ৫৬৪৫',
    topic: 'সবর ও শোকর',
    narrator: 'আবু সাঈদ ও আবু হুরায়রা (রা.)',
    cats: ['হাদিস', 'সবর ও শোকর', 'বিপদ'],
  },
  {
    id: 'h-tirmidhi-2396',
    type: 'hadith',
    book: 'tirmidhi',
    bookNameBn: 'জামে আত-তিরমিযী',
    hadithNumber: 2396,
    ar: 'مَنْ لَمْ يَشْكُرِ النَّاسَ لَمْ يَشْكُرِ اللَّهَ',
    bn: 'যে ব্যক্তি মানুষের প্রতি কৃতজ্ঞতা প্রকাশ করে না, সে আল্লাহর প্রতিও কৃতজ্ঞ হয় না।',
    ref: 'জামে আত-তিরমিযী, হাদিস: ১৯৫৪',
    topic: 'সবর ও শোকর',
    narrator: 'আবু হুরায়রা (রা.)',
    cats: ['হাদিস', 'সবর ও শোকর', 'কৃতজ্ঞতা'],
  },

  // 3. সালাত ও ইবাদত
  {
    id: 'h-bukhari-528',
    type: 'hadith',
    book: 'bukhari',
    bookNameBn: 'সহীহ আল-বুখারী',
    hadithNumber: 528,
    ar: 'الصَّلاَةُ عَلَى وَقْتِهَا، ثُمَّ بِرُّ الْوَالِدَيْنِ، ثُمَّ الْجِهَادُ فِي سَبِيلِ اللَّهِ',
    bn: 'আল্লাহর নিকট সর্বাধিক প্রিয় আমল হলো সময়মত সালাত আদায় করা, এরপর মাতা-পিতার সেবা করা, এরপর আল্লাহর পথে সংগ্রাম করা।',
    ref: 'সহীহ আল-বুখারী, হাদিস: ৫২৭',
    topic: 'সালাত ও ইবাদত',
    narrator: 'আব্দুল্লাহ ইবনু মাসউদ (রা.)',
    cats: ['হাদিস', 'সালাত ও ইবাদত', 'আমল'],
  },
  {
    id: 'h-muslim-223',
    type: 'hadith',
    book: 'muslim',
    bookNameBn: 'সহীহ মুসলিম',
    hadithNumber: 223,
    ar: 'الطُّهُورُ شَطْرُ الإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلأُ الْمِيزَانَ، وَالصَّلاَةُ نُورٌ',
    bn: 'পবিত্রতা ঈমানের অর্ধেক। ‘আলহামদুলিল্লাহ’ মিযানের পাল্লা পূর্ণ করে দেয়, আর সালাত হলো নূর বা আলোকবর্তিকা।',
    ref: 'সহীহ মুসলিম, হাদিস: ২২৩',
    topic: 'সালাত ও ইবাদত',
    narrator: 'আবু মালিক আল-আশআরী (রা.)',
    cats: ['হাদিস', 'সালাত ও ইবাদত', 'পবিত্রতা'],
  },

  // 4. তাওবা ও ক্ষমা
  {
    id: 'h-tirmidhi-2499',
    type: 'hadith',
    book: 'tirmidhi',
    bookNameBn: 'জামে আত-তিরমিযী',
    hadithNumber: 2499,
    ar: 'كُلُّ بَنِي آدَمَ خَطَّاءٌ وَخَيْرُ الْخَطَّائِينَ التَّوَّابُونَ',
    bn: 'প্রত্যেক আদম সন্তানই ভুলকারী বা পাপী, আর ভুলকারীদের মধ্যে সর্বোত্তম হলো তারা, যারা তাওবা করে ফিরে আসে।',
    ref: 'জামে আত-তিরমিযী, হাদিস: ২৪৯৯',
    topic: 'তাওবা ও ক্ষমা',
    narrator: 'আনাস (রা.)',
    cats: ['হাদিস', 'তাওবা ও ক্ষমা', 'অনুশোচনা'],
  },
  {
    id: 'h-muslim-2749',
    type: 'hadith',
    book: 'muslim',
    bookNameBn: 'সহীহ মুসলিম',
    hadithNumber: 2749,
    ar: 'إِنَّ اللَّهَ تَعَالَى يَبْسُطُ يَدَهُ بِاللَّيْلِ لِيَتُوبَ مُسِيءُ النَّهَارِ، وَيَبْسُطُ يَدَهُ بِالنَّهَارِ لِيَتُوبَ مُسِيءُ اللَّيْلِ',
    bn: 'নিশ্চয় মহান আল্লাহ রাতে তাঁর ক্ষমার হাত প্রসারিত করেন যাতে দিনের পাপী তাওবা করে, এবং দিনে তাঁর হাত প্রসারিত করেন যাতে রাতের পাপী তাওবা করে।',
    ref: 'সহীহ মুসলিম, হাদিস: ২৭৫৯',
    topic: 'তাওবা ও ক্ষমা',
    narrator: 'আবু মূসা আল-আশআরী (রা.)',
    cats: ['হাদিস', 'তাওবা ও ক্ষমা', 'আল্লাহর দয়া'],
  },

  // 5. সদকা ও দান
  {
    id: 'h-bukhari-1421',
    type: 'hadith',
    book: 'bukhari',
    bookNameBn: 'সহীহ আল-বুখারী',
    hadithNumber: 1421,
    ar: 'اتَّقُوا النَّارَ وَلَوْ بِشِقِّ تَمْرَةٍ',
    bn: 'তোমরা জাহান্নামের আগুন থেকে বাঁচো, একটি খেজুরের টুকরো সদকা করে হলেও।',
    ref: 'সহীহ আল-বুখারী, হাদিস: ১৪১৭',
    topic: 'সদকা ও দান',
    narrator: 'আদী ইবনু হাতিম (রা.)',
    cats: ['হাদিস', 'সদকা ও দান', 'দানশীলতা'],
  },
  {
    id: 'h-tirmidhi-1956',
    type: 'hadith',
    book: 'tirmidhi',
    bookNameBn: 'জামে আত-তিরমিযী',
    hadithNumber: 1956,
    ar: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ',
    bn: 'তোমার ভাইয়ের মুখে মুচকি হাসি দেওয়াও তোমার জন্য একটি সদকা।',
    ref: 'জামে আত-তিরমিযী, হাদিস: ১৯৫৬',
    topic: 'সদকা ও দান',
    narrator: 'আবু যার (রা.)',
    cats: ['হাদিস', 'সদকা ও দান', 'উত্তম আচরণ'],
  },
  {
    id: 'h-muslim-2588',
    type: 'hadith',
    book: 'muslim',
    bookNameBn: 'সহীহ মুসলিম',
    hadithNumber: 2588,
    ar: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ، وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلاَّ عِزًّا',
    bn: 'সদকা করার কারণে কখনো ধন-সম্পদ কমে যায় না। আর ক্ষমা প্রদর্শনকারীকে আল্লাহ কেবল সম্মানই বাড়িয়ে দেন।',
    ref: 'সহীহ মুসলিম, হাদিস: ২৫৮৮',
    topic: 'সদকা ও দান',
    narrator: 'আবু হুরায়রা (রা.)',
    cats: ['হাদিস', 'সদকা ও দান', 'ক্ষমা'],
  },

  // 6. পিতা-মাতার খেদমত
  {
    id: 'h-bukhari-5971',
    type: 'hadith',
    book: 'bukhari',
    bookNameBn: 'সহীহ আল-বুখারী',
    hadithNumber: 5971,
    ar: 'مَنْ أَحَقُّ النَّاسِ بِحُسْنِ صَحَابَتِي؟ قَالَ: أُمُّكَ. قَالَ: ثُمَّ مَنْ؟ قَالَ: ثُمَّ أُمُّكَ. قَالَ: ثُمَّ مَنْ؟ قَالَ: ثُمَّ أُمُّكَ. قَالَ: ثُمَّ مَنْ؟ قَالَ: ثُمَّ أَبُوكَ',
    bn: 'এক ব্যক্তি জিজ্ঞেস করলেন, হে আল্লাহর রাসূল! আমার উত্তম ব্যবহারের সবচেয়ে বেশি হকদার কে? তিনি বললেন: তোমার মা। বললেন: এরপর কে? বললেন: তোমার মা। বললেন: এরপর কে? বললেন: তোমার মা। বললেন: এরপর কে? বললেন: তোমার বাবা।',
    ref: 'সহীহ আল-বুখারী, হাদিস: ৫৯৭১',
    topic: 'পিতা-মাতার খেদমত',
    narrator: 'আবু হুরায়রা (রা.)',
    cats: ['হাদিস', 'পিতা-মাতার খেদমত', 'মা'],
  },
  {
    id: 'h-tirmidhi-1899',
    type: 'hadith',
    book: 'tirmidhi',
    bookNameBn: 'জামে আত-তিরমিযী',
    hadithNumber: 1899,
    ar: 'رِضَا الرَّبِّ فِي رِضَا الْوَالِدِ، وَسَخَطُ الرَّبِّ فِي سَخَطِ الْوَالِدِ',
    bn: 'পিতার সন্তুষ্টির ওপরই রবের সন্তুষ্টি নির্ভর করে, আর পিতার অসন্তুষ্টির ওপরই রবের অসন্তুষ্টি নেমে আসে।',
    ref: 'জামে আত-তিরমিযী, হাদিস: ১৮৯৯',
    topic: 'পিতা-মাতার খেদমত',
    narrator: 'আব্দুল্লাহ ইবনু আমর (রা.)',
    cats: ['হাদিস', 'পিতা-মাতার খেদমত', 'বাবা'],
  },

  // 7. উত্তম চরিত্র ও আদব
  {
    id: 'h-tirmidhi-2002',
    type: 'hadith',
    book: 'tirmidhi',
    bookNameBn: 'জামে আত-তিরমিযী',
    hadithNumber: 2002,
    ar: 'إِنَّ مِنْ أَحَبِّكُمْ إِلَيَّ وَأَقْرَبِكُمْ مِنِّي مَجْلِسًا يَوْمَ الْقِيَامَةِ أَحَاسِنَكُمْ أَخْلاَقًا',
    bn: 'কিয়ামতের দিন তোমাদের মধ্যে আমার সবচেয়ে প্রিয় এবং আমার সবচেয়ে নিকটবর্তী অবস্থানে থাকবে তারা, যাদের চরিত্র সবচেয়ে সুন্দর।',
    ref: 'জামে আত-তিরমিযী, হাদিস: ২০১১৮',
    topic: 'উত্তম চরিত্র ও আদব',
    narrator: 'জাবির (রা.)',
    cats: ['হাদিস', 'উত্তম চরিত্র ও আদব', 'আখলাক'],
  },
  {
    id: 'h-bukhari-10',
    type: 'hadith',
    book: 'bukhari',
    bookNameBn: 'সহীহ আল-বুখারী',
    hadithNumber: 10,
    ar: 'المُسْلِمُ مَنْ سَلِمَ المُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
    bn: 'প্রকৃত মুসলিম সে-ই, যার জিহ্বা ও হাত থেকে অন্য মুসলিম নিরাপদ থাকে।',
    ref: 'সহীহ আল-বুখারী, হাদিস: ১০',
    topic: 'উত্তম চরিত্র ও আদব',
    narrator: 'আব্দুল্লাহ ইবনু আমর (রা.)',
    cats: ['হাদিস', 'উত্তম চরিত্র ও আদব', 'শান্তি'],
  },

  // 8. জ্ঞান ও কুরআন শিক্ষা
  {
    id: 'h-bukhari-5027',
    type: 'hadith',
    book: 'bukhari',
    bookNameBn: 'সহীহ আল-বুখারী',
    hadithNumber: 5027,
    ar: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    bn: 'তোমাদের মধ্যে সর্বোত্তম ব্যক্তি সে, যে নিজে কুরআন শিখে এবং অপরকে শিক্ষা দেয়।',
    ref: 'সহীহ আল-বুখারী, হাদিস: ৫০২৭',
    topic: 'জ্ঞান ও কুরআন শিক্ষা',
    narrator: 'উসমান ইবনু আফফান (রা.)',
    cats: ['হাদিস', 'জ্ঞান ও কুরআন শিক্ষা', 'কুরআন'],
  },
  {
    id: 'h-muslim-2699',
    type: 'hadith',
    book: 'muslim',
    bookNameBn: 'সহীহ মুসলিম',
    hadithNumber: 2699,
    ar: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
    bn: 'যে ব্যক্তি জ্ঞান অন্বেষণের পথে পা বাড়ায়, আল্লাহ তার জন্য জান্নাতের পথ সহজ করে দেন।',
    ref: 'সহীহ মুসলিম, হাদিস: ২৬৯৯',
    topic: 'জ্ঞান ও কুরআন শিক্ষা',
    narrator: 'আবু হুরায়রা (রা.)',
    cats: ['হাদিস', 'জ্ঞান ও কুরআন শিক্ষা', 'ইলম'],
  },

  // 9. রিজিক ও তাওয়াক্কুল
  {
    id: 'h-tirmidhi-2344',
    type: 'hadith',
    book: 'tirmidhi',
    bookNameBn: 'জামে আত-তিরমিযী',
    hadithNumber: 2344,
    ar: 'لَوْ أَنَّكُمْ تَوَكَّلُونَ عَلَى اللَّهِ حَقَّ تَوَكُّلِهِ لَرَزَقَكُمْ كَمَا يَرْزُقُ الطَّيْرَ، تَغْدُو خِمَاصًا وَتَرُوحُ بِطَانًا',
    bn: 'যদি তোমরা আল্লাহর ওপর যথাযথ ভরসা করতে, তবে তিনি তোমাদের এমনভাবে রিজিক দান করতেন যেমন পাখিকে দান করেন—যা সকালে খালি পেটে বের হয় এবং সন্ধ্যায় পেট ভরে ফিরে আসে।',
    ref: 'জামে আত-তিরমিযী, হাদিস: ২৩৪৪',
    topic: 'রিজিক ও তাওয়াক্কুল',
    narrator: 'উমর ইবনুল খাত্তাব (রা.)',
    cats: ['হাদিস', 'রিজিক ও তাওয়াক্কুল', 'ভরসা'],
  },

  // 10. মৃত্যু ও জান্নাত
  {
    id: 'h-tirmidhi-2307',
    type: 'hadith',
    book: 'tirmidhi',
    bookNameBn: 'জামে আত-তিরমিযী',
    hadithNumber: 2307,
    ar: 'أَكْثِرُوا ذِكْرَ هَاذِمِ اللَّذَّاتِ: الْمَوْتِ',
    bn: 'তোমরা স্বাদ-আহ্লাদ ধ্বংসকারী বিষয়কে অর্থাৎ মৃত্যুকে বেশি বেশি স্মরণ করো।',
    ref: 'জামে আত-তিরমিযী, হাদিস: ২৩০৭',
    topic: 'মৃত্যু ও জান্নাত',
    narrator: 'আবু হুরায়রা (রা.)',
    cats: ['হাদিস', 'মৃত্যু ও জান্নাত', 'পরকাল'],
  },

  // 11. দোয়া ও জিকির
  {
    id: 'h-bukhari-6407',
    type: 'hadith',
    book: 'bukhari',
    bookNameBn: 'সহীহ আল-বুখারী',
    hadithNumber: 6407,
    ar: 'مَثَلُ الَّذِي يَذْكُرُ رَبَّهُ وَالَّذِي لاَ يَذْكُرُ رَبَّهُ مَثَلُ الْحَيِّ وَالْمَيِّتِ',
    bn: 'যে ব্যক্তি তার রবের জিকির করে আর যে ব্যক্তি জিকির করে না—তাদের দৃষ্টান্ত হলো জীবিত ও মৃতের মতো।',
    ref: 'সহীহ আল-বুখারী, হাদিস: ৬৪০৭',
    topic: 'দোয়া ও জিকির',
    narrator: 'আবু মূসা (রা.)',
    cats: ['হাদিস', 'দোয়া ও জিকির', 'জিকির'],
  },
  {
    id: 'h-tirmidhi-3372',
    type: 'hadith',
    book: 'tirmidhi',
    bookNameBn: 'জামে আত-তিরমিযী',
    hadithNumber: 3372,
    ar: 'الدُّعَاءُ هُوَ الْعِبَادَةُ',
    bn: 'দোয়া-ই হলো প্রকৃত ইবাদত।',
    ref: 'জামে আত-তিরমিযী, হাদিস: ৩৩৭২',
    topic: 'দোয়া ও জিকির',
    narrator: 'নুমান ইবনু বাশীর (রা.)',
    cats: ['হাদিস', 'দোয়া ও জিকির', 'ইবাদত'],
  },

  // 12. ভ্রাতৃত্ব ও সামাজিক কল্যাণ
  {
    id: 'h-bukhari-13',
    type: 'hadith',
    book: 'bukhari',
    bookNameBn: 'সহীহ আল-বুখারী',
    hadithNumber: 13,
    ar: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    bn: 'তোমাদের কেউ প্রকৃত মুমিন হতে পারবে না, যতক্ষণ না সে তার ভাইয়ের জন্য তা-ই পছন্দ করে যা সে নিজের জন্য পছন্দ করে।',
    ref: 'সহীহ আল-বুখারী, হাদিস: ১৩',
    topic: 'ভ্রাতৃত্ব ও সামাজিক কল্যাণ',
    narrator: 'আনাস (রা.)',
    cats: ['হাদিস', 'ভ্রাতৃত্ব ও সামাজিক কল্যাণ', 'ভালোবাসা'],
  },
  {
    id: 'h-muslim-2567',
    type: 'hadith',
    book: 'muslim',
    bookNameBn: 'সহীহ মুসলিম',
    hadithNumber: 2567,
    ar: 'لاَ تَحَاسَدُوا، وَلاَ تَنَاجَشُوا، وَلاَ تَبَاغَضُوا، وَلاَ تَدَابَرُوا، وَكُونُوا عِبَادَ اللَّهِ إِخْوَانًا',
    bn: 'তোমরা একে অপরের প্রতি হিংসা করো না, প্রতারণা করো না, শত্রুতা পোষণ করো না, সম্পর্কচ্ছেদ করো না। বরং তোমরা আল্লাহর বান্দা হিসেবে পরস্পরের ভাই ভাই হয়ে যাও।',
    ref: 'সহীহ মুসলিম, হাদিস: ২৫৬৪',
    topic: 'ভ্রাতৃত্ব ও সামাজিক কল্যাণ',
    narrator: 'আবু হুরায়রা (রা.)',
    cats: ['হাদিস', 'ভ্রাতৃত্ব ও সামাজিক কল্যাণ', 'ভ্রাতৃত্ব'],
  },
];

/**
 * Fetch Hadiths by Topic from local verified database or API
 */
export async function fetchHadithsByTopic(topic: string, bookFilter: string = 'all'): Promise<HadithItem[]> {
  // First filter verified local collection
  let matched = VERIFIED_HADITHS.filter((h) => {
    const topicMatch = topic === 'all' || h.topic === topic || h.cats.includes(topic);
    const bookMatch = bookFilter === 'all' || h.book === bookFilter;
    return topicMatch && bookMatch;
  });

  // If topic didn't match directly, try keyword match
  if (matched.length === 0) {
    matched = VERIFIED_HADITHS.filter((h) => {
      const bookMatch = bookFilter === 'all' || h.book === bookFilter;
      const textMatch = h.bn.includes(topic) || h.topic.includes(topic) || h.cats.some((c) => c.includes(topic));
      return bookMatch && textMatch;
    });
  }

  // Fallback to general authentic hadiths if still empty
  if (matched.length === 0) {
    matched = VERIFIED_HADITHS.filter((h) => bookFilter === 'all' || h.book === bookFilter);
  }

  return matched;
}

/**
 * Fetch a specific Hadith from Fawaz Ahmed Hadith API with Arabic and Bengali editions
 */
export async function fetchLiveHadithByNumber(book: 'bukhari' | 'muslim' | 'tirmidhi' | 'nawawi', hadithNumber: number): Promise<HadithItem | null> {
  try {
    const benUrl = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-${book}/${hadithNumber}.json`;
    const araUrl = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${book}/${hadithNumber}.json`;

    const [benRes, araRes] = await Promise.all([
      fetch(benUrl).catch(() => null),
      fetch(araUrl).catch(() => null),
    ]);

    if (!benRes || !benRes.ok) return null;

    const benJson = await benRes.json();
    const araJson = araRes && araRes.ok ? await araRes.json() : null;

    const benHadith = benJson?.hadiths?.[0];
    const araHadith = araJson?.hadiths?.[0];

    if (!benHadith || !benHadith.text) return null;

    const bookNames: Record<string, string> = {
      bukhari: 'সহীহ আল-বুখারী',
      muslim: 'সহীহ মুসলিম',
      tirmidhi: 'জামে আত-তিরমিযী',
      nawawi: '৪০ হাদিস নববী',
    };

    return {
      id: `h-${book}-${hadithNumber}`,
      type: 'hadith',
      book,
      bookNameBn: bookNames[book] || book,
      hadithNumber,
      ar: araHadith?.text || '',
      bn: benHadith.text,
      ref: `${bookNames[book] || book}, হাদিস: ${hadithNumber}`,
      topic: 'সহীহ হাদিস',
      cats: ['হাদিস', bookNames[book] || book],
    };
  } catch (err) {
    console.error('Error fetching live hadith:', err);
    return null;
  }
}
