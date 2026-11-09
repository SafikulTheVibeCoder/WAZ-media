import { SURAH_LIST, SurahMeta } from '../data/surahList';
import { QuoteItem } from '../types';

export interface AyahResult {
  surahNumber: number;
  surahNameBn: string;
  surahNameAr: string;
  ayahNumber: number;
  arabicText: string;
  bengaliText: string;
  reference: string;
}

/**
 * Fetch a specific Ayah by Surah number and Ayah number from Al-Quran API.
 * Uses both Arabic Uthmani and Muhiuddin Khan Bengali translation.
 */
export async function fetchAyahByNumber(surahNumber: number, ayahNumber: number): Promise<AyahResult | null> {
  try {
    const url = `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/editions/quran-uthmani,bn.bengali`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();
    
    if (json.code === 200 && Array.isArray(json.data) && json.data.length >= 2) {
      const arData = json.data[0];
      const bnData = json.data[1];
      const surahMeta = SURAH_LIST.find((s) => s.number === surahNumber);
      const surahName = surahMeta?.banglaName || arData.surah?.englishName || `সূরা ${surahNumber}`;

      return {
        surahNumber,
        surahNameBn: surahName,
        surahNameAr: arData.surah?.name || '',
        ayahNumber,
        arabicText: arData.text,
        bengaliText: bnData.text,
        reference: `সূরা ${surahName}, আয়াত: ${ayahNumber}`,
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching ayah:', err);
    return null;
  }
}

/**
 * Fetch all Ayahs of a given Surah from the Al-Quran API.
 */
export async function fetchFullSurah(surahNumber: number): Promise<AyahResult[]> {
  try {
    const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,bn.bengali`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Surah fetch error');
    const json = await res.json();

    if (json.code === 200 && Array.isArray(json.data) && json.data.length >= 2) {
      const arAyahs = json.data[0].ayahs || [];
      const bnAyahs = json.data[1].ayahs || [];
      const surahMeta = SURAH_LIST.find((s) => s.number === surahNumber);
      const surahName = surahMeta?.banglaName || json.data[0].englishName;

      const results: AyahResult[] = [];
      for (let i = 0; i < arAyahs.length; i++) {
        const ar = arAyahs[i];
        const bn = bnAyahs[i];
        if (ar && bn) {
          results.push({
            surahNumber,
            surahNameBn: surahName,
            surahNameAr: json.data[0].name || '',
            ayahNumber: ar.numberInSurah,
            arabicText: ar.text,
            bengaliText: bn.text,
            reference: `সূরা ${surahName}, আয়াত: ${ar.numberInSurah}`,
          });
        }
      }
      return results;
    }
    return [];
  } catch (err) {
    console.error('Error fetching full surah:', err);
    return [];
  }
}

/**
 * Search the entire Holy Quran by Bengali keyword (e.g. ধৈর্য, সালাত, ক্ষমা, জান্নাত)
 * Returns matched verses with full Arabic and Bengali text.
 */
export async function searchQuranByKeyword(keyword: string): Promise<AyahResult[]> {
  if (!keyword.trim()) return [];
  try {
    const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(keyword.trim())}/all/bn`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Search error');
    const json = await res.json();

    if (json.code === 200 && json.data && Array.isArray(json.data.matches)) {
      const matches = json.data.matches.slice(0, 40); // take up to 40 matches at a time
      const results: AyahResult[] = [];

      for (const m of matches) {
        const surahNum = m.surah.number;
        const ayahNum = m.numberInSurah;
        const surahMeta = SURAH_LIST.find((s) => s.number === surahNum);
        const surahName = surahMeta?.banglaName || m.surah.englishName;

        results.push({
          surahNumber: surahNum,
          surahNameBn: surahName,
          surahNameAr: m.surah.name || '',
          ayahNumber: ayahNum,
          arabicText: '', // Will be hydrated when viewed or on demand
          bengaliText: m.text,
          reference: `সূরা ${surahName}, আয়াত: ${ayahNum}`,
        });
      }

      return results;
    }
    return [];
  } catch (err) {
    console.error('Error searching Quran:', err);
    return [];
  }
}

/**
 * Fetch a batch of dynamic Quran ayahs across different Surahs
 * to break the restriction of static quotes and provide hundreds of verses.
 */
export async function fetchDynamicQuranBatch(page = 1, pageSize = 20): Promise<AyahResult[]> {
  try {
    // Curated list of spiritually uplifting Surahs to rotate through
    const targetSurahs = [1, 2, 3, 14, 18, 19, 21, 24, 25, 29, 31, 36, 39, 49, 55, 56, 59, 67, 73, 93, 94, 103, 112, 113, 114];
    const surahNum = targetSurahs[(page - 1) % targetSurahs.length];
    const fullSurah = await fetchFullSurah(surahNum);

    if (fullSurah.length > 0) {
      const startIndex = ((page - 1) * pageSize) % fullSurah.length;
      const sliced = fullSurah.slice(startIndex, startIndex + pageSize);
      return sliced.length > 0 ? sliced : fullSurah.slice(0, pageSize);
    }
    return [];
  } catch (err) {
    console.error('Error fetching dynamic quran batch:', err);
    return [];
  }
}
