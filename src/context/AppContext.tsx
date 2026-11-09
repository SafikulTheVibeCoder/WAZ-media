import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PosterConfig, BrandConfig, SavedDesign, UserStats, QuoteItem, PosterPreset, PosterPresetConfig } from '../types';
import { DEFAULT_POSTER, DEFAULT_BRAND, DEFAULT_LOGO, INITIAL_QUOTES } from '../data/quotes';
import { BUILTIN_PRESETS } from '../data/presets';
import { auth } from '../services/firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import {
  syncUserProfile,
  saveDesignToCloud,
  loadUserDesigns,
  deleteDesignFromCloud,
  savePresetToCloud,
  loadUserPresets,
  deletePresetFromCloud,
  saveBrandSettingsToCloud,
  loadUserBrandSettings,
  saveFavoritesToCloud,
  loadUserFavorites,
  migrateLocalStorageToCloud,
} from '../services/firebaseDb';

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
  // Presets feature
  presets: PosterPreset[];
  activePresetId: string | null;
  saveCurrentAsPreset: (name: string, description?: string, category?: string) => PosterPreset;
  applyPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
  updatePreset: (presetId: string, name: string, description?: string) => void;
  resetPresetsToDefault: () => void;
  // Firebase Auth & Cloud Sync
  currentUser: User | null;
  isAuthLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isCloudSyncing: boolean;
  migrateLocalData: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const STORAGE_KEYS = {
  POSTER: 'waz_media_current_poster',
  BRAND: 'waz_media_brand_settings',
  DESIGNS: 'waz_media_saved_designs',
  STATS: 'waz_media_user_stats',
  FAVORITES: 'waz_media_favorites',
  PRESETS: 'waz_media_poster_presets',
  ACTIVE_PRESET: 'waz_media_active_preset',
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
        if (parsed.bn && parsed.bn.includes('নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি। নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।')) {
          parsed.bn = 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।';
          parsed.ar = 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا';
          parsed.ref = 'সূরা আশ-শারহ, আয়াত: ৫-৬';
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

  const [presets, setPresets] = useState<PosterPreset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return BUILTIN_PRESETS;
    } catch {
      return BUILTIN_PRESETS;
    }
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET) || 'preset-golden-classic';
    } catch {
      return 'preset-golden-classic';
    }
  });

  const [toast, setToast] = useState<string | null>(null);

  // Firebase Auth and Cloud Sync states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Auth observer and auto-hydration from Cloud Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        try {
          // Sync profile to users collection
          await syncUserProfile(user);

          // 1. Fetch user designs from Firestore
          const cloudDesigns = await loadUserDesigns(user.uid);
          if (cloudDesigns && cloudDesigns.length > 0) {
            setSavedDesigns((prevLocal) => {
              const map = new Map<string, SavedDesign>();
              cloudDesigns.forEach((d) => map.set(d.id, d));
              prevLocal.forEach((d) => {
                if (!map.has(d.id)) map.set(d.id, d);
              });
              return Array.from(map.values());
            });
          }

          // 2. Fetch custom presets from Firestore
          const cloudPresets = await loadUserPresets(user.uid);
          if (cloudPresets && cloudPresets.length > 0) {
            setPresets((prev) => {
              const map = new Map<string, PosterPreset>();
              BUILTIN_PRESETS.forEach((p) => map.set(p.id, p));
              prev.forEach((p) => map.set(p.id, p));
              cloudPresets.forEach((p) => map.set(p.id, p));
              return Array.from(map.values());
            });
          }

          // 3. Fetch user brand settings from Firestore
          const cloudBrand = await loadUserBrandSettings(user.uid);
          if (cloudBrand) {
            setBrand((prev) => ({ ...prev, ...cloudBrand }));
          }

          // 4. Fetch user favorites from Firestore
          const cloudFavs = await loadUserFavorites(user.uid);
          if (cloudFavs && cloudFavs.length > 0) {
            setFavorites(cloudFavs);
          }
        } catch (err) {
          console.warn('Initial cloud load warning:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    } catch (e) {
      console.warn('Storage failed for presets:', e);
    }
  }, [presets]);

  useEffect(() => {
    try {
      if (activePresetId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET, activePresetId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PRESET);
      }
    } catch (e) {
      console.warn('Storage failed for activePresetId:', e);
    }
  }, [activePresetId]);

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
    setBrand((prev) => {
      const updated = { ...prev, [field]: value };
      if (currentUser) {
        saveBrandSettingsToCloud(currentUser.uid, updated).catch((err) =>
          console.warn('Cloud brand save warning:', err)
        );
      }
      return updated;
    });
  };

  const incrementStat = (key: keyof UserStats) => {
    setStats((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  const loadQuoteToPoster = (quote: QuoteItem) => {
    // If an active preset exists, automatically apply its design parameters
    const activePreset = activePresetId ? presets.find((p) => p.id === activePresetId) : null;
    const cfg = activePreset?.config;

    setPoster((prev) => ({
      ...prev,
      ...(cfg
        ? {
            theme: cfg.theme,
            size: cfg.size,
            font: cfg.font,
            fontSize: cfg.fontSize,
            arabicSizeRatio: cfg.arabicSizeRatio,
            lineHeight: cfg.lineHeight,
            autoFit: cfg.autoFit,
            textColor: cfg.textColor,
            accentColor: cfg.accentColor,
            arabicColor: cfg.arabicColor,
            align: cfg.align,
            refPos: cfg.refPos,
            overlay: cfg.overlay,
            bgType: cfg.bgType,
            bgPattern: cfg.bgPattern,
            borderStyle: cfg.borderStyle,
            decorCorner: cfg.decorCorner,
            decorDivider: cfg.decorDivider,
            showBismillah: cfg.showBismillah,
          }
        : {}),
      bn: quote.bn,
      ar: quote.ar,
      ref: quote.ref,
      showAr: Boolean(quote.ar),
    }));
    setActiveEditingId(null);
    setCurrentView('poster');
    showToast(
      activePreset
        ? `"${activePreset.name}" স্টাইলে পোস্টার তৈরি হয়েছে!`
        : 'বাণীটি পোস্টার স্টুডিওতে সরাসরি লোড করা হয়েছে'
    );
  };

  const saveCurrentDesign = (thumbDataUrl: string) => {
    const now = Date.now();
    const cleanConfig = { ...poster };

    if (activeEditingId) {
      // Update existing
      const updatedDesign: SavedDesign = {
        id: activeEditingId,
        title: poster.bn ? poster.bn.slice(0, 45) + '...' : 'আপডেটকৃত পোস্টার',
        created: now,
        updated: now,
        poster: cleanConfig,
        thumb: thumbDataUrl,
      };
      setSavedDesigns((prev) =>
        prev.map((item) =>
          item.id === activeEditingId ? updatedDesign : item
        )
      );
      if (currentUser) {
        saveDesignToCloud(currentUser.uid, updatedDesign).catch((e) =>
          console.warn('Cloud design save warning:', e)
        );
      }
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
      if (currentUser) {
        saveDesignToCloud(currentUser.uid, newDesign).catch((e) =>
          console.warn('Cloud design save warning:', e)
        );
      }
      showToast('ডিজাইন সফলভাবে সংরক্ষিত হয়েছে');
    }
  };

  const deleteDesign = (id: string) => {
    setSavedDesigns((prev) => prev.filter((d) => d.id !== id));
    if (activeEditingId === id) {
      setActiveEditingId(null);
    }
    if (currentUser) {
      deleteDesignFromCloud(currentUser.uid, id).catch((e) =>
        console.warn('Cloud design delete warning:', e)
      );
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
    if (currentUser) {
      saveDesignToCloud(currentUser.uid, dup).catch((e) =>
        console.warn('Cloud design duplicate warning:', e)
      );
    }
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
    if (currentUser) {
      saveBrandSettingsToCloud(currentUser.uid, DEFAULT_BRAND).catch((e) =>
        console.warn('Cloud reset warning:', e)
      );
    }
    showToast('ব্র্যান্ড ডিফল্ট সেটিংসে ফিরিয়ে আনা হয়েছে');
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        showToast('পছন্দের তালিকা থেকে বাদ দেওয়া হয়েছে');
        next = prev.filter((item) => item !== id);
      } else {
        showToast('পছন্দের তালিকায় যুক্ত হয়েছে');
        next = [...prev, id];
      }
      if (currentUser) {
        saveFavoritesToCloud(currentUser.uid, next).catch((e) =>
          console.warn('Cloud favs save warning:', e)
        );
      }
      return next;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  // --- PRESETS IMPLEMENTATION ---
  const saveCurrentAsPreset = (name: string, description?: string, category?: string): PosterPreset => {
    const now = Date.now();
    const id = 'preset-user-' + now.toString(36) + Math.random().toString(36).substring(2, 6);

    const config: PosterPresetConfig = {
      theme: poster.theme,
      size: poster.size,
      font: poster.font,
      fontSize: poster.fontSize,
      arabicSizeRatio: poster.arabicSizeRatio,
      lineHeight: poster.lineHeight,
      autoFit: poster.autoFit,
      textColor: poster.textColor,
      accentColor: poster.accentColor,
      arabicColor: poster.arabicColor,
      align: poster.align,
      refPos: poster.refPos,
      overlay: poster.overlay,
      bgType: poster.bgType,
      bgPattern: poster.bgPattern,
      borderStyle: poster.borderStyle,
      decorCorner: poster.decorCorner,
      decorDivider: poster.decorDivider,
      showBismillah: poster.showBismillah,
      bgDataUrl: poster.bgDataUrl,
      brandPos: brand.pos,
      brandLogoSize: brand.logoSize,
      brandShowLogo: brand.showLogo,
      brandShowTag: brand.showTag,
      brandShowHandle: brand.showHandle,
      brandWatermark: brand.watermark,
    };

    const newPreset: PosterPreset = {
      id,
      name: name.trim() || 'আমার কাস্টম প্রিসেট',
      description: description?.trim() || `${poster.size} • ${poster.font} • ${poster.theme}`,
      category: category?.trim() || 'সংরক্ষিত প্রিসেট',
      createdAt: now,
      isBuiltIn: false,
      previewGradient: `linear-gradient(135deg, ${poster.accentColor}44 0%, #17110c 100%)`,
      config,
    };

    setPresets((prev) => [newPreset, ...prev]);
    setActivePresetId(id);
    if (currentUser) {
      savePresetToCloud(currentUser.uid, newPreset).catch((e) =>
        console.warn('Cloud preset save warning:', e)
      );
    }
    showToast(`"${newPreset.name}" প্রিসেট সফলভাবে সংরক্ষিত হয়েছে!`);
    return newPreset;
  };

  const applyPreset = (presetId: string) => {
    const target = presets.find((p) => p.id === presetId);
    if (!target) return;
    const cfg = target.config;

    // Apply all layout, typography, colors, patterns, and borders
    // while keeping current text content (bn, ar, ref)!
    setPoster((prev) => ({
      ...prev,
      theme: cfg.theme,
      size: cfg.size,
      font: cfg.font,
      fontSize: cfg.fontSize,
      arabicSizeRatio: cfg.arabicSizeRatio,
      lineHeight: cfg.lineHeight,
      autoFit: cfg.autoFit,
      textColor: cfg.textColor,
      accentColor: cfg.accentColor,
      arabicColor: cfg.arabicColor,
      align: cfg.align,
      refPos: cfg.refPos,
      overlay: cfg.overlay,
      bgType: cfg.bgType,
      bgPattern: cfg.bgPattern,
      borderStyle: cfg.borderStyle,
      decorCorner: cfg.decorCorner,
      decorDivider: cfg.decorDivider,
      showBismillah: cfg.showBismillah,
      bgDataUrl: cfg.bgDataUrl !== undefined ? cfg.bgDataUrl : prev.bgDataUrl,
    }));

    if (cfg.brandPos !== undefined) {
      setBrand((prev) => ({
        ...prev,
        pos: cfg.brandPos ?? prev.pos,
        logoSize: cfg.brandLogoSize ?? prev.logoSize,
        showLogo: cfg.brandShowLogo ?? prev.showLogo,
        showTag: cfg.brandShowTag ?? prev.showTag,
        showHandle: cfg.brandShowHandle ?? prev.showHandle,
        watermark: cfg.brandWatermark ?? prev.watermark,
      }));
    }

    setActivePresetId(presetId);
    showToast(`"${target.name}" প্রিসেটের স্টাইল সফলভাবে প্রয়োগ করা হয়েছে`);
  };

  const deletePreset = (presetId: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
    if (activePresetId === presetId) {
      setActivePresetId(null);
    }
    if (currentUser) {
      deletePresetFromCloud(currentUser.uid, presetId).catch((e) =>
        console.warn('Cloud preset delete warning:', e)
      );
    }
    showToast('প্রিসেট মুছে ফেলা হয়েছে');
  };

  const updatePreset = (presetId: string, name: string, description?: string) => {
    setPresets((prev) =>
      prev.map((p) => {
        if (p.id === presetId) {
          const updated: PosterPreset = {
            ...p,
            name: name.trim() || p.name,
            description: description !== undefined ? description.trim() : p.description,
          };
          if (currentUser && !p.isBuiltIn) {
            savePresetToCloud(currentUser.uid, updated).catch((e) =>
              console.warn('Cloud preset update warning:', e)
            );
          }
          return updated;
        }
        return p;
      })
    );
    showToast('প্রিসেট আপডেট সম্পন্ন হয়েছে');
  };

  const resetPresetsToDefault = () => {
    setPresets(BUILTIN_PRESETS);
    setActivePresetId('preset-golden-classic');
    showToast('ডিফল্ট প্রিসেটগুলো রিস্টোর করা হয়েছে');
  };

  // Migrate LocalStorage data to Firebase Cloud Firestore
  const migrateLocalData = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      showToast('মাইগ্রেশনের জন্য আগে সাইন-ইন করুন');
      return;
    }
    setIsCloudSyncing(true);
    try {
      const res = await migrateLocalStorageToCloud(currentUser.uid);
      const designs = await loadUserDesigns(currentUser.uid);
      if (designs && designs.length > 0) setSavedDesigns(designs);
      const userPresets = await loadUserPresets(currentUser.uid);
      if (userPresets && userPresets.length > 0) {
        setPresets(() => {
          const map = new Map<string, PosterPreset>();
          BUILTIN_PRESETS.forEach((p) => map.set(p.id, p));
          userPresets.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
      }
      showToast(`${res.designsCount} টি ডিজাইন ও ${res.presetsCount} টি প্রিসেট ক্লাউডে সিঙ্ক হয়েছে`);
    } catch (err) {
      console.error('Migration error:', err);
      showToast('সিঙ্ক করার সময় সমস্যা হয়েছে');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Sign out user
  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
      showToast('একাউন্ট থেকে সফলভাবে সাইন আউট করা হয়েছে');
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error('Sign out error:', err);
      showToast('সাইন আউট করতে সমস্যা হয়েছে');
    }
  };

  const exportBackup = () => {
    const backupData = {
      brand,
      savedDesigns,
      stats,
      presets,
      version: 2,
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
      if (Array.isArray(parsed.presets)) setPresets(parsed.presets);
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
        presets,
        activePresetId,
        saveCurrentAsPreset,
        applyPreset,
        deletePreset,
        updatePreset,
        resetPresetsToDefault,
        currentUser,
        isAuthLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isCloudSyncing,
        migrateLocalData,
        signOutUser,
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
