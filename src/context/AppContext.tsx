import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PosterConfig, BrandConfig, SavedDesign, UserStats, QuoteItem } from '../types';
import { DEFAULT_POSTER, DEFAULT_BRAND, DEFAULT_LOGO, INITIAL_QUOTES } from '../data/quotes';

interface AppContextType {
  currentView: string;
  setCurrentView: (view: string) => void;
  poster: PosterConfig;
  setPoster: React.Dispatch<React.SetStateAction<PosterConfig>>;
  updatePosterField: <K extends keyof PosterConfig>(field: K, value: PosterConfig[K]) => void;
  brand: BrandConfig;
  setBrand: React.Dispatch<React.SetStateAction<BrandConfig>>;
  updateBrandField: <K extends keyof BrandConfig>(field: K, value: BrandConfig[K]) => void;
  savedDesigns: SavedDesign[];
  saveCurrentDesign: (thumbDataUrl: string) => void;
  deleteDesign: (id: string) => void;
  duplicateDesign: (id: string) => void;
  loadDesignForEdit: (design: SavedDesign) => void;
  loadQuoteToPoster: (quote: QuoteItem) => void;
  stats: UserStats;
  incrementStat: (key: keyof UserStats) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toast: string | null;
  showToast: (msg: string) => void;
  activeEditingId: string | null;
  startNewDesign: () => void;
  resetBrandDefaults: () => void;
  exportBackup: () => void;
  importBackup: (jsonData: string) => boolean;
}

const STORAGE_KEYS = {
  POSTER: 'waz_media_current_poster',
  BRAND: 'waz_media_brand_settings',
  DESIGNS: 'waz_media_saved_designs',
  STATS: 'waz_media_user_stats',
  FAVORITES: 'waz_media_favorites'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);

  // Initial State from localStorage
  const [poster, setPoster] = useState<PosterConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSTER);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If font was old default, upgrade to Noto Sans Bengali
        if (parsed.font === 'Hind Siliguri' || !parsed.font) {
          parsed.font = 'Noto Sans Bengali';
        }
        if (parsed.ref === 'সূরা আল-বাকারা ২:১৫৩') {
          parsed.ref = 'সূরা আল-বাকারা, আয়াত: ১৫৩';
        }
        return { ...DEFAULT_POSTER, ...parsed };
      }
      return DEFAULT_POSTER;
    } catch {
      return DEFAULT_POSTER;
    }
  });

  const [brand, setBrand] = useState<BrandConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRAND);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically migrate old glossy base64 logo to the new clean matte vector logo
        if (!parsed.logo || parsed.logo.includes('PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYi')) {
          parsed.logo = DEFAULT_LOGO;
        }
        return { ...DEFAULT_BRAND, ...parsed };
      }
      return DEFAULT_BRAND;
    } catch {
      return DEFAULT_BRAND;
    }
  });

  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DESIGNS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATS);
      return saved ? JSON.parse(saved) : { exports: 0, caps: 0, saved: 0 };
    } catch {
      return { exports: 0, caps: 0, saved: 0 };
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved) : ['q-2-153', 'q-94-5', 'h-bukhari-1'];
    } catch {
      return [];
    }
  });

  const [toast, setToast] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.POSTER, JSON.stringify(poster));
    } catch (e) {
      console.warn('Storage failed for poster:', e);
    }
  }, [poster]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BRAND, JSON.stringify(brand));
    } catch (e) {
      console.warn('Storage failed for brand:', e);
    }
  }, [brand]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DESIGNS, JSON.stringify(savedDesigns));
    } catch (e) {
      console.warn('Storage failed for savedDesigns:', e);
    }
  }, [savedDesigns]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('Storage failed for stats:', e);
    }
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Storage failed for favorites:', e);
    }
  }, [favorites]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const updatePosterField = <K extends keyof PosterConfig>(field: K, value: PosterConfig[K]) => {
    setPoster((prev) => ({ ...prev, [field]: value }));
  };

  const updateBrandField = <K extends keyof BrandConfig>(field: K, value: BrandConfig[K]) => {
    setBrand((prev) => ({ ...prev, [field]: value }));
  };

  const incrementStat = (key: keyof UserStats) => {
    setStats((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  const loadQuoteToPoster = (quote: QuoteItem) => {
    setPoster((prev) => ({
      ...prev,
      bn: quote.bn,
      ar: quote.ar,
      ref: quote.ref,
      showAr: Boolean(quote.ar),
    }));
    setActiveEditingId(null);
    setCurrentView('poster');
    showToast('ক্যাপশন পোস্টার স্টুডিওতে লোড করা হয়েছে');
  };

  const saveCurrentDesign = (thumbDataUrl: string) => {
    const now = Date.now();
    const cleanConfig = { ...poster };

    if (activeEditingId) {
      // Update existing
      setSavedDesigns((prev) =>
        prev.map((item) =>
          item.id === activeEditingId
            ? { ...item, updated: now, poster: cleanConfig, thumb: thumbDataUrl }
            : item
        )
      );
      showToast('ডিজাইন সফলভাবে আপডেট করা হয়েছে');
    } else {
      // Create new
      const newId = 'dsg_' + now.toString(36) + Math.random().toString(36).substring(2, 6);
      const title = poster.bn ? poster.bn.slice(0, 45) + '...' : 'নতুন পোস্টার';
      const newDesign: SavedDesign = {
        id: newId,
        title,
        created: now,
        updated: now,
        poster: cleanConfig,
        thumb: thumbDataUrl,
      };
      setSavedDesigns((prev) => [newDesign, ...prev]);
      setActiveEditingId(newId);
      incrementStat('saved');
      showToast('ডিজাইন সফলভাবে সংরক্ষিত হয়েছে');
    }
  };

  const deleteDesign = (id: string) => {
    setSavedDesigns((prev) => prev.filter((d) => d.id !== id));
    if (activeEditingId === id) {
      setActiveEditingId(null);
    }
    showToast('ডিজাইন মুছে ফেলা হয়েছে');
  };

  const duplicateDesign = (id: string) => {
    const target = savedDesigns.find((d) => d.id === id);
    if (!target) return;
    const now = Date.now();
    const dup: SavedDesign = {
      ...target,
      id: 'dsg_' + now.toString(36) + Math.random().toString(36).substring(2, 6),
      title: `${target.title} (কপি)`,
      created: now,
      updated: now,
    };
    setSavedDesigns((prev) => [dup, ...prev]);
    showToast('ডিজাইনের অনুলিপি তৈরি হয়েছে');
  };

  const loadDesignForEdit = (design: SavedDesign) => {
    setPoster({ ...DEFAULT_POSTER, ...design.poster });
    setActiveEditingId(design.id);
    setCurrentView('poster');
    showToast('ডিজাইন এডিটর ওপেন করা হয়েছে');
  };

  const startNewDesign = () => {
    setPoster({ ...DEFAULT_POSTER });
    setActiveEditingId(null);
    showToast('নতুন ক্যানভাস তৈরি হয়েছে');
  };

  const resetBrandDefaults = () => {
    setBrand({ ...DEFAULT_BRAND });
    showToast('ব্র্যান্ড ডিফল্ট সেটিংসে ফিরিয়ে আনা হয়েছে');
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        showToast('পছন্দের তালিকা থেকে বাদ দেওয়া হয়েছে');
        return prev.filter((item) => item !== id);
      } else {
        showToast('পছন্দের তালিকায় যুক্ত হয়েছে');
        return [...prev, id];
      }
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const exportBackup = () => {
    const backupData = {
      brand,
      savedDesigns,
      stats,
      version: 1,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waz-media-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ডাটা ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে');
  };

  const importBackup = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.brand) setBrand(parsed.brand);
      if (Array.isArray(parsed.savedDesigns)) setSavedDesigns(parsed.savedDesigns);
      if (parsed.stats) setStats(parsed.stats);
      showToast('ব্যাকআপ সফলভাবে রিস্টোর হয়েছে');
      return true;
    } catch {
      showToast('ভুল ফাইল ফরম্যাট! ব্যাকআপ লোড করা যায়নি');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        poster,
        setPoster,
        updatePosterField,
        brand,
        setBrand,
        updateBrandField,
        savedDesigns,
        saveCurrentDesign,
        deleteDesign,
        duplicateDesign,
        loadDesignForEdit,
        loadQuoteToPoster,
        stats,
        incrementStat,
        favorites,
        toggleFavorite,
        isFavorite,
        toast,
        showToast,
        activeEditingId,
        startNewDesign,
        resetBrandDefaults,
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
