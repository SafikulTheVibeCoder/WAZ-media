import {
  db,
  storage,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SavedDesign, PosterPreset, BrandConfig } from '../types';
import { User } from 'firebase/auth';

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userDocRef);

    const data: Record<string, any> = {
      userId: user.uid,
      email: user.email || 'user@example.com',
      displayName: user.displayName || 'ইসলামিক ক্যালিগ্রাফার',
      photoURL: user.photoURL || '',
      updatedAt: new Date().toISOString(),
    };

    if (!existing.exists()) {
      data.role = 'user';
      data.createdAt = new Date().toISOString();
    }

    await setDoc(userDocRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save poster design to cloud Firestore
 */
export async function saveDesignToCloud(userId: string, design: SavedDesign): Promise<void> {
  const path = `users/${userId}/designs/${design.id}`;
  try {
    const designRef = doc(db, 'users', userId, 'designs', design.id);
    await setDoc(designRef, {
      ...design,
      userId,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch all saved designs for a user
 */
export async function loadUserDesigns(userId: string): Promise<SavedDesign[]> {
  const path = `users/${userId}/designs`;
  try {
    const designsColRef = collection(db, 'users', userId, 'designs');
    const snapshot = await getDocs(designsColRef);
    const list: SavedDesign[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as SavedDesign);
    });
    // Sort newest first
    list.sort((a, b) => b.updated - a.updated);
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Delete a saved design from cloud Firestore
 */
export async function deleteDesignFromCloud(userId: string, designId: string): Promise<void> {
  const path = `users/${userId}/designs/${designId}`;
  try {
    const designRef = doc(db, 'users', userId, 'designs', designId);
    await deleteDoc(designRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save custom preset to cloud Firestore
 */
export async function savePresetToCloud(userId: string, preset: PosterPreset): Promise<void> {
  const path = `users/${userId}/presets/${preset.id}`;
  try {
    const presetRef = doc(db, 'users', userId, 'presets', preset.id);
    await setDoc(presetRef, {
      ...preset,
      userId,
      createdAt: preset.createdAt || Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch user saved custom presets
 */
export async function loadUserPresets(userId: string): Promise<PosterPreset[]> {
  const path = `users/${userId}/presets`;
  try {
    const presetsColRef = collection(db, 'users', userId, 'presets');
    const snapshot = await getDocs(presetsColRef);
    const list: PosterPreset[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as PosterPreset);
    });
    list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Delete a custom preset from cloud Firestore
 */
export async function deletePresetFromCloud(userId: string, presetId: string): Promise<void> {
  const path = `users/${userId}/presets/${presetId}`;
  try {
    const presetRef = doc(db, 'users', userId, 'presets', presetId);
    await deleteDoc(presetRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save user brand configuration to cloud Firestore
 */
export async function saveBrandSettingsToCloud(userId: string, brand: BrandConfig): Promise<void> {
  const path = `users/${userId}/brand/settings`;
  try {
    const brandRef = doc(db, 'users', userId, 'brand', 'settings');
    await setDoc(brandRef, {
      ...brand,
      userId,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load user brand settings from cloud Firestore
 */
export async function loadUserBrandSettings(userId: string): Promise<BrandConfig | null> {
  const path = `users/${userId}/brand/settings`;
  try {
    const brandRef = doc(db, 'users', userId, 'brand', 'settings');
    const snap = await getDoc(brandRef);
    if (snap.exists()) {
      return snap.data() as BrandConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Save user bookmarked quotes to cloud Firestore
 */
export async function saveFavoritesToCloud(userId: string, quoteIds: string[]): Promise<void> {
  const path = `users/${userId}/favorites/list`;
  try {
    const favRef = doc(db, 'users', userId, 'favorites', 'list');
    await setDoc(favRef, {
      userId,
      quoteIds,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load user bookmarked quotes from cloud Firestore
 */
export async function loadUserFavorites(userId: string): Promise<string[] | null> {
  const path = `users/${userId}/favorites/list`;
  try {
    const favRef = doc(db, 'users', userId, 'favorites', 'list');
    const snap = await getDoc(favRef);
    if (snap.exists()) {
      const data = snap.data();
      return Array.isArray(data.quoteIds) ? data.quoteIds : [];
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Upload brand logo file to Firebase Cloud Storage and get permanent download URL
 */
export async function uploadBrandLogoToStorage(userId: string, file: File): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `users/${userId}/logos/logo_${Date.now()}.${fileExt}`;
    const fileRef = storageRef(storage, filePath);
    const snapshot = await uploadBytes(fileRef, file, {
      contentType: file.type || 'image/png',
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn('Storage upload error, falling back to base64 reader:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Migrate all existing LocalStorage data (designs, presets, brand, favorites) to Cloud Firestore
 */
export async function migrateLocalStorageToCloud(userId: string): Promise<{
  designsCount: number;
  presetsCount: number;
}> {
  let designsCount = 0;
  let presetsCount = 0;

  try {
    // 1. Migrate Saved Designs
    const rawDesigns = localStorage.getItem('waz_media_saved_designs');
    if (rawDesigns) {
      const designs: SavedDesign[] = JSON.parse(rawDesigns);
      if (Array.isArray(designs) && designs.length > 0) {
        for (const d of designs) {
          await saveDesignToCloud(userId, d);
          designsCount++;
        }
      }
    }

    // 2. Migrate Custom Presets
    const rawPresets = localStorage.getItem('waz_media_poster_presets');
    if (rawPresets) {
      const presets: PosterPreset[] = JSON.parse(rawPresets);
      if (Array.isArray(presets) && presets.length > 0) {
        for (const p of presets) {
          if (!p.isBuiltIn) {
            await savePresetToCloud(userId, p);
            presetsCount++;
          }
        }
      }
    }

    // 3. Migrate Brand Settings
    const rawBrand = localStorage.getItem('waz_media_brand_settings');
    if (rawBrand) {
      const brand: BrandConfig = JSON.parse(rawBrand);
      await saveBrandSettingsToCloud(userId, brand);
    }

    // 4. Migrate Favorites
    const rawFavs = localStorage.getItem('waz_media_favorites');
    if (rawFavs) {
      const favs: string[] = JSON.parse(rawFavs);
      if (Array.isArray(favs) && favs.length > 0) {
        await saveFavoritesToCloud(userId, favs);
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
  }

  return { designsCount, presetsCount };
}
