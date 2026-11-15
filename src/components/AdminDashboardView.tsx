import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { EmptyState } from './ui/EmptyState';
import { ConfirmDialog } from './ui/ConfirmDialog';
import {
  fetchAllUsers,
  updateUserRoleAndPlan,
  deleteUserAccount,
  fetchAllUpgradeRequests,
  processPaymentUpgradeRequest,
  updateBkashPaymentSettings,
  fetchPaymentSettingsHistory,
  SUPER_ADMIN_EMAIL,
} from '../services/firebaseDb';
import {
  AppUserProfile,
  UserRole,
  UserStatus,
  SubscriptionPlan,
  PaymentUpgradeRequest,
  PaymentSettingsHistoryEntry,
} from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import {
  isValidBdMobileNumber,
  normalizeBdMobileNumber,
} from '../utils/paymentValidation';
import {
  Users,
  Search,
  RefreshCw,
  Trash2,
  UserCheck,
  ShieldAlert,
  Crown,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Settings,
  History,
  AlertCircle,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

const REJECTION_QUICK_REASONS = [
  'ট্রানজেকশন আইডি (TrxID) বিকাশে পাওয়া যায়নি',
  'পাঠানো টাকার পরিমাণ প্যাকেজের সাথে মেলেনি',
  'প্রেরক নম্বর বা স্ক্রিনশট তথ্য অসম্পূর্ণ',
  'একই TrxID পূর্বেই ব্যবহার করা হয়েছে',
];

export const AdminDashboardView: React.FC = () => {
  const { isSuperAdmin, currentUser, userProfile, paymentSettings, showToast } = useApp();
  const [users, setUsers] = useState<AppUserProfile[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<PaymentUpgradeRequest[]>([]);
  const [settingsHistory, setSettingsHistory] = useState<PaymentSettingsHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeAdminTab, setActiveAdminTab] = useState<'requests' | 'settings' | 'users'>('requests');

  // Payment Verification Filters & Search
  const [reqStatusFilter, setReqStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [reqSearchQuery, setReqSearchQuery] = useState<string>('');

  // User Table Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'active' | 'pro' | 'enterprise'
  >('all');

  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);

  // Approve & Reject Modals
  const [requestToApprove, setRequestToApprove] = useState<PaymentUpgradeRequest | null>(null);
  const [requestToReject, setRequestToReject] = useState<PaymentUpgradeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Payment Settings Form State (Owner / Super Admin Only)
  const [newBkashNumber, setNewBkashNumber] = useState<string>('');
  const [paymentEnabledInput, setPaymentEnabledInput] = useState<boolean>(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [confirmSaveSettingsOpen, setConfirmSaveSettingsOpen] = useState<boolean>(false);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // Strict Owner/Super Admin check (never ordinary admins, approved users, or basic users)
  const isAuthorizedOwner = Boolean(
    isSuperAdmin &&
      currentUser &&
      (currentUser.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase() ||
        userProfile?.role === 'super_admin')
  );

  useEffect(() => {
    setPaymentEnabledInput(paymentSettings.paymentEnabled);
  }, [paymentSettings.paymentEnabled]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqResult, userResult, histResult] = await Promise.allSettled([
        fetchAllUpgradeRequests(),
        fetchAllUsers(),
        fetchPaymentSettingsHistory(),
      ]);

      if (reqResult.status === 'fulfilled') {
        setUpgradeRequests(reqResult.value);
      } else {
        console.warn('Error fetching upgrade requests:', reqResult.reason);
      }

      if (userResult.status === 'fulfilled') {
        setUsers(userResult.value);
      } else {
        console.warn('Error fetching users:', userResult.reason);
      }

      if (histResult.status === 'fulfilled') {
        setSettingsHistory(histResult.value);
      } else {
        console.warn('Error fetching payment settings history:', histResult.reason);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorizedOwner) {
      loadData();
    }
  }, [isAuthorizedOwner]);

  useEffect(() => {
    if (!selectedScreenshot) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedScreenshot(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedScreenshot]);

  if (!isAuthorizedOwner) {
    return (
      <EmptyState
        className="max-w-xl mx-auto my-12"
        icon={<ShieldAlert className="w-7 h-7 text-rose-400" />}
        title="অননুমোদিত প্রবেশাধিকার"
        description={`এই অ্যাডমিন ড্যাশবোর্ড এবং পেমেন্ট সেটিংস শুধুমাত্র সুপার অ্যাডমিন (${SUPER_ADMIN_EMAIL}) এর জন্য সংরক্ষিত।`}
      />
    );
  }

  const handlePlanChange = async (
    userId: string,
    newPlan: SubscriptionPlan,
    currentRole: UserRole,
    currentStatus: UserStatus
  ) => {
    setUpdatingUid(userId);
    try {
      const nextRole: UserRole = newPlan !== 'free' ? 'approved_user' : currentRole;
      const nextStatus: UserStatus = newPlan !== 'free' ? 'active' : currentStatus;
      await updateUserRoleAndPlan(userId, nextRole, nextStatus, newPlan, 30);
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === userId || u.uid === userId
            ? { ...u, plan: newPlan, role: nextRole, status: nextStatus }
            : u
        )
      );
      showToast(`ইউজারের প্যাকেজ "${newPlan.toUpperCase()}" এ আপগ্রেড হয়েছে (১ মাস মেয়াদ)`);
    } catch (err) {
      console.error('Plan update error:', err);
      showToast('প্যাকেজ পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleConfirmApprove = async () => {
    if (!requestToApprove) return;
    const request = requestToApprove;
    setUpdatingUid(request.id);
    try {
      await processPaymentUpgradeRequest(
        request.id,
        request.userId,
        request.targetPlan,
        'approved',
        currentUser?.email || SUPER_ADMIN_EMAIL
      );

      const nowIso = new Date().toISOString();
      const reviewer = currentUser?.email || SUPER_ADMIN_EMAIL;
      setUpgradeRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? { ...r, status: 'approved', reviewedAt: nowIso, reviewedBy: reviewer }
            : r
        )
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === request.userId || u.uid === request.userId
            ? { ...u, plan: request.targetPlan, role: 'approved_user', status: 'active' }
            : u
        )
      );
      showToast(
        `বিকাশ পেমেন্ট যাচাই করে ${request.userName} কে ${request.targetPlan.toUpperCase()} প্যাকেজে ১ মাসের জন্য আপগ্রেড করা হয়েছে!`
      );
      setRequestToApprove(null);
    } catch (err: any) {
      console.error('Approve request error:', err);
      const code = String(err?.message || '');
      if (code === 'ALREADY_PROCESSED') {
        showToast('এই পেমেন্ট রিকোয়েস্টটি ইতিমধ্যেই প্রসেস করা হয়েছে');
        await loadData();
      } else if (code === 'DUPLICATE_APPROVED_TRX_ID') {
        showToast('এই TrxID দিয়ে অন্য একটি পেমেন্ট ইতিমধ্যেই অনুমোদিত হয়েছে!');
      } else {
        showToast('পেমেন্ট অনুমোদন ব্যর্থ হয়েছে');
      }
      setRequestToApprove(null);
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestToReject) return;

    const trimmed = rejectionReason.trim();
    if (trimmed.length < 3) {
      setRejectionError('অনুগ্রহ করে পেমেন্ট বাতিলের স্পষ্ট কারণ লিখুন (কমপক্ষে ৩ অক্ষর)।');
      return;
    }

    const request = requestToReject;
    setUpdatingUid(request.id);
    setRejectionError(null);

    try {
      await processPaymentUpgradeRequest(
        request.id,
        request.userId,
        request.targetPlan,
        'rejected',
        currentUser?.email || SUPER_ADMIN_EMAIL,
        { rejectionReason: trimmed }
      );

      const nowIso = new Date().toISOString();
      const reviewer = currentUser?.email || SUPER_ADMIN_EMAIL;
      setUpgradeRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                status: 'rejected',
                reviewedAt: nowIso,
                reviewedBy: reviewer,
                rejectionReason: trimmed,
              }
            : r
        )
      );
      showToast('পেমেন্ট রিকোয়েস্ট বাতিল করা হয়েছে এবং ইউজারকে নোটিফাই করা হয়েছে');
      setRequestToReject(null);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Reject request error:', err);
      if (err?.message === 'ALREADY_PROCESSED') {
        showToast('এই পেমেন্ট রিকোয়েস্টটি ইতিমধ্যেই প্রসেস করা হয়েছে');
        await loadData();
        setRequestToReject(null);
      } else {
        setRejectionError('রিকোয়েস্ট বাতিল করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
      }
    } finally {
      setUpdatingUid(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      showToast('সুপার এডমিন অ্যাকাউন্ট মুছে ফেলা যাবে না');
      setUserToDelete(null);
      return;
    }

    setUpdatingUid(userToDelete.id);
    try {
      await deleteUserAccount(userToDelete.id);
      setUsers((prev) =>
        prev.filter((u) => u.userId !== userToDelete.id && u.uid !== userToDelete.id)
      );
      showToast('ইউজার অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে');
      setUserToDelete(null);
    } catch (err) {
      console.error('Delete user error:', err);
      showToast('ইউজার মুছে ফেলা ব্যর্থ হয়েছে');
    } finally {
      setUpdatingUid(null);
    }
  };

  // Validate and open confirmation modal before saving new bKash receiver number
  const handleValidateBeforeSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);

    const candidateNumber = newBkashNumber.trim()
      ? normalizeBdMobileNumber(newBkashNumber)
      : paymentSettings.bkashNumber;

    if (newBkashNumber.trim() && !isValidBdMobileNumber(candidateNumber)) {
      setSettingsError(
        'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX বা 013XXXXXXXX)।'
      );
      return;
    }

    if (!newBkashNumber.trim() && paymentEnabledInput === paymentSettings.paymentEnabled) {
      setSettingsError('নতুন একটি বিকাশ নম্বর লিখুন অথবা পেমেন্ট স্ট্যাটাস পরিবর্তন করুন।');
      return;
    }

    setConfirmSaveSettingsOpen(true);
  };

  const handleConfirmSaveSettings = async () => {
    if (!currentUser) return;
    const candidateNumber = newBkashNumber.trim()
      ? normalizeBdMobileNumber(newBkashNumber)
      : paymentSettings.bkashNumber;

    if (!isValidBdMobileNumber(candidateNumber) && candidateNumber !== paymentSettings.bkashNumber) {
      setSettingsError('সঠিক বাংলাদেশি মোবাইল নম্বর নয়।');
      setConfirmSaveSettingsOpen(false);
      return;
    }

    setIsSavingSettings(true);
    setSettingsError(null);

    try {
      await updateBkashPaymentSettings({
        newNumber: candidateNumber,
        paymentEnabled: paymentEnabledInput,
        adminEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        adminName: currentUser.displayName || userProfile?.displayName || 'সুপার এডমিন',
        adminUid: currentUser.uid,
      });

      const refreshedHist = await fetchPaymentSettingsHistory().catch(() => settingsHistory);
      setSettingsHistory(refreshedHist);
      setNewBkashNumber('');
      setConfirmSaveSettingsOpen(false);
      setSettingsSuccess(
        `বিকাশ প্রাপক নম্বর সফলভাবে আপডেট হয়েছে: ${candidateNumber}। এখন সকল নতুন চেকআউটে এই নম্বর প্রদর্শিত হবে।`
      );
      showToast(`নতুন বিকাশ নম্বর সংরক্ষিত হয়েছে: ${candidateNumber}`);
    } catch (err: any) {
      console.error('Failed to update payment settings:', err);
      setConfirmSaveSettingsOpen(false);
      if (err?.message === 'INVALID_BD_MOBILE') {
        setSettingsError('সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (013-019)।');
      } else {
        setSettingsError('বিকাশ সেটিংস সংরক্ষণ ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
      showToast('সেটিংস সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const totalUsers = users.length;
  const pendingRequestsCount = upgradeRequests.filter((r) => r.status === 'pending').length;
  const approvedRequestsCount = upgradeRequests.filter((r) => r.status === 'approved').length;
  const rejectedRequestsCount = upgradeRequests.filter((r) => r.status === 'rejected').length;
  const proUsers = users.filter((u) => u.plan === 'pro').length;
  const enterpriseUsers = users.filter(
    (u) => u.plan === 'enterprise' || u.role === 'super_admin'
  ).length;

  const filteredRequests = upgradeRequests.filter((req) => {
    if (reqStatusFilter !== 'all' && req.status !== reqStatusFilter) return false;
    const q = reqSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (req.transactionId || '').toLowerCase().includes(q) ||
      (req.senderNumber || req.senderPhone || '').toLowerCase().includes(q) ||
      (req.userEmail || '').toLowerCase().includes(q) ||
      (req.userName || '').toLowerCase().includes(q) ||
      (req.receiverNumberAtSubmission || '').toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'pending') return u.status === 'pending';
    if (statusFilter === 'active') return u.status === 'active';
    if (statusFilter === 'pro') return u.plan === 'pro';
    if (statusFilter === 'enterprise') return u.plan === 'enterprise';
    return true;
  });

  const pendingConfirmNumber = newBkashNumber.trim()
    ? normalizeBdMobileNumber(newBkashNumber)
    : paymentSettings.bkashNumber;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Header
        title="সুপার এডমিন কন্ট্রোল প্যানেল"
        subtitle={`সক্রিয় বিকাশ নম্বর: ${paymentSettings.bkashNumber} · পেমেন্ট যাচাই, সেটিংস ও ব্যবহারকারী নিয়ন্ত্রণ`}
        actionButton={
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141419] hover:bg-[#1b1b22] text-[#f5f3ee] border border-white/10 text-xs font-semibold transition min-h-[40px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#d4af37] ${isLoading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ করুন</span>
          </button>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-[#141419] border border-pink-500/25 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-pink-400 block mb-1 font-semibold">
              পেন্ডিং বিকাশ রিকোয়েস্ট
            </span>
            <div className="text-2xl font-bold text-[#f5f3ee] tabular-nums">
              {toBengaliNumber(pendingRequestsCount)}{' '}
              <span className="text-xs font-normal text-[#807a72]">টি</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#141419] border border-white/[0.08] flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-[#b6b0a6] block mb-1 font-medium">
              মোট নিবন্ধিত ইউজার
            </span>
            <div className="text-2xl font-bold text-[#f5f3ee] tabular-nums">
              {toBengaliNumber(totalUsers)}{' '}
              <span className="text-xs font-normal text-[#807a72]">জন</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-white/[0.08] flex items-center justify-center text-[#d4af37] shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#141419] border border-white/[0.08] flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-amber-400 block mb-1 font-medium">
              প্রো ক্রিয়েটর (১৯৯ ৳)
            </span>
            <div className="text-2xl font-bold text-[#f5f3ee] tabular-nums">
              {toBengaliNumber(proUsers)}{' '}
              <span className="text-xs font-normal text-[#807a72]">জন</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#141419] border border-white/[0.08] flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-emerald-400 block mb-1 font-medium">
              এন্টারপ্রাইজ (৪৯৯ ৳)
            </span>
            <div className="text-2xl font-bold text-[#f5f3ee] tabular-nums">
              {toBengaliNumber(enterpriseUsers)}{' '}
              <span className="text-xs font-normal text-[#807a72]">জন</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Crown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-white/[0.08] gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveAdminTab('requests')}
          className={`pb-3 px-2 text-xs sm:text-sm font-semibold transition inline-flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeAdminTab === 'requests'
              ? 'border-[#d4af37] text-[#f2d77d]'
              : 'border-transparent text-[#807a72] hover:text-[#f5f3ee]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>বিকাশ পেমেন্ট যাচাই</span>
          {pendingRequestsCount > 0 && (
            <span className="text-xs text-pink-400 font-bold tabular-nums">
              ({toBengaliNumber(pendingRequestsCount)})
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('settings')}
          className={`pb-3 px-2 text-xs sm:text-sm font-semibold transition inline-flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeAdminTab === 'settings'
              ? 'border-[#E2136E] text-pink-300'
              : 'border-transparent text-[#807a72] hover:text-[#f5f3ee]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>পেমেন্ট সেটিংস (bKash)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('users')}
          className={`pb-3 px-2 text-xs sm:text-sm font-semibold transition inline-flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeAdminTab === 'users'
              ? 'border-[#d4af37] text-[#f2d77d]'
              : 'border-transparent text-[#807a72] hover:text-[#f5f3ee]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="tabular-nums">ব্যবহারকারী তালিকা ({toBengaliNumber(totalUsers)})</span>
        </button>
      </div>

      {/* TAB 1: PAYMENT VERIFICATION */}
      {activeAdminTab === 'requests' && (
        <div className="space-y-4">
          {/* Filter & Search Toolbar */}
          <div className="p-4 rounded-2xl bg-[#141419] border border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="w-4 h-4 text-[#807a72] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={reqSearchQuery}
                onChange={(e) => setReqSearchQuery(e.target.value)}
                placeholder="TrxID, প্রেরক নম্বর বা ইমেইল দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 bg-[#0e0e12] border border-white/10 rounded-xl text-xs text-[#f5f3ee] focus:border-[#d4af37] outline-none min-h-[40px]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all' as const, label: `সব (${toBengaliNumber(upgradeRequests.length)})` },
                { id: 'pending' as const, label: `অপেক্ষমাণ (${toBengaliNumber(pendingRequestsCount)})` },
                { id: 'approved' as const, label: `অনুমোদিত (${toBengaliNumber(approvedRequestsCount)})` },
                { id: 'rejected' as const, label: `বাতিল (${toBengaliNumber(rejectedRequestsCount)})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setReqStatusFilter(f.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition tabular-nums min-h-[36px] ${
                    reqStatusFilter === f.id
                      ? 'bg-[#d4af37] text-[#0b0b0e]'
                      : 'bg-[#1b1b22] text-[#b6b0a6] hover:text-[#f5f3ee]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-6 h-6" />}
              title={
                upgradeRequests.length === 0
                  ? 'এখনো কোনো বিকাশ পেমেন্ট রিকোয়েস্ট জমা পড়েনি'
                  : 'ফিল্টারের সাথে কোনো রিকোয়েস্ট মেলেনি'
              }
              description="ব্যবহারকারীরা টাকা পাঠিয়ে TrxID সাবমিট করলে এখানে দেখতে ও যাচাই করতে পারবেন।"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isRowUpdating = updatingUid === req.id;
                const displaySender = req.senderNumber || req.senderPhone;
                const displayReceiver = req.receiverNumberAtSubmission || '0131198501 (পূর্বের)';
                const displayPlanName =
                  req.planName ||
                  (req.targetPlan === 'enterprise'
                    ? 'এন্টারপ্রাইজ আনলিমিটেড'
                    : 'প্রো ক্রিয়েটর');

                return (
                  <div
                    key={req.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                      isPending
                        ? 'bg-[#141419] border-amber-500/35'
                        : 'bg-[#141419] border-white/[0.08]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                        <span className="text-xs font-bold text-pink-400 tabular-nums">
                          {req.paymentMethod === 'bkash' ? 'bKash' : 'বিকাশ'} · ৳
                          {toBengaliNumber(req.amount)} {req.currency || 'BDT'}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            isPending
                              ? 'text-amber-400'
                              : isApproved
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {isPending ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : isApproved ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isPending
                              ? 'অপেক্ষমাণ (Pending)'
                              : isApproved
                              ? 'অনুমোদিত (Approved)'
                              : 'বাতিল (Rejected)'}
                          </span>
                        </span>
                      </div>

                      <div className="mt-3">
                        <h3 className="text-sm font-bold text-[#f5f3ee]">{req.userName}</h3>
                        <p className="text-xs text-[#807a72] font-mono">{req.userEmail}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4 p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.06] text-xs">
                        <div>
                          <span className="text-[#807a72] block text-[11px]">প্রেরক নম্বর</span>
                          <span className="font-mono text-[#f5f3ee] font-semibold tabular-nums">
                            {displaySender}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#807a72] block text-[11px]">TrxID</span>
                          <span className="font-mono text-[#f2d77d] font-bold">
                            {req.transactionId}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#807a72] block text-[11px]">প্রাপক নম্বর (তখনকার)</span>
                          <span className="font-mono text-pink-300 font-semibold tabular-nums">
                            {displayReceiver}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#807a72] block text-[11px]">আবেদনকৃত প্ল্যান</span>
                          <span className="text-emerald-400 font-semibold">{displayPlanName}</span>
                        </div>
                      </div>

                      {req.status === 'rejected' && req.rejectionReason && (
                        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
                          <span className="font-bold block text-[11px] text-rose-400">
                            বাতিলের কারণ:
                          </span>
                          <span>{req.rejectionReason}</span>
                        </div>
                      )}

                      {req.screenshotUrl && (
                        <div className="mt-3">
                          <span className="text-[11px] text-[#807a72] block mb-1.5">
                            পেমেন্ট স্ক্রিনশট
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedScreenshot(req.screenshotUrl || null)}
                            className="w-full relative group rounded-xl overflow-hidden border border-white/10 bg-black"
                          >
                            <img
                              src={req.screenshotUrl}
                              alt="Payment Screenshot"
                              className="w-full h-36 object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-semibold text-[#f2d77d]">
                              বড় করে দেখুন
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-[#807a72] tabular-nums space-y-0.5">
                        <div>জমা: {new Date(req.createdAt).toLocaleString('bn-BD')}</div>
                        {req.reviewedAt && (
                          <div>যাচাই: {new Date(req.reviewedAt).toLocaleString('bn-BD')}</div>
                        )}
                      </div>

                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRequestToReject(req);
                              setRejectionReason('');
                              setRejectionError(null);
                            }}
                            disabled={isRowUpdating}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-xs font-semibold transition disabled:opacity-50 min-h-[38px]"
                          >
                            বাতিল
                          </button>
                          <button
                            type="button"
                            onClick={() => setRequestToApprove(req)}
                            disabled={isRowUpdating}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1.5 min-h-[38px]"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>অনুমোদন ও অ্যাক্টিভেট</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#807a72]">
                          {req.reviewedBy ? `যাচাইকারী: ${req.reviewedBy}` : 'প্রসেসড'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYMENT SETTINGS (bKash Configuration & Audit History — Owner / Super Admin Only) */}
      {activeAdminTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: bKash Configuration Card */}
          <section className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-[#141419] border border-white/[0.08] space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E2136E]/15 border border-[#E2136E]/30 flex items-center justify-center text-pink-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#f5f3ee]">
                    Payment Settings · bKash Configuration
                  </h2>
                  <p className="text-xs text-[#807a72] mt-0.5">
                    বিকাশ প্রাপক নম্বর ও ম্যানুয়াল চেকআউট নিয়ন্ত্রণ (শুধুমাত্র সুপার এডমিন)
                  </p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#d4af37] shrink-0" />
            </div>

            {/* Active Receiver Number Snapshot */}
            <div className="p-4 rounded-xl bg-[#0e0e12] border border-pink-500/25 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#b6b0a6]">Current bKash Number (সক্রিয় প্রাপক নম্বর)</span>
                <span
                  className={`text-xs font-semibold ${
                    paymentSettings.paymentEnabled ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {paymentSettings.paymentEnabled ? 'পেমেন্ট চালু আছে' : 'পেমেন্ট বন্ধ'}
                </span>
              </div>
              <div
                data-testid="admin-current-bkash-number"
                className="text-2xl font-extrabold font-mono tracking-wider text-pink-300 tabular-nums"
              >
                {paymentSettings.bkashNumber}
              </div>
              <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#807a72]">
                <span>
                  সর্বশেষ আপডেট:{' '}
                  {paymentSettings.updatedAt
                    ? new Date(paymentSettings.updatedAt).toLocaleString('bn-BD')
                    : 'প্রাথমিক কনফিগারেশন'}
                </span>
                <span className="font-mono">
                  পরিবর্তনকারী: {paymentSettings.updatedBy || 'সিস্টেম'}
                </span>
              </div>
            </div>

            {/* Update Form */}
            <form onSubmit={handleValidateBeforeSaveSettings} className="space-y-4">
              <div>
                <label
                  htmlFor="new-bkash-number"
                  className="text-xs font-semibold text-[#b6b0a6] block mb-1.5"
                >
                  New bKash Number (নতুন বিকাশ নম্বর)
                </label>
                <input
                  id="new-bkash-number"
                  type="tel"
                  inputMode="tel"
                  value={newBkashNumber}
                  onChange={(e) => {
                    setNewBkashNumber(e.target.value);
                    setSettingsError(null);
                    setSettingsSuccess(null);
                  }}
                  placeholder="নতুন ১১ সংখ্যার বিকাশ নম্বর লিখুন (যেমন: 017XXXXXXXX)"
                  className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-sm text-[#f5f3ee] font-mono focus:border-[#E2136E] outline-none min-h-[44px]"
                />
                <p className="text-[11px] text-[#807a72] mt-1">
                  বাংলাদেশি ১১ সংখ্যার মোবাইল নম্বর (013, 014, 015, 016, 017, 018, 019)। পূর্বের সাবমিটকৃত রিকোয়েস্টগুলোর রেকর্ড অপরিবর্তিত থাকবে।
                </p>
              </div>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-[#f5f3ee] block">
                    ম্যানুয়াল বিকাশ চেকআউট চালু রাখুন
                  </span>
                  <span className="text-[11px] text-[#807a72]">
                    বন্ধ করলে নতুন পেমেন্ট সাবমিশন সাময়িকভাবে স্থগিত হবে
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={paymentEnabledInput}
                  onChange={(e) => {
                    setPaymentEnabledInput(e.target.checked);
                    setSettingsError(null);
                    setSettingsSuccess(null);
                  }}
                  className="w-5 h-5 accent-[#E2136E]"
                />
              </label>

              {settingsError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-3 px-4 rounded-xl bg-[#E2136E] hover:bg-[#C20E5E] text-white font-bold text-xs sm:text-sm transition disabled:opacity-50 min-h-[44px]"
              >
                {isSavingSettings ? 'সংরক্ষণ হচ্ছে...' : 'Save Changes · পরিবর্তন সংরক্ষণ করুন'}
              </button>
            </form>
          </section>

          {/* Right: Immutable Audit History */}
          <section className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-[#141419] border border-white/[0.08] flex flex-col">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-[#d4af37]" />
                <div>
                  <h2 className="text-base font-bold text-[#f5f3ee]">
                    বিকাশ নম্বর পরিবর্তনের অডিট ইতিহাস
                  </h2>
                  <p className="text-xs text-[#807a72]">
                    কে, কখন প্রাপক নম্বর পরিবর্তন করেছেন তার অপরিবর্তনীয় রেকর্ড
                  </p>
                </div>
              </div>
              <span className="text-xs text-[#807a72] tabular-nums">
                মোট {toBengaliNumber(settingsHistory.length)} টি
              </span>
            </div>

            {settingsHistory.length === 0 ? (
              <EmptyState
                className="border-0 bg-transparent py-10"
                icon={<History className="w-6 h-6" />}
                title="এখনো কোনো নম্বর পরিবর্তন করা হয়নি"
                description="বিকাশ নম্বর পরিবর্তন করলে এখানে পূর্বের ও নতুন নম্বরের সম্পূর্ণ ইতিহাস দেখা যাবে।"
              />
            ) : (
              <div className="mt-4 space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {settingsHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-[#0e0e12] border border-white/[0.06] text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className="text-[#807a72] line-through">{entry.previousNumber}</span>
                        <span className="text-[#d4af37]">→</span>
                        <span className="text-pink-300 font-bold">{entry.newNumber}</span>
                      </div>
                      <span className="text-[11px] text-[#807a72] tabular-nums">
                        {new Date(entry.changedAt).toLocaleString('bn-BD')}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#b6b0a6] flex items-center justify-between gap-2">
                      <span>পরিবর্তনকারী: {entry.changedByName || 'সুপার এডমিন'}</span>
                      <span className="font-mono text-[#807a72]">{entry.changedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: USERS TABLE */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#141419] border border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="w-4 h-4 text-[#807a72] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 bg-[#0e0e12] border border-white/10 rounded-xl text-xs text-[#f5f3ee] focus:border-[#d4af37] outline-none min-h-[40px]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all' as const, label: `সব (${toBengaliNumber(totalUsers)})` },
                { id: 'pro' as const, label: `প্রো (${toBengaliNumber(proUsers)})` },
                {
                  id: 'enterprise' as const,
                  label: `এন্টারপ্রাইজ (${toBengaliNumber(enterpriseUsers)})`,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition tabular-nums min-h-[36px] ${
                    statusFilter === f.id
                      ? 'bg-[#d4af37] text-[#0b0b0e]'
                      : 'bg-[#1b1b22] text-[#b6b0a6] hover:text-[#f5f3ee]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#141419] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#101014] text-[#b6b0a6] font-semibold">
                    <th className="py-3.5 px-4">ব্যবহারকারী</th>
                    <th className="py-3.5 px-4">প্যাকেজ প্ল্যান</th>
                    <th className="py-3.5 px-4">দৈনিক ব্যবহার</th>
                    <th className="py-3.5 px-4">স্ট্যাটাস</th>
                    <th className="py-3.5 px-4 text-right">একশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredUsers.map((user) => {
                    const isTargetSuperAdmin =
                      user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
                      user.role === 'super_admin';
                    const isRowUpdating = updatingUid === (user.uid || user.userId);
                    const userPlan = isTargetSuperAdmin ? 'enterprise' : user.plan || 'free';

                    return (
                      <tr
                        key={user.uid || user.userId}
                        className="hover:bg-[#1b1b22]/60 transition"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#1b1b22] border border-white/[0.08] flex items-center justify-center font-bold text-[#d4af37] shrink-0">
                              {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-[#f5f3ee] truncate flex items-center gap-1.5">
                                <span>{user.displayName || 'সম্মানিত ইউজার'}</span>
                                {isTargetSuperAdmin && (
                                  <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                                )}
                              </div>
                              <span className="text-[11px] text-[#807a72] font-mono block truncate">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {isTargetSuperAdmin ? (
                            <span className="text-xs font-semibold text-[#d4af37]">
                              ফুল এন্টারপ্রাইজ
                            </span>
                          ) : (
                            <select
                              value={userPlan}
                              disabled={isRowUpdating}
                              onChange={(e) =>
                                handlePlanChange(
                                  user.uid || user.userId,
                                  e.target.value as SubscriptionPlan,
                                  user.role,
                                  user.status
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#0e0e12] border border-white/10 text-xs text-[#f5f3ee] focus:border-[#d4af37] outline-none font-medium"
                            >
                              <option value="free">ফ্রি প্যাকেজ (৫ টি/দিন)</option>
                              <option value="pro">প্রো ক্রিয়েটর (৫০ টি/দিন)</option>
                              <option value="enterprise">এন্টারপ্রাইজ (আনলিমিটেড)</option>
                            </select>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[#b6b0a6] tabular-nums">
                          <span className="font-bold text-[#f2d77d]">
                            {toBengaliNumber(user.todayPosterCount || 0)}
                          </span>{' '}
                          <span className="text-[#807a72]">
                            / {userPlan === 'enterprise' || isTargetSuperAdmin ? '∞' : userPlan === 'pro' ? '৫০' : '৫'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              user.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {user.status === 'active' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            <span>{user.status === 'active' ? 'Active' : 'Pending'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {!isTargetSuperAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                setUserToDelete({
                                  id: user.uid || user.userId,
                                  email: user.email,
                                })
                              }
                              disabled={isRowUpdating}
                              aria-label={`${user.email} মুছুন`}
                              className="w-9 h-9 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 inline-flex items-center justify-center transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Lightbox */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="পেমেন্ট স্ক্রিনশট"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-[#141419] border border-white/15 rounded-2xl p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedScreenshot(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-black/80 text-white flex items-center justify-center hover:bg-black transition border border-white/15"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={selectedScreenshot}
              alt="Full Payment Screenshot"
              className="max-h-[82vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Reject With Reason Modal */}
      {requestToReject && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="পেমেন্ট রিকোয়েস্ট বাতিলের কারণ"
          onClick={() => updatingUid !== requestToReject.id && setRequestToReject(null)}
        >
          <form
            onSubmit={handleConfirmReject}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#141419] border border-white/12 rounded-2xl p-6 shadow-2xl text-[#f5f3ee] space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#f5f3ee]">
                  পেমেন্ট বাতিল করুন (TrxID: {requestToReject.transactionId})
                </h3>
                <p className="text-xs text-[#807a72] mt-1">
                  ব্যবহারকারী: {requestToReject.userEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequestToReject(null)}
                aria-label="বন্ধ করুন"
                className="w-8 h-8 rounded-lg bg-[#1b1b22] text-[#807a72] hover:text-[#f5f3ee] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#b6b0a6] block">
                দ্রুত কারণ নির্বাচন করুন:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_QUICK_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setRejectionReason(reason);
                      setRejectionError(null);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition text-left ${
                      rejectionReason === reason
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 font-semibold'
                        : 'bg-[#0e0e12] border-white/10 text-[#b6b0a6] hover:text-[#f5f3ee]'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="rejection-reason-input"
                className="text-xs font-semibold text-[#b6b0a6] block mb-1.5"
              >
                বাতিলের বিস্তারিত কারণ *
              </label>
              <textarea
                id="rejection-reason-input"
                rows={3}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectionError(null);
                }}
                placeholder="ইউজারকে দেখানোর জন্য স্পষ্ট কারণ লিখুন..."
                required
                className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-xs text-[#f5f3ee] focus:border-rose-500 outline-none"
              />
              {rejectionError && (
                <p className="text-[11px] text-rose-400 mt-1">{rejectionError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                disabled={updatingUid === requestToReject.id}
                onClick={() => setRequestToReject(null)}
                className="px-4 py-2.5 rounded-xl bg-[#1b1b22] text-[#b6b0a6] border border-white/[0.08] text-xs font-semibold min-h-[40px]"
              >
                ফিরে যান
              </button>
              <button
                type="submit"
                disabled={updatingUid === requestToReject.id}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold min-h-[40px] disabled:opacity-50"
              >
                {updatingUid === requestToReject.id ? 'বাতিল হচ্ছে...' : 'নিশ্চিত বাতিল করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Payment Approve Dialog */}
      <ConfirmDialog
        isOpen={Boolean(requestToApprove)}
        onClose={() => setRequestToApprove(null)}
        onConfirm={handleConfirmApprove}
        isDestructive={false}
        isLoading={Boolean(requestToApprove && updatingUid === requestToApprove.id)}
        title="পেমেন্ট অনুমোদন ও প্যাকেজ অ্যাক্টিভেট করবেন?"
        description={
          requestToApprove
            ? `আপনি কি নিশ্চিত যে TrxID "${requestToApprove.transactionId}" (৳${requestToApprove.amount}, প্রেরক: ${
                requestToApprove.senderNumber || requestToApprove.senderPhone
              }) যাচাই করে ${requestToApprove.userEmail} এর অ্যাকাউন্টটি ১ মাসের জন্য ${requestToApprove.targetPlan.toUpperCase()} প্ল্যানে আপগ্রেড করতে চান?`
            : ''
        }
        confirmLabel="হ্যাঁ, অনুমোদন দিন"
      />

      {/* Confirm Save bKash Payment Settings Dialog */}
      <ConfirmDialog
        isOpen={confirmSaveSettingsOpen}
        onClose={() => setConfirmSaveSettingsOpen(false)}
        onConfirm={handleConfirmSaveSettings}
        isDestructive={false}
        isLoading={isSavingSettings}
        title="বিকাশ পেমেন্ট সেটিংস পরিবর্তন নিশ্চিত করুন"
        description={`পূর্বের নম্বর (${paymentSettings.bkashNumber}) থেকে নতুন নম্বর (${pendingConfirmNumber}) এবং চেকআউট স্ট্যাটাস (${
          paymentEnabledInput ? 'চালু' : 'বন্ধ'
        }) সংরক্ষণ করা হবে। এই পরিবর্তনটি অডিট ইতিহাসে সংরক্ষিত থাকবে এবং নতুন চেকআউটে তৎক্ষণাৎ প্রদর্শিত হবে।`}
        confirmLabel="হ্যাঁ, সংরক্ষণ করুন"
      />

      {/* Confirm Delete User Dialog */}
      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        isLoading={Boolean(userToDelete && updatingUid === userToDelete.id)}
        title="ব্যবহারকারী মুছে ফেলবেন?"
        description={`আপনি কি নিশ্চিত যে "${userToDelete?.email || ''}" অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলতে চান?`}
        confirmLabel="হ্যাঁ, অ্যাকাউন্ট মুছুন"
      />
    </div>
  );
};
