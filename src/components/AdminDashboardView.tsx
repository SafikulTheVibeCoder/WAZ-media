import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import {
  fetchAllUsers,
  updateUserRoleAndStatus,
  deleteUserAccount,
  SUPER_ADMIN_EMAIL,
} from '../services/firebaseDb';
import { AppUserProfile, UserRole, UserStatus } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';
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
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { isSuperAdmin, currentUser, showToast } = useApp();
  const [users, setUsers] = useState<AppUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'approved'>('all');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast('ইউজার তালিকা লোড করা যায়নি');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
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

  const handleRoleChange = async (userId: string, newRole: UserRole, currentStatus: UserStatus) => {
    setUpdatingUid(userId);
    try {
      // If promoting to approved_user or super_admin, also ensure active status
      const nextStatus = newRole === 'approved_user' || newRole === 'super_admin' ? 'active' : currentStatus;
      await updateUserRoleAndStatus(userId, newRole, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId || u.uid === userId ? { ...u, role: newRole, status: nextStatus } : u))
      );
      showToast('ইউজার রোল সফলভাবে আপডেট হয়েছে');
    } catch (err) {
      console.error('Role update error:', err);
      showToast('রোল আপডেট ব্যর্থ হয়েছে');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentRole: UserRole, newStatus: UserStatus) => {
    setUpdatingUid(userId);
    try {
      await updateUserRoleAndStatus(userId, currentRole, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId || u.uid === userId ? { ...u, status: newStatus } : u))
      );
      showToast(`ইউজার স্ট্যাটাস "${newStatus === 'active' ? 'সক্রিয়' : 'অপেক্ষমাণ'}" করা হয়েছে`);
    } catch (err) {
      console.error('Status toggle error:', err);
      showToast('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleQuickApprove = async (user: AppUserProfile) => {
    setUpdatingUid(user.uid || user.userId);
    try {
      await updateUserRoleAndStatus(user.uid || user.userId, 'approved_user', 'active');
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === user.userId || u.uid === user.uid
            ? { ...u, role: 'approved_user', status: 'active' }
            : u
        )
      );
      showToast(`${user.displayName || user.email} কে পূর্ণ অ্যাক্সেস অনুমোদন দেওয়া হয়েছে!`);
    } catch (err) {
      console.error('Quick approve error:', err);
      showToast('অনুমোদন প্রদান ব্যর্থ হয়েছে');
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

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') return u.status === 'pending';
    if (statusFilter === 'active') return u.status === 'active';
    if (statusFilter === 'approved') return u.role === 'approved_user';

    return true;
  });

  const totalUsers = users.length;
  const pendingUsers = users.filter((u) => u.status === 'pending').length;
  const approvedUsers = users.filter((u) => u.role === 'approved_user' || u.role === 'super_admin').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header
        title="সুপার এডমিন কন্ট্রোল প্যানেল"
        subtitle="ব্যবহারকারীদের রোল ও অ্যাক্সেস নিয়ন্ত্রণ: নতুন নিবন্ধন অনুমোদন করুন অথবা পূর্ণ অধিকার প্রদান করুন।"
        actionButton={
          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#201710] hover:bg-[#2b1f16] border border-[#3b2a1a] text-xs text-[#f7df94] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#d4af37]' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
        }
      />

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-[#17110c] border border-[#2d2117] flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-[#877461] block mb-1 font-medium">মোট নিবন্ধিত ব্যবহারকারী</span>
            <div className="text-2xl font-bold text-[#f7df94]">
              {toBengaliNumber(totalUsers)} <span className="text-xs font-normal text-[#9b8976]">জন</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#241a12] border border-[#3b2a1a] flex items-center justify-center text-[#d4af37]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-5 rounded-2xl bg-[#17110c] border border-amber-900/40 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-amber-400 block mb-1 font-medium">অনুমোদনের অপেক্ষায় (Pending)</span>
            <div className="text-2xl font-bold text-amber-300">
              {toBengaliNumber(pendingUsers)} <span className="text-xs font-normal text-amber-500">জন</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Approved Creators */}
        <div className="p-5 rounded-2xl bg-[#17110c] border border-emerald-900/40 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-emerald-400 block mb-1 font-medium">অনুমোদিত ক্রিয়েটর (Full Access)</span>
            <div className="text-2xl font-bold text-emerald-300">
              {toBengaliNumber(approvedUsers)} <span className="text-xs font-normal text-emerald-500">জন</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#17110c] border border-[#2d2117] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
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

        {/* Status Filter Buttons */}
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
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-[#140e0a]'
                : 'bg-[#201710] text-amber-400 hover:bg-amber-950/40'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>অপেক্ষমাণ ({toBengaliNumber(pendingUsers)})</span>
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-500 text-[#140e0a]'
                : 'bg-[#201710] text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>অনুমোদিত ({toBengaliNumber(approvedUsers)})</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#17110c] border border-[#2d2117] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#120e0a] text-[#baa791] border-b border-[#2d2117] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">ব্যবহারকারী (User)</th>
                <th className="py-3.5 px-4 font-semibold">ইমেইল ও আইডি</th>
                <th className="py-3.5 px-4 font-semibold">রোল (Role)</th>
                <th className="py-3.5 px-4 font-semibold">স্ট্যাটাস (Status)</th>
                <th className="py-3.5 px-4 font-semibold">তারিখ</th>
                <th className="py-3.5 px-4 font-semibold text-right">পদক্ষেপ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#261b12]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#877461]">
                    {isLoading ? 'ইউজার ডাটা লোড হচ্ছে...' : 'কোনো ব্যবহারকারী পাওয়া যায়নি'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isTargetSuperAdmin = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                  const isRowUpdating = updatingUid === (user.uid || user.userId);

                  return (
                    <tr
                      key={user.uid || user.userId}
                      className="hover:bg-[#1f1610]/60 transition"
                    >
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#221811] border border-[#3b2a1a] flex items-center justify-center overflow-hidden shrink-0">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-[#d4af37]">
                                {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-[#f4eee2] block">
                              {user.displayName}
                            </span>
                            {isTargetSuperAdmin && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#f7df94] font-medium">
                                <Crown className="w-3 h-3 text-[#d4af37]" />
                                সুপার এডমিন
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email & UID */}
                      <td className="py-3 px-4">
                        <span className="text-[#baa791] font-mono block">{user.email}</span>
                        <span className="text-[10px] text-[#6e5d4e] font-mono truncate max-w-[140px] block">
                          UID: {user.uid || user.userId}
                        </span>
                      </td>

                      {/* Role Selector */}
                      <td className="py-3 px-4">
                        {isTargetSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d4af37]/20 text-[#f7df94] border border-[#d4af37]/40 text-[10px] font-bold">
                            <Crown className="w-3 h-3 text-[#d4af37]" />
                            super_admin
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            disabled={isRowUpdating}
                            onChange={(e) =>
                              handleRoleChange(user.uid || user.userId, e.target.value as UserRole, user.status)
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#140e0a] border border-[#38281b] text-[11px] text-[#f4eee2] focus:border-[#d4af37] outline-none disabled:opacity-50 font-medium"
                          >
                            <option value="basic_user">basic_user (ভিউ ও ডেমো)</option>
                            <option value="approved_user">approved_user (পূর্ণ অধিকার)</option>
                            <option value="super_admin">super_admin (অ্যাডমিন)</option>
                          </select>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4">
                        {isTargetSuperAdmin ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleStatusToggle(
                                user.uid || user.userId,
                                user.role,
                                user.status === 'active' ? 'pending' : 'active'
                              )
                            }
                            disabled={isRowUpdating}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                              user.status === 'active'
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800 hover:bg-rose-950 hover:text-rose-300'
                                : 'bg-amber-950/80 text-amber-300 border-amber-800 hover:bg-emerald-950 hover:text-emerald-300'
                            }`}
                            title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                          >
                            {user.status === 'active' ? 'সক্রিয় (Active)' : 'অপেক্ষমাণ (Pending)'}
                          </button>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-[#877461] text-[11px]">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('bn-BD', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'অজ্ঞাত'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Approve Button for Pending Users */}
                          {user.status === 'pending' && !isTargetSuperAdmin && (
                            <button
                              onClick={() => handleQuickApprove(user)}
                              disabled={isRowUpdating}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition shadow-sm disabled:opacity-50"
                              title="১-ক্লিকে অনুমোদন দিন"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>অনুমোদন</span>
                            </button>
                          )}

                          {/* Delete Account Button */}
                          {!isTargetSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUser(user.uid || user.userId, user.email)}
                              disabled={isRowUpdating}
                              className="p-1.5 rounded-lg bg-[#221811] hover:bg-rose-950/60 text-[#877461] hover:text-rose-400 border border-[#38281b] hover:border-rose-900/60 transition disabled:opacity-50"
                              title="ইউজার অ্যাকাউন্ট মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
