import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import {
  fetchAllUsers,
  updateUserRoleAndPlan,
  updateUserRoleAndStatus,
  deleteUserAccount,
  fetchAllUpgradeRequests,
  processPaymentUpgradeRequest,
  SUPER_ADMIN_EMAIL,
} from '../services/firebaseDb';
import { AppUserProfile, UserRole, UserStatus, SubscriptionPlan, PaymentUpgradeRequest } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { PRICING_PLANS, BKASH_CONFIG } from '../data/pricingPlans';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  UserCheck,
  UserX,
  ShieldAlert,
  Crown,
  Sparkles,
  Mail,
  Calendar,
  ExternalLink,
  CreditCard,
  FileCheck,
  XCircle,
  Phone,
  Image as ImageIcon,
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { isSuperAdmin, currentUser, showToast } = useApp();
  const [users, setUsers] = useState<AppUserProfile[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<PaymentUpgradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeAdminTab, setActiveAdminTab] = useState<'requests' | 'users'>('requests');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'pro' | 'enterprise'>('all');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

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

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-[#17110c] border border-rose-900/40 rounded-3xl max-w-xl mx-auto my-12 text-[#f4eee2]">
        <ShieldAlert className="w-16 h-16 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-rose-300">অননুমোদিত প্রবেশাধিকার</h2>
        <p className="text-xs text-[#9b8976] mt-2 leading-relaxed">
          এই অ্যাডমিন ড্যাশবোর্ডটি শুধুমাত্র সুপার অ্যাডমিন (<span className="text-[#f7df94] font-semibold">{SUPER_ADMIN_EMAIL}</span>) এর জন্য সংরক্ষিত।
        </p>
      </div>
    );
  }

  // Handle plan and status change for a user
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

  // Process manual bKash upgrade request
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
        showToast(`বিকাশ পেমেন্ট যাচাই করে ${request.userName} কে ${request.targetPlan.toUpperCase()} প্যাকেজে ১ মাসের জন্য আপগ্রেড করা হয়েছে!`);
      } else {
        showToast(`পেমেন্ট রিকোয়েস্ট বাতিল করা হয়েছে`);
      }
    } catch (err) {
      console.error('Process request error:', err);
      showToast('রিকোয়েস্ট প্রসেস ব্যর্থ হয়েছে');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      showToast('সুপার এডমিন অ্যাকাউন্ট মুছে ফেলা যাবে না');
      return;
    }

    if (!window.confirm(`আপনি কি নিশ্চিত যে "${email}" অ্যাকাউন্টটি মুছে ফেলতে চান?`)) {
      return;
    }

    setUpdatingUid(userId);
    try {
      await deleteUserAccount(userId);
      setUsers((prev) => prev.filter((u) => u.userId !== userId && u.uid !== userId));
      showToast('ইউজার অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error('Delete user error:', err);
      showToast('ইউজার মুছে ফেলা ব্যর্থ হয়েছে');
    } finally {
      setUpdatingUid(null);
    }
  };

  // Metrics
  const totalUsers = users.length;
  const pendingRequests = upgradeRequests.filter((r) => r.status === 'pending').length;
  const proUsers = users.filter((u) => u.plan === 'pro').length;
  const enterpriseUsers = users.filter((u) => u.plan === 'enterprise' || u.role === 'super_admin').length;

  // Filtered users
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
    <div className="space-y-6">
      <Header
        title="সুপার এডমিন কন্ট্রোল প্যানেল"
        subtitle={`বিকাশ পেমেন্ট ভেরিফিকেশন (নম্বর: ${BKASH_CONFIG.number}), ১ মাসের প্যাকেজ আপগ্রেড ও ব্যবহারকারী নিয়ন্ত্রণ`}
        actionButton={
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#201710] hover:bg-[#2b1f16] text-[#e0d2bf] border border-[#38281b] text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#d4af37] ${isLoading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ করুন</span>
          </button>
        }
      />


      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending bKash Upgrades */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#26150b] to-[#170e08] border border-pink-700/50 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs text-pink-400 block mb-1 font-bold">
              বিকাশ পেমেন্ট রিকোয়েস্ট (Pending)
            </span>
            <div className="text-2xl font-extrabold text-pink-300">
              {toBengaliNumber(pendingRequests)} <span className="text-xs font-normal text-pink-500">টি</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-pink-950/80 border border-pink-600/50 flex items-center justify-center text-pink-400">
            <CreditCard className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-[#17110c] border border-[#2d2117] flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-[#a9947c] block mb-1 font-medium">মোট নিবন্ধিত ইউজার</span>
            <div className="text-2xl font-bold text-[#f7df94]">
              {toBengaliNumber(totalUsers)} <span className="text-xs font-normal text-[#9b8976]">জন</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#241a12] border border-[#3b2a1a] flex items-center justify-center text-[#d4af37]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Pro Users (199 Tk) */}
        <div className="p-5 rounded-2xl bg-[#17110c] border border-amber-900/40 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-amber-400 block mb-1 font-medium">প্রো ক্রিয়েটর (১৯৯ ৳ / ৫০টি/দিন)</span>
            <div className="text-2xl font-bold text-amber-300">
              {toBengaliNumber(proUsers)} <span className="text-xs font-normal text-amber-500">জন</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Enterprise Users (499 Tk) */}
        <div className="p-5 rounded-2xl bg-[#17110c] border border-emerald-900/40 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-emerald-400 block mb-1 font-medium">এন্টারপ্রাইজ (৪৯৯ ৳ / আনলিমিটেড)</span>
            <div className="text-2xl font-bold text-emerald-300">
              {toBengaliNumber(enterpriseUsers)} <span className="text-xs font-normal text-emerald-500">জন</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
            <Crown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Payment Requests vs All Users */}
      <div className="flex border-b border-[#2d2117] gap-2">
        <button
          onClick={() => setActiveAdminTab('requests')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeAdminTab === 'requests'
              ? 'border-[#d4af37] text-[#f7df94]'
              : 'border-transparent text-[#877461] hover:text-[#d4af37]'
          }`}
        >
          <CreditCard className="w-4 h-4 text-[#d4af37]" />
          <span>বিকাশ পেমেন্ট রিকোয়েস্ট ও স্ক্রিনশট</span>
          {pendingRequests > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-pink-950 text-pink-300 font-extrabold border border-pink-700">
              {toBengaliNumber(pendingRequests)} নতুন
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeAdminTab === 'users'
              ? 'border-[#d4af37] text-[#f7df94]'
              : 'border-transparent text-[#877461] hover:text-[#d4af37]'
          }`}
        >
          <Users className="w-4 h-4 text-[#d4af37]" />
          <span>ব্যবহারকারী তালিকা ও প্যাকেজ নিয়ন্ত্রণ ({toBengaliNumber(totalUsers)})</span>
        </button>
      </div>

      {/* TAB 1: BKASH PAYMENT UPGRADE REQUESTS */}
      {activeAdminTab === 'requests' && (
        <div className="space-y-4">
          {upgradeRequests.length === 0 ? (
            <div className="p-12 text-center bg-[#17110c] border border-[#2d2117] rounded-3xl text-[#9b8976]">
              <CreditCard className="w-12 h-12 text-[#5c4a3b] mx-auto mb-3" />
              <p className="text-sm">এখনো কোনো বিকাশ পেমেন্ট রিকোয়েস্ট জমা পড়েনি।</p>
              <p className="text-xs text-[#6e5b4c] mt-1">ব্যবহারকারীরা টাকা পাঠিয়ে TrxID সাবমিট করলে এখানে দেখতে পাবেন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upgradeRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isRejected = req.status === 'rejected';
                const isRowUpdating = updatingUid === req.id;

                return (
                  <div
                    key={req.id}
                    className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 shadow-xl transition-all ${
                      isPending
                        ? 'bg-[#1b120a] border-amber-700/60 shadow-amber-950/20'
                        : isApproved
                        ? 'bg-[#14120e] border-emerald-800/40 opacity-90'
                        : 'bg-[#14100c] border-rose-900/40 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                          <span>বিকাশ সেন্ড মানি</span>
                          <span className="text-[10px] bg-pink-950 text-pink-300 border border-pink-800 px-2 py-0.5 rounded-full">
                            ৳ {toBengaliNumber(req.amount)}
                          </span>
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isPending
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
                              : isApproved
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {isPending ? 'অপেক্ষমাণ (Pending)' : isApproved ? 'অনুমোদিত ও সক্রিয়' : 'বাতিল (Rejected)'}
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="mt-3">
                        <h4 className="text-base font-bold text-[#f7df94]">{req.userName}</h4>
                        <p className="text-xs text-[#baa791] font-mono">{req.userEmail}</p>
                      </div>

                      {/* Transaction and Phone Details */}
                      <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-2xl bg-[#120d09] border border-[#2b1e15] text-xs">
                        <div>
                          <span className="text-[#7d6b59] block text-[10px]">প্রেরক বিকাশ নম্বর</span>
                          <span className="font-mono text-[#f4eee2] font-semibold">{req.senderPhone}</span>
                        </div>
                        <div>
                          <span className="text-[#7d6b59] block text-[10px]">TrxID (ট্রানজেকশন আইডি)</span>
                          <span className="font-mono text-[#f7df94] font-bold tracking-wider">{req.transactionId}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-[#241a12] flex items-center justify-between text-[11px]">
                          <span className="text-[#7d6b59]">আবেদনকৃত প্ল্যান:</span>
                          <span className="text-emerald-400 font-bold">
                            {req.targetPlan === 'enterprise' ? '৪৯৯ ৳ (এন্টারপ্রাইজ আনলিমিটেড)' : '১৯৯ ৳ (প্রো ক্রিয়েটর)'}
                          </span>
                        </div>
                      </div>

                      {/* Screenshot Preview */}
                      {req.screenshotUrl && (
                        <div className="mt-3">
                          <span className="text-[10px] text-[#877461] block mb-1">পেমেন্ট স্ক্রিনশট:</span>
                          <div
                            onClick={() => setSelectedScreenshot(req.screenshotUrl || null)}
                            className="relative group cursor-pointer rounded-xl overflow-hidden border border-[#3b2a1a] max-h-36 bg-black"
                          >
                            <img
                              src={req.screenshotUrl}
                              alt="Payment Screenshot"
                              className="w-full h-36 object-contain group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-semibold text-[#f7df94]">
                              বড় করে দেখুন
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#291e16] flex items-center justify-between">
                      <span className="text-[10px] text-[#7d6b59]">
                        {new Date(req.createdAt).toLocaleString('bn-BD')}
                      </span>

                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleProcessRequest(req, 'rejected')}
                            disabled={isRowUpdating}
                            className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition disabled:opacity-50"
                          >
                            বাতিল
                          </button>
                          <button
                            onClick={() => handleProcessRequest(req, 'approved')}
                            disabled={isRowUpdating}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold transition shadow-md disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>১ মাসের জন্য আপগ্রেড দিন</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#a6927d]">
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

      {/* TAB 2: USER DIRECTORY & PACKAGE ASSIGNMENT */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-2xl bg-[#17110c] border border-[#2d2117] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#877461] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 bg-[#120e0a] border border-[#2d2117] rounded-xl text-xs text-[#f4eee2] focus:border-[#d4af37] outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-[#d4af37] text-[#140e0a]'
                    : 'bg-[#201710] text-[#baa791] hover:text-[#f4eee2]'
                }`}
              >
                সব ({toBengaliNumber(totalUsers)})
              </button>
              <button
                onClick={() => setStatusFilter('pro')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  statusFilter === 'pro'
                    ? 'bg-[#d4af37] text-[#140e0a]'
                    : 'bg-[#201710] text-amber-300 hover:text-[#f4eee2]'
                }`}
              >
                প্রো ({toBengaliNumber(proUsers)})
              </button>
              <button
                onClick={() => setStatusFilter('enterprise')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  statusFilter === 'enterprise'
                    ? 'bg-[#d4af37] text-[#140e0a]'
                    : 'bg-[#201710] text-emerald-300 hover:text-[#f4eee2]'
                }`}
              >
                এন্টারপ্রাইজ ({toBengaliNumber(enterpriseUsers)})
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-[#17110c] border border-[#2d2117] rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#2d2117] bg-[#1d150e] text-[#a9947c] font-semibold">
                    <th className="py-3.5 px-4">ব্যবহারকারী</th>
                    <th className="py-3.5 px-4">প্যাকেজ প্ল্যান</th>
                    <th className="py-3.5 px-4">দৈনিক ব্যবহার</th>
                    <th className="py-3.5 px-4">রোল ও স্ট্যাটাস</th>
                    <th className="py-3.5 px-4 text-right">একশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#221811]">
                  {filteredUsers.map((user) => {
                    const isTargetSuperAdmin =
                      user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
                      user.role === 'super_admin';
                    const isRowUpdating = updatingUid === (user.uid || user.userId);
                    const userPlan = isTargetSuperAdmin ? 'enterprise' : (user.plan || 'free');

                    return (
                      <tr key={user.uid || user.userId} className="hover:bg-[#1f1610] transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#281c12] border border-[#3d2b1b] flex items-center justify-center font-bold text-[#d4af37] shrink-0">
                              {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-bold text-[#f4eee2] truncate flex items-center gap-1.5">
                                <span>{user.displayName || 'সম্মানিত ইউজার'}</span>
                                {isTargetSuperAdmin && (
                                  <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                                )}
                              </div>
                              <span className="text-[11px] text-[#877461] font-mono block truncate">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Package Selection */}
                        <td className="py-3 px-4">
                          {isTargetSuperAdmin ? (
                            <span className="text-xs font-bold text-amber-300">ফুল এন্টারপ্রাইজ</span>
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
                              className="px-2.5 py-1 rounded-lg bg-[#140e0a] border border-[#38281b] text-xs text-[#f7df94] focus:border-[#d4af37] outline-none font-semibold"
                            >
                              <option value="free">ফ্রি প্যাকেজ (৫ টি/দিন)</option>
                              <option value="pro">প্রো ক্রিয়েটর (৫০ টি/দিন - ১৯৯৳)</option>
                              <option value="enterprise">এন্টারপ্রাইজ (আনলিমিটেড - ৪৯৯৳)</option>
                            </select>
                          )}
                        </td>

                        {/* Daily Poster Usage */}
                        <td className="py-3 px-4 text-[#baa791]">
                          <span className="font-bold text-[#f7df94]">
                            {toBengaliNumber(user.todayPosterCount || 0)}
                          </span>
                          <span className="text-[#7d6b59]">
                            {' '}
                            / {userPlan === 'enterprise' || isTargetSuperAdmin ? '∞' : userPlan === 'pro' ? '৫০' : '৫'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              user.status === 'active'
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                                : 'bg-amber-950/80 text-amber-300 border-amber-800'
                            }`}
                          >
                            {user.status === 'active' ? 'Active' : 'Pending'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          {!isTargetSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUser(user.uid || user.userId, user.email)}
                              disabled={isRowUpdating}
                              className="p-1.5 rounded-lg bg-[#221811] hover:bg-rose-950 text-[#877461] hover:text-rose-400 border border-[#38281b] transition"
                              title="ইউজার অ্যাকাউন্ট মুছুন"
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

      {/* Screenshot Lightbox Modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-[#16100b] border border-[#3b2a1a] rounded-2xl p-2 overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition"
            >
              ✕
            </button>
            <img
              src={selectedScreenshot}
              alt="Full Screenshot"
              className="max-h-[82vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
