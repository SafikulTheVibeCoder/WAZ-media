import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to convert Bengali numbers and text to clean SEO slug
function createSeoSlug(text: string, ref: string, brandName: string): string {
  const sanitize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const refSlug = sanitize(ref || 'islamic-quote');
  const brandSlug = sanitize(brandName || 'waz-media');
  const excerptSlug = sanitize(text.slice(0, 40));

  return `${refSlug}-${excerptSlug}-${brandSlug}`.replace(/-+/g, '-');
}

// Generate fallback SEO Facebook package when API key is not present or API call fails
function generateFallbackSeo(data: {
  bn: string;
  ar?: string;
  ref: string;
  brandName?: string;
  brandHandle?: string;
  topic?: string;
}) {
  const brand = data.brandName || 'WAZ MEDIA';
  const handle = data.brandHandle || '@wazmedia.bd';
  const refClean = data.ref || 'কুরআনুল কারীম';
  const isHadith = refClean.includes('হাদিস') || refClean.includes('বুখারি') || refClean.includes('মুসলিম') || refClean.includes('তিরমিযি');

  const categoryTitle = isHadith ? 'নবীজি (সা.) এর অমূল্য বাণী' : 'পবিত্র কুরআনের আলোকবর্তিকা';
  const seoTitle = `${data.topic ? data.topic + ' — ' : ''}${categoryTitle} | ${refClean}`;
  const slug = createSeoSlug(data.bn, data.ref, brand);

  const tags = [
    `#${brand.replace(/\s+/g, '')}`,
    isHadith ? '#সহীহ_হাদিস' : '#পবিত্র_কুরআন',
    isHadith ? '#হাদিসের_আলো' : '#কুরআনের_বাণী',
    '#ইসলামিক_পোস্ট',
    '#দৈনিক_আমল',
    '#দ্বীনি_কথা',
    '#IslamicReminders',
    '#QuranVerse',
    '#Sunnah',
    '#DailyIslamicQuote'
  ];

  const fbCaption = `✨ ${seoTitle} ✨

${data.ar ? `${data.ar}\n\n` : ''}❝ ${data.bn} ❞

📖 সূত্র: ${refClean}

🌿 আজকের শিক্ষা ও আত্মোপলব্ধি:
আল্লাহর বাণী ও রাসূলের (সা.) সুন্নাহ আমাদের দৈনন্দিন জীবনের একমাত্র সঠিক দিশারী। এই শিক্ষাকে নিজের জীবনে ধারণ করুন এবং পরিবার ও প্রিয়জনদের মাঝে ছড়িয়ে দিন। 

🤲 আল্লাহ তাআলা আমাদের সবাইকে সঠিক বুঝ ও আমল করার তাওফিক দান করুন। আমিন।

📢 নিয়মিত বিশুদ্ধ ইসলামিক পোস্ট পেতে পেজটি ফলো করুন: ${handle}
📌 পোস্টটি শেয়ার করে সদকায়ে জারিয়ার সওয়াব হাসিল করুন।

${tags.join(' ')}`;

  const altText = `${refClean}: ${data.bn} - ${brand} ইসলামিক পোস্টার`;

  return {
    seoTitle,
    seoFilename: slug,
    fbCaption,
    reflection: 'আল্লাহর বাণী ও রাসূলের (সা.) সুন্নাহ আমাদের অন্তরে প্রশান্তি এনে দেয় এবং সঠিক পথের সন্ধান দেয়।',
    hashtags: tags,
    altText
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API endpoint for SEO-optimized Facebook caption & title generation
  app.post('/api/generate-caption', async (req: Request, res: Response) => {
    try {
      const { bn, ar, ref, brandName, brandHandle, topic } = req.body || {};

      if (!bn || !ref) {
        return res.status(400).json({ error: 'Bengali quote and reference are required' });
      }

      // Check if GEMINI_API_KEY is available
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        const fallback = generateFallbackSeo({ bn, ar, ref, brandName, brandHandle, topic });
        return res.json({ ...fallback, isAiGenerated: false });
      }

      // Initialize Gemini SDK with gemini-3.8-flash
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are a social media copywriter and SEO expert specializing in viral, highly engaging, authentic Islamic content for Facebook pages (specifically for the brand "${brandName || 'WAZ MEDIA'}").

Based on this authentic Islamic quote:
- Arabic: "${ar || 'N/A'}"
- Bengali: "${bn}"
- Reference: "${ref}"
- Topic/Category: "${topic || 'ইসলামিক জ্ঞান ও শিক্ষা'}"

Generate a fully SEO-friendly Facebook post package in Bengali.
Requirements:
1. "seoTitle": An eye-catching, highly clickable headline in Bengali (30-60 chars) highlighting the core wisdom and the exact reference (e.g. "বিপদে ধৈর্য ও সালাতের অলৌকিক শক্তি | ${ref}").
2. "seoFilename": A clean, SEO-optimized Latin/English URL-friendly filename slug without special characters or file extension (e.g. "quran-surah-al-baqarah-ayah-153-sabr-salat-waz-media").
3. "fbCaption": A beautifully formatted Facebook post ready to copy-paste. Include:
   - Catchy hook and emojis
   - The Arabic text (if provided) with proper spacing
   - The Bengali translation in quotes
   - The exact reference clearly marked
   - A short heart-touching reflection/lesson (২-৩ বাক্য) explaining how to apply this in daily life
   - A short heartfelt Dua (দোয়া)
   - Call to action asking readers to like, save and share for Sadqah Jariyah
   - Page credit with ${brandHandle || '@wazmedia.bd'}
   - 8 to 12 viral, high-volume hashtags in Bengali and English (e.g. #কুরআন #সূরা_আল_বাকারা #আয়াত১৫৩ #সবর #সালাত #ইসলামিক_পোস্ট #IslamicReminder #WazMedia)
4. "reflection": A concise 1-2 sentence core spiritual takeaway.
5. "hashtags": An array of 8-12 high-ranking Facebook hashtags starting with #.
6. "altText": An accessible, SEO-optimized description of the poster for social media image indexing.`;

      // Wrap API call in timeout so UI never hangs if network is slow
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), 4000)
      );

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are an elite Islamic social media manager and SEO specialist. Always output valid JSON matching the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                seoTitle: { type: Type.STRING, description: 'Viral SEO title for Facebook post' },
                seoFilename: { type: Type.STRING, description: 'Clean SEO slug for the image file' },
                fbCaption: { type: Type.STRING, description: 'Complete formatted Facebook post caption' },
                reflection: { type: Type.STRING, description: 'Core spiritual lesson' },
                hashtags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Viral hashtag bank',
                },
                altText: { type: Type.STRING, description: 'Image alt text for SEO' },
              },
              required: ['seoTitle', 'seoFilename', 'fbCaption', 'hashtags'],
            },
          },
        }),
        timeoutPromise,
      ]);

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      const parsed = JSON.parse(responseText);
      return res.json({
        seoTitle: parsed.seoTitle || `${ref} - ${topic || 'ইসলামিক বাণী'}`,
        seoFilename: parsed.seoFilename || createSeoSlug(bn, ref, brandName || 'waz-media'),
        fbCaption: parsed.fbCaption,
        reflection: parsed.reflection,
        hashtags: parsed.hashtags || [],
        altText: parsed.altText || `${ref}: ${bn}`,
        isAiGenerated: true,
      });
    } catch (error: any) {
      console.error('Error generating caption:', error);
      // Fallback gracefully on any API error
      const { bn, ar, ref, brandName, brandHandle, topic } = req.body || {};
      const fallback = generateFallbackSeo({
        bn: bn || '',
        ar,
        ref: ref || '',
        brandName,
        brandHandle,
        topic,
      });
      return res.json({ ...fallback, isAiGenerated: false, warning: 'AI service unavailable; used algorithmic SEO generator.' });
    }
  });

  // In-memory cache for Quran API responses
  const quranCache = new Map<string, any>();

  // Quran Surah API endpoint
  app.get('/api/quran/surah/:num', async (req: Request, res: Response) => {
    try {
      const num = parseInt(req.params.num, 10);
      if (isNaN(num) || num < 1 || num > 114) {
        return res.status(400).json({ error: 'Invalid surah number (1-114)' });
      }

      const cacheKey = `surah_${num}`;
      if (quranCache.has(cacheKey)) {
        return res.json(quranCache.get(cacheKey));
      }

      const response = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,bn.bengali`);
      if (!response.ok) throw new Error('Failed to fetch from Quran API');
      const data = await response.json();
      quranCache.set(cacheKey, data);
      res.json(data);
    } catch (err: any) {
      console.error('Quran Surah API error:', err.message);
      res.status(500).json({ error: 'Failed to fetch surah data' });
    }
  });

  // Quran Ayah API endpoint
  app.get('/api/quran/ayah/:surah/:ayah', async (req: Request, res: Response) => {
    try {
      const surah = parseInt(req.params.surah, 10);
      const ayah = parseInt(req.params.ayah, 10);
      if (isNaN(surah) || isNaN(ayah)) {
        return res.status(400).json({ error: 'Invalid surah or ayah number' });
      }

      const cacheKey = `ayah_${surah}_${ayah}`;
      if (quranCache.has(cacheKey)) {
        return res.json(quranCache.get(cacheKey));
      }

      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-uthmani,bn.bengali`);
      if (!response.ok) throw new Error('Failed to fetch ayah');
      const data = await response.json();
      quranCache.set(cacheKey, data);
      res.json(data);
    } catch (err: any) {
      console.error('Quran Ayah API error:', err.message);
      res.status(500).json({ error: 'Failed to fetch ayah data' });
    }
  });

  // Hadith explorer & generator endpoint
  app.post('/api/hadith/generate', async (req: Request, res: Response) => {
    const { topic, count = 5 } = req.body || {};
    const queryTopic = topic || 'সবর ও শোকর';

    // Comprehensive verified authentic fallback hadith database
    const VERIFIED_COLLECTION: Record<string, any[]> = {
      'সবর ও শোকর': [
        {
          id: 'hadith-muslim-2999',
          type: 'hadith',
          ar: 'عَجَبًا لأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ وَلَيْسَ ذَاكَ لأَحَدٍ إِلاَّ لِلْمُؤْمِنِ إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ فَكَانَ خَيْرًا لَهُ وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ',
          bn: 'মুমিনের অবস্থা সত্যিই আশ্চর্যজনক! তার সকল কাজই কল্যাণময়। যদি সে কোনো সুখ-শান্তি লাভ করে তবে সে কৃতজ্ঞতা প্রকাশ করে, যা তার জন্য কল্যাণকর। আর যদি সে দুঃখ-কষ্টে নিপতিত হয় তবে সে ধৈর্য ধারণ করে, ফলে তাও তার জন্য কল্যাণ বয়ে আনে।',
          ref: 'সহীহ মুসলিম, হাদিস: ২৯৯৯',
          topic: 'সবর ও শোকর',
          cats: ['সবর', 'শোকর', 'ঈমান']
        },
        {
          id: 'hadith-bukhari-1469',
          type: 'hadith',
          ar: 'وَمَنْ يَتَصَبَّرْ يُصَبِّرْهُ اللَّهُ، وَمَا أُعْطِيَ أَحَدٌ عَطَاءً خَيْرًا وَأَوْسَعَ مِنَ الصَّبْرِ',
          bn: 'যে ব্যক্তি ধৈর্য ধারণের চেষ্টা করে, আল্লাহ তাকে ধৈর্যশীল বানিয়ে দেন। আর কাউকে ধৈর্যের চেয়ে উত্তম ও প্রশস্ত আর কোনো নিয়ামত দান করা হয়নি।',
          ref: 'সহীহ বুখারি, হাদিস: ১৪৬৯',
          topic: 'সবরের মর্যাদা',
          cats: ['সবর', 'চরিত্র']
        },
        {
          id: 'hadith-bukhari-5641',
          type: 'hadith',
          ar: 'مَا يُصِيبُ الْمُسْلِمَ مِنْ نَصَبٍ وَلاَ وَصَبٍ وَلاَ هَمٍّ وَلاَ حُزْنٍ وَلاَ أَذًى وَلاَ غَمٍّ حَتَّى الشَّوْكَةِ يُشَاكُهَا إِلاَّ كَفَّرَ اللَّهُ بِهَا مِنْ خَطَايَاهُ',
          bn: 'মুসলিম ব্যক্তির ওপর যেসব ক্লান্তি, রোগ, দুশ্চিন্তা, শোক, কষ্ট ও উদ্বেগের আঘাত আসে—এমনকি একটি কাঁটাও যদি তার গায়ে বিঁধে—তার বিনিময়ে আল্লাহ তার গুনাহসমূহ মাফ করে দেন।',
          ref: 'সহীহ বুখারি, হাদিস: ৫৬৪১',
          topic: 'বিপদে গুনাহ মাফ',
          cats: ['সবর', 'ক্ষমা']
        },
        {
          id: 'hadith-bukhari-1302',
          type: 'hadith',
          ar: 'إِنَّمَا الصَّبْرُ عِنْدَ الصَّدْمَةِ الأُولَى',
          bn: 'প্রকৃত ধৈর্য তো বিপদের প্রথম আঘাতেই প্রকাশ পায়।',
          ref: 'সহীহ বুখারি, হাদিস: ১৩০২',
          topic: 'বিপদের শুরুতে সবর',
          cats: ['সবর', 'আখলাক']
        }
      ],
      'নিয়ত ও ইখলাস': [
        {
          id: 'hadith-bukhari-1',
          type: 'hadith',
          ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
          bn: 'নিশ্চয়ই সমস্ত কাজের ফলাফল নিয়তের ওপর নির্ভরশীল। আর প্রত্যেক ব্যক্তি যা নিয়ত করবে তাই পাবে।',
          ref: 'সহীহ বুখারি, হাদিস: ১',
          topic: 'নিয়ত ও সততা',
          cats: ['হাদিস', 'নিয়ত ও আমল']
        },
        {
          id: 'hadith-muslim-2564',
          type: 'hadith',
          ar: 'إِنَّ اللَّهَ لاَ يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ',
          bn: 'নিশ্চয় আল্লাহ তোমাদের রূপ-চেহারা ও ধন-সম্পদের দিকে তাকান না, বরং তিনি তোমাদের অন্তর ও আমলের দিকে তাকান।',
          ref: 'সহীহ মুসলিম, হাদিস: ২৫৬৪',
          topic: 'অন্তরের পবিত্রতা',
          cats: ['ইখলাস', 'অন্তর']
        }
      ]
    };

    const getFallback = () => {
      const match = VERIFIED_COLLECTION[queryTopic];
      if (match && match.length > 0) {
        return { items: match };
      }
      // General fallbacks across all verified hadiths
      const allItems = Object.values(VERIFIED_COLLECTION).flat();
      return { items: allItems.slice(0, count) };
    };

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.json(getFallback());
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });

      const prompt = `Return ${count} 100% authentic Hadiths (from Sahih al-Bukhari, Sahih Muslim, Jami at-Tirmidhi, Sunan Abi Dawood) related to the topic "${queryTopic}".
Each hadith must include:
- id: unique string
- type: "hadith"
- ar: Full Arabic text of the Hadith
- bn: Accurate, lucid Bengali translation
- ref: Exact reference in Bengali (e.g. "সহীহ বুখারি, হাদিস: ১")
- topic: 2-4 word theme in Bengali
- cats: array of 2-3 categories in Bengali`;

      // Set a 4-second timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timeout')), 4500)
      );

      const generatePromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an authentic Islamic Hadith scholar. Only return verified Hadiths with exact references.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    ar: { type: Type.STRING },
                    bn: { type: Type.STRING },
                    ref: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    cats: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['id', 'type', 'ar', 'bn', 'ref', 'topic'],
                },
              },
            },
            required: ['items'],
          },
        },
      });

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      const parsed = JSON.parse(response.text || '{"items":[]}');
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        return res.json(parsed);
      }
      return res.json(getFallback());
    } catch (err: any) {
      console.warn('Hadith generator fallback activated:', err.message);
      // Graceful verified fallback - never fail with 500
      return res.json(getFallback());
    }
  });

  // Proxy endpoint for Fawaz Ahmed Hadith API
  app.get('/api/hadith/book/:book/:number', async (req: Request, res: Response) => {
    try {
      const book = req.params.book;
      const num = parseInt(req.params.number, 10);
      if (isNaN(num)) return res.status(400).json({ error: 'Invalid number' });

      const benUrl = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-${book}/${num}.json`;
      const araUrl = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${book}/${num}.json`;

      const [benRes, araRes] = await Promise.all([
        fetch(benUrl).catch(() => null),
        fetch(araUrl).catch(() => null),
      ]);

      if (!benRes || !benRes.ok) {
        return res.status(404).json({ error: 'Hadith not found' });
      }

      const benJson = await benRes.json();
      const araJson = araRes && araRes.ok ? await araRes.json() : null;

      res.json({
        bengali: benJson?.hadiths?.[0] || null,
        arabic: araJson?.hadiths?.[0] || null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      timestamp: new Date().toISOString()
    });
  });

  // Setup Vite in development or serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WAZ MEDIA Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
