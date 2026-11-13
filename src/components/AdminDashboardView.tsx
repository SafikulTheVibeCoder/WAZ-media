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
  SUPER_ADMIN_EMAIL,
} from '../services/firebaseDb';
import {
  AppUserProfile,
  UserRole,
  UserStatus,
  SubscriptionPlan,
  PaymentUpgradeRequest,
} from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { BKASH_CONFIG } from '../data/pricingPlans';
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
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { isSuperAdmin, currentUser, showToast } = useApp();
  const [users, setUsers] = useState<AppUserProfile[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<PaymentUpgradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeAdminTab, setActiveAdminTab] = useState<'requests' | 'users'>('requests');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'active' | 'pro' | 'enterprise'
  >('all');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      try {
        const reqData = await fetchAllUpgradeRequests();
        setUpgradeRequests(reqData);
      } catch (err) {
        console.warn('Error fetching upgrade requests:', err);
      }

      try {
        const userData = await fetchAllUsers();
        setUsers(userData);
      } catch (err) {
        console.warn('Error fetching users:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!selectedScreenshot) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedScreenshot(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedScreenshot]);

  if (!isSuperAdmin) {
    return (
      <EmptyState
        className="max-w-xl mx-auto my-12"
        icon={<ShieldAlert className="w-7 h-7 text-rose-400" />}
        title="অননুমোদিত প্রবেশাধিকার"
        description={`এই অ্যাডমিন ড্যাশবোর্ডটি শুধুমাত্র সুপার অ্যাডমিন (${SUPER_ADMIN_EMAIL}) এর জন্য সংরক্ষিত।`}
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

  const handleProcessRequest = async (
    request: PaymentUpgradeRequest,
    status: 'approved' | 'rejected'
  ) => {
    setUpdatingUid(request.id);
    try {
      await processPaymentUpgradeRequest(
        request.id,
        request.userId,
        request.targetPlan,
        status,
        currentUser?.email || SUPER_ADMIN_EMAIL
      );

      setUpgradeRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status } : r))
      );

      if (status === 'approved') {
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
      } else {
        showToast('পেমেন্ট রিকোয়েস্ট বাতিল করা হয়েছে');
      }
    } catch (err) {
      console.error('Process request error:', err);
      showToast('রিকোয়েস্ট প্রসেস ব্যর্থ হয়েছে');
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

  const totalUsers = users.length;
  const pendingRequests = upgradeRequests.filter((r) => r.status === 'pending').length;
  const proUsers = users.filter((u) => u.plan === 'pro').length;
  const enterpriseUsers = users.filter(
    (u) => u.plan === 'enterprise' || u.role === 'super_admin'
  ).length;

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Header
        title="সুপার এডমিন কন্ট্রোল প্যানেল"
        subtitle={`বিকাশ ভেরিফিকেশন (${BKASH_CONFIG.number}), ১ মাসের প্যাকেজ আপগ্রেড ও ব্যবহারকারী নিয়ন্ত্রণ`}
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
              {toBengaliNumber(pendingRequests)}{' '}
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
          <span>বিকাশ পেমেন্ট রিকোয়েস্ট</span>
          {pendingRequests > 0 && (
            <span className="text-xs text-pink-400 font-bold tabular-nums">
              ({toBengaliNumber(pendingRequests)})
            </span>
          )}
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

      {/* TAB 1: PAYMENT REQUESTS */}
      {activeAdminTab === 'requests' && (
        <div>
          {upgradeRequests.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-6 h-6" />}
              title="এখনো কোনো বিকাশ পেমেন্ট রিকোয়েস্ট জমা পড়েনি"
              description="ব্যবহারকারীরা টাকা পাঠিয়ে TrxID সাবমিট করলে এখানে দেখতে পাবেন।"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upgradeRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isRowUpdating = updatingUid === req.id;

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
                          বিকাশ সেন্ড মানি · ৳{toBengaliNumber(req.amount)}
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
                              ? 'অপেক্ষমাণ'
                              : isApproved
                              ? 'অনুমোদিত'
                              : 'বাতিল'}
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
                            {req.senderPhone}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#807a72] block text-[11px]">TrxID</span>
                          <span className="font-mono text-[#f2d77d] font-bold">
                            {req.transactionId}
                          </span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                          <span className="text-[#807a72]">আবেদনকৃত প্ল্যান</span>
                          <span className="text-emerald-400 font-semibold">
                            {req.targetPlan === 'enterprise'
                              ? 'এন্টারপ্রাইজ (৪৯৯ ৳)'
                              : 'প্রো ক্রিয়েটর (১৯৯ ৳)'}
                          </span>
                        </div>
                      </div>

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
                      <span className="text-[11px] text-[#807a72] tabular-nums">
                        {new Date(req.createdAt).toLocaleString('bn-BD')}
                      </span>

                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleProcessRequest(req, 'rejected')}
                            disabled={isRowUpdating}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-xs font-semibold transition disabled:opacity-50 min-h-[38px]"
                          >
                            বাতিল
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProcessRequest(req, 'approved')}
                            disabled={isRowUpdating}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1.5 min-h-[38px]"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>১ মাসের আপগ্রেড দিন</span>
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

      {/* TAB 2: USERS TABLE */}
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
