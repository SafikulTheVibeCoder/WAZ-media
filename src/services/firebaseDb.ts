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
  deleteField,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatLocalIsoDate } from '../utils/bengaliUtils';
import {
  SavedDesign,
  PosterPreset,
  BrandConfig,
  AppUserProfile,
  UserRole,
  UserStatus,
  SubscriptionPlan,
  PaymentUpgradeRequest,
} from '../types';
import { User } from 'firebase/auth';

export const SUPER_ADMIN_EMAIL = 'realsafikul@gmail.com';

/**
 * Sync user profile to Firestore with RBAC role, plan, and status logic
 */
export async function syncUserProfile(user: User): Promise<AppUserProfile> {
  const path = `users/${user.uid}`;
  const now = new Date().toISOString();
  const todayDateStr = formatLocalIsoDate(new Date());
  const normalizedEmail = (user.email || '').toLowerCase().trim();
  const isSuperAdminEmail = normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase();

  try {
    const userDocRef = doc(db, 'users', user.uid);
    let existing;
    try {
      existing = await getDoc(userDocRef);
    } catch (firstErr: any) {
      if (String(firstErr?.message || firstErr).toLowerCase().includes('offline')) {
        await new Promise((r) => setTimeout(r, 450));
        existing = await getDoc(userDocRef);
      } else {
        throw firstErr;
      }
    }

    let role: UserRole = isSuperAdminEmail ? 'super_admin' : 'basic_user';
    let status: UserStatus = isSuperAdminEmail ? 'active' : 'pending';
    let plan: SubscriptionPlan = isSuperAdminEmail ? 'enterprise' : 'free';
    let planExpiresAt: string | undefined = undefined;
    let todayPosterCount = 0;
    let lastPosterDate = todayDateStr;
    let createdAt = now;

    if (existing.exists()) {
      const existingData = existing.data();
      createdAt = existingData.createdAt || now;
      if (isSuperAdminEmail) {
        role = 'super_admin';
        status = 'active';
        plan = 'enterprise';
      } else {
        // Keep existing role, status & plan if assigned
        role = (existingData.role as UserRole) || 'basic_user';
        status = (existingData.status as UserStatus) || 'pending';
        plan = (existingData.plan as SubscriptionPlan) || 'free';
        if (typeof existingData.planExpiresAt === 'string' && existingData.planExpiresAt) {
          planExpiresAt = existingData.planExpiresAt;
        }

        // Reset daily count if date has changed
        if (existingData.lastPosterDate === todayDateStr) {
          todayPosterCount = existingData.todayPosterCount || 0;
        } else {
          todayPosterCount = 0;
          lastPosterDate = todayDateStr;
        }
      }
    }

    const profileData: AppUserProfile = {
      uid: user.uid,
      userId: user.uid,
      email: user.email || 'user@example.com',
      displayName: user.displayName || (isSuperAdminEmail ? 'সুপার এডমিন (শফিকুল)' : 'সম্মানিত ব্যবহারকারী'),
      photoURL: user.photoURL || '',
      role,
      status,
      plan,
      ...(planExpiresAt ? { planExpiresAt } : {}),
      todayPosterCount,
      lastPosterDate,
      createdAt,
      updatedAt: now,
    };

    await setDoc(userDocRef, profileData, { merge: true });
    return profileData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch a single user profile from Firestore
 */
export async function fetchUserProfile(userId: string): Promise<AppUserProfile | null> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as AppUserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Fetch all registered users for Super Admin dashboard
 */
export async function fetchAllUsers(): Promise<AppUserProfile[]> {
  const path = 'users';
  try {
    const usersColRef = collection(db, 'users');
    const snap = await getDocs(usersColRef);
    const list: AppUserProfile[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as AppUserProfile);
    });
    // Sort super_admin first, then by createdAt descending
    list.sort((a, b) => {
      if (a.role === 'super_admin') return -1;
      if (b.role === 'super_admin') return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Update user role, status, and subscription plan (Super Admin only)
 */
export async function updateUserRoleAndPlan(
  userId: string,
  role: UserRole,
  status: UserStatus,
  plan: SubscriptionPlan,
  daysValid: number = 30
): Promise<void> {
  const path = `users/${userId}`;
  const now = new Date();
  const expires = new Date();
  expires.setDate(now.getDate() + daysValid);

  try {
    const userDocRef = doc(db, 'users', userId);
    const updatePayload: Record<string, unknown> = {
      role,
      status,
      plan,
      updatedAt: now.toISOString(),
    };

    if (plan !== 'free') {
      updatePayload.planExpiresAt = expires.toISOString();
    } else {
      updatePayload.planExpiresAt = deleteField();
    }

    await setDoc(userDocRef, updatePayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Legacy alias for backwards compatibility
 */
export async function updateUserRoleAndStatus(
  userId: string,
  role: UserRole,
  status: UserStatus
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        role,
        status,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Record a poster generation for the user (tracks daily quota)
 */
export async function recordUserPosterGeneration(userId: string): Promise<{ todayCount: number }> {
  const path = `users/${userId}`;
  const todayDateStr = formatLocalIsoDate(new Date());

  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    let todayCount = 1;

    if (snap.exists()) {
      const data = snap.data();
      if (data.lastPosterDate === todayDateStr) {
        todayCount = (data.todayPosterCount || 0) + 1;
      } else {
        todayCount = 1;
      }
    }

    await setDoc(
      userDocRef,
      {
        todayPosterCount: todayCount,
        lastPosterDate: todayDateStr,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { todayCount };
  } catch (error) {
    // Non-fatal, return 1
    return { todayCount: 1 };
  }
}

/**
 * Submit a bKash payment upgrade request
 */
export async function submitPaymentUpgradeRequest(
  request: Omit<PaymentUpgradeRequest, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const requestId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `upgradeRequests/${requestId}`;

  const payload: PaymentUpgradeRequest = {
    id: requestId,
    userId: request.userId,
    userEmail: request.userEmail,
    userName: request.userName,
    targetPlan: request.targetPlan,
    amount: request.amount,
    senderPhone: request.senderPhone,
    transactionId: request.transactionId,
    ...(request.screenshotUrl ? { screenshotUrl: request.screenshotUrl } : {}),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    const reqRef = doc(db, 'upgradeRequests', requestId);
    await setDoc(reqRef, payload);
    return requestId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Fetch all upgrade requests (Super Admin)
 */
export async function fetchAllUpgradeRequests(): Promise<PaymentUpgradeRequest[]> {
  const path = 'upgradeRequests';
  try {
    const colRef = collection(db, 'upgradeRequests');
    const snap = await getDocs(colRef);
    const list: PaymentUpgradeRequest[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as PaymentUpgradeRequest);
    });
    // Newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Approve or Reject an upgrade request (Super Admin only)
 */
export async function processPaymentUpgradeRequest(
  requestId: string,
  targetUserId: string,
  targetPlan: 'pro' | 'enterprise',
  status: 'approved' | 'rejected',
  adminEmail: string
): Promise<void> {
  const path = `upgradeRequests/${requestId}`;
  const now = new Date().toISOString();

  try {
    const reqRef = doc(db, 'upgradeRequests', requestId);
    await setDoc(
      reqRef,
      {
        status,
        reviewedAt: now,
        reviewedBy: adminEmail,
      },
      { merge: true }
    );

    if (status === 'approved') {
      // Upgrade user's plan to pro or enterprise for 30 days and approve their status
      await updateUserRoleAndPlan(targetUserId, 'approved_user', 'active', targetPlan, 30);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a user account document (Super Admin only)
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
  } catch (error) {

    handleFirestoreError(error, OperationType.DELETE, path);
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
