import { VERIFIED_QUOTES } from './verifiedQuotesLibrary';
import { QuoteItem, ThemeConfig, AspectRatioOption, BrandConfig, PosterConfig } from '../types';

export const CATEGORIES: string[] = [
  'সব',
  'কুরআন',
  'হাদিস',
  'দোয়া',
  'সবর ও শোকর',
  'তাওবা ও ক্ষমা',
  'সালাত ও ইবাদত',
  'পিতা-মাতা ও পরিবার',
  'জান্নাত ও নেক আমল',
  'মৃত্যু ও পরকাল',
  'রিজিক ও তাওয়াক্কুল',
  'জুমার দিন',
  'ইসলামিক উপদেশ',
];

export const INITIAL_QUOTES: QuoteItem[] = VERIFIED_QUOTES.map((q) => ({
  ...q,
  cats: Array.from(new Set(q.cats)),
}));

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'golden',
    name: 'রয়্যাল মিডনাইট গোল্ড',
    nameEn: 'Royal Midnight Gold',
    text: '#FFFFFF',
    accent: '#d4af37',
    ar: '#fadb7f',
    border: '#d4af37',
    bgDesc: 'ডিপ মিডনাইট চারকোল ও খাঁটি সোনার আভা',
    previewBg: 'linear-gradient(135deg, #101722 0%, #06090d 100%)',
  },
  {
    id: 'emerald',
    name: 'এমারেল্ড রওজা',
    nameEn: 'Emerald Rawda',
    text: '#ffffff',
    accent: '#d4af37',
    ar: '#f8e6a8',
    border: '#c8a646',
    bgDesc: 'গভীর সবুজ ও সোনালি কারুকার্য',
    previewBg: 'linear-gradient(135deg, #092c20 0%, #041b13 60%, #02110c 100%)',
  },
  {
    id: 'black',
    name: 'প্রিমিয়াম কৃষ্ণচূড়া',
    nameEn: 'Royal Obsidian',
    text: '#fbf5e6',
    accent: '#e5b842',
    ar: '#ffd700',
    border: '#d4af37',
    bgDesc: 'কালো ক্যানভাসে খাঁটি সোনার দীপ্তি',
    previewBg: 'linear-gradient(135deg, #181411 0%, #090705 100%)',
  },
  {
    id: 'classic',
    name: 'ঐতিহ্যবাহী পার্চমেন্ট',
    nameEn: 'Antique Manuscript',
    text: '#341f0f',
    accent: '#835222',
    ar: '#542e0e',
    border: '#c7aa7c',
    bgDesc: 'প্রাচীন পান্ডুলিপি ও মোমের স্নিগ্ধতা',
    previewBg: 'linear-gradient(135deg, #faf4e6 0%, #e8dcbe 100%)',
  },
  {
    id: 'sapphire',
    name: 'নীল গম্বুজ',
    nameEn: 'Sapphire Dome',
    text: '#f0f6fc',
    accent: '#e0b44a',
    ar: '#fde68a',
    border: '#d4af37',
    bgDesc: 'গভীর নীল আসমান ও সোনালি ক্যালিগ্রাফি',
    previewBg: 'linear-gradient(135deg, #0f1f38 0%, #071120 100%)',
  },
  {
    id: 'crimson',
    name: 'মরোক্কান রুবি',
    nameEn: 'Moroccan Ruby',
    text: '#fff5f5',
    accent: '#f3c969',
    ar: '#fde68a',
    border: '#e0a93b',
    bgDesc: 'অভিজাত লালচে মেরুন ও জাফরান রঙ',
    previewBg: 'linear-gradient(135deg, #3d0c11 0%, #1e0508 100%)',
  },
  {
    id: 'minimal',
    name: 'স্নিগ্ধ শুভ্র',
    nameEn: 'Purity Minimal',
    text: '#1c1917',
    accent: '#78531d',
    ar: '#292524',
    border: '#d6c4a5',
    bgDesc: 'আধুনিক রুচিশীল ও সাদামাটা ডিজাইন',
    previewBg: 'linear-gradient(135deg, #ffffff 0%, #f4eee3 100%)',
  },
  {
    id: 'nokia',
    name: 'রেট্রো মনোটোন',
    nameEn: 'Vintage Retro',
    text: '#172808',
    accent: '#2c4a14',
    ar: '#172808',
    border: '#3c631b',
    bgDesc: 'নস্টালজিক পিক্সেল ও ক্লাসিক গ্রিন',
    previewBg: 'linear-gradient(135deg, #abc57c 0%, #87a553 100%)',
  }
];

export const ASPECT_RATIOS: AspectRatioOption[] = [
  {
    id: '1080x1080',
    label: 'বর্গাকার (Square)',
    ratio: '1:1',
    description: 'ফেসবুক ও ইনস্টাগ্রাম পোস্টের জন্য আদর্শ',
    width: 1080,
    height: 1080,
  },
  {
    id: '1080x1350',
    label: 'লম্বা (Portrait)',
    ratio: '4:5',
    description: 'মোবাইল ফিডে সবচেয়ে বেশি জায়গা জুড়ে ভিউ',
    width: 1080,
    height: 1350,
  },
  {
    id: '1080x1920',
    label: 'স্টোরি / রিলস (Story)',
    ratio: '9:16',
    description: 'হোয়াটসঅ্যাপ স্ট্যাটাস ও টিকটক/রিলস',
    width: 1080,
    height: 1920,
  },
  {
    id: '1200x630',
    label: 'ব্যানার (Landscape)',
    ratio: '1.91:1',
    description: 'ফেসবুক কভার ও লিংক থাম্বনেইল',
    width: 1200,
    height: 630,
  }
];

export const DEFAULT_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' width='256' height='256' fill='none'%3E%3Cg stroke='%23d4af37' stroke-width='3.5' stroke-linejoin='round' stroke-linecap='round'%3E%3Crect x='42' y='42' width='172' height='172' rx='10' fill='none'/%3E%3Crect x='42' y='42' width='172' height='172' rx='10' transform='rotate(45 128 128)' fill='none'/%3E%3C/g%3E%3Ccircle cx='128' cy='128' r='74' stroke='%23d4af37' stroke-width='1.5' stroke-dasharray='3 5' opacity='0.8'/%3E%3Cpath d='M80 102 L98 162 L128 124 L158 162 L176 102' stroke='%23d4af37' stroke-width='8.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M128 72 L131 81 L140 84 L131 87 L128 96 L125 87 L116 84 L125 81 Z' fill='%23d4af37'/%3E%3Ccircle cx='128' cy='24' r='3' fill='%23d4af37'/%3E%3Ccircle cx='128' cy='232' r='3' fill='%23d4af37'/%3E%3Ccircle cx='24' cy='128' r='3' fill='%23d4af37'/%3E%3Ccircle cx='232' cy='128' r='3' fill='%23d4af37'/%3E%3C/svg%3E";

export interface BrandLogoPreset {
  id: string;
  name: string;
  svgData: string;
}

export const BRAND_LOGO_PRESETS: BrandLogoPreset[] = [
  {
    id: 'waz-signature',
    name: 'ওয়াজ মিডিয়া সিগনেচার (অক্টাগ্রাম ও মনোগ্রাম)',
    svgData: DEFAULT_LOGO,
  },
  {
    id: 'dome-minaret',
    name: 'রওজা ও মিনার (Dome & Minaret)',
    svgData: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' width='256' height='256' fill='none'%3E%3Ccircle cx='128' cy='128' r='112' stroke='%23d4af37' stroke-width='3' fill='none'/%3E%3Ccircle cx='128' cy='128' r='98' stroke='%23d4af37' stroke-width='1.5' stroke-dasharray='4 4' opacity='0.7'/%3E%3Cpath d='M84 176 L84 140 C84 100 128 76 128 76 C128 76 172 100 172 140 L172 176 Z' stroke='%23d4af37' stroke-width='4' fill='none' stroke-linejoin='round'/%3E%3Cpath d='M110 176 L110 150 C110 138 128 130 128 130 C128 130 146 138 146 150 L146 176 Z' fill='%23d4af37' opacity='0.4' stroke='%23d4af37' stroke-width='2'/%3E%3Cpath d='M128 48 L128 76' stroke='%23d4af37' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M132 50 C125 50 120 56 120 63 C120 70 125 76 132 76 C128 73 126 69 126 63 C126 57 128 53 132 50 Z' fill='%23d4af37'/%3E%3C/svg%3E",
  },
  {
    id: 'quran-rehal',
    name: 'পবিত্র কুরআন ও রিহাল (Quran & Rehal)',
    svgData: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' width='256' height='256' fill='none'%3E%3Ccircle cx='128' cy='128' r='112' stroke='%23d4af37' stroke-width='3' fill='none'/%3E%3Cpath d='M68 116 C88 100 124 102 128 112 C132 102 168 100 188 116 L188 160 C168 144 132 146 128 156 C124 146 88 144 68 160 Z' stroke='%23d4af37' stroke-width='4' fill='none' stroke-linejoin='round'/%3E%3Cline x1='128' y1='112' x2='128' y2='156' stroke='%23d4af37' stroke-width='3'/%3E%3Cpath d='M88 170 L168 190 M168 170 L88 190' stroke='%23d4af37' stroke-width='3.5' stroke-linecap='round'/%3E%3Ccircle cx='128' cy='78' r='6' fill='%23d4af37'/%3E%3C/svg%3E",
  },
  {
    id: 'crescent-star',
    name: 'ক্যালিগ্রাফিক হেলাল ও তারা (Crescent & Star)',
    svgData: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' width='256' height='256' fill='none'%3E%3Ccircle cx='128' cy='128' r='112' stroke='%23d4af37' stroke-width='3' fill='none'/%3E%3Cpath d='M146 76 C106 76 76 102 76 142 C76 176 102 202 138 202 C154 202 168 196 178 186 C136 186 112 162 112 134 C112 106 134 84 174 84 C166 79 156 76 146 76 Z' fill='%23d4af37'/%3E%3Cpath d='M168 108 L171 118 L181 121 L171 124 L168 134 L165 124 L155 121 L165 118 Z' fill='%23d4af37'/%3E%3C/svg%3E",
  }
];

export const DEFAULT_BRAND: BrandConfig = {
  name: 'WAZ MEDIA',
  tagline: 'INSPIRES FAITH, ILLUMINATING MINDS',
  handle: '@wazmedia.bd',
  showLogo: true,
  showTag: true,
  showHandle: false,
  logo: DEFAULT_LOGO,
  pos: 'top-center',
  logoSize: 110,
  watermark: false
};

export const DEFAULT_POSTER: PosterConfig = {
  bn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
  ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
  ref: 'সূরা আশ-শারহ, আয়াত: ৫-৬',
  showAr: true,
  showBismillah: true,
  theme: 'golden',
  size: '1080x1080',
  font: 'Noto Sans Bengali',
  fontSize: 68,
  arabicSizeRatio: 1.15,
  lineHeight: 1.5,
  autoFit: true,
  textColor: '#FFFFFF',
  accentColor: '#d4af37',
  arabicColor: '#fadb7f',
  align: 'center',
  refPos: 'below',
  overlay: 0.35,
  bgType: 'theme',
  bgPattern: 'geometric',
  borderStyle: 'double',
  decorCorner: true,
  decorDivider: true,
  bgDataUrl: null,
};
