import React from 'react';
import { useApp } from '../context/AppContext';
import { SUPER_ADMIN_EMAIL } from '../services/firebaseDb';
import { ModalShell } from './ui/ModalShell';
import { Clock, Mail, Sparkles } from 'lucide-react';

export const AccessDeniedModal: React.FC = () => {
  const {
    isAccessDeniedModalOpen,
    setIsAccessDeniedModalOpen,
    accessDeniedAction,
    currentUser,
    userProfile,
    setCurrentView,
    setIsPricingModalOpen,
  } = useApp();

  return (
    <ModalShell
      isOpen={isAccessDeniedModalOpen}
      onClose={() => setIsAccessDeniedModalOpen(false)}
      title="একাউন্ট অনুমোদন অপেক্ষমাণ"
      subtitle="Pending Super Admin Approval"
      icon={<Clock className="w-5 h-5 text-amber-400" />}
      maxWidthClass="max-w-md"
    >
      <div className="p-5 sm:p-6 space-y-5">
        <div className="p-4 rounded-xl bg-[#0e0e12] border border-white/[0.08] space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
            <span className="text-[#807a72]">চেষ্টা করা ফিচার</span>
            <span className="font-semibold text-[#f2d77d]">{accessDeniedAction}</span>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
            <span className="text-[#807a72]">আপনার ইমেইল</span>
            <span className="font-mono text-[#f5f3ee] truncate max-w-[200px]">
              {currentUser?.email || 'অজ্ঞাত'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#807a72]">বর্তমান স্ট্যাটাস</span>
            <span className="text-amber-400 font-semibold">
              {userProfile?.status === 'pending' ? 'অপেক্ষমাণ (Pending)' : 'বেসিক ইউজার'}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#b6b0a6] leading-relaxed">
          কনটেন্টের বিশুদ্ধতা বজায় রাখতে নতুন ব্যবহারকারীদের জন্য পূর্ণ পোস্টার এক্সপোর্ট ও সেভিং সুবিধার পূর্বে সুপার এডমিন (
          <span className="text-[#f2d77d] font-medium">{SUPER_ADMIN_EMAIL}</span>) কর্তৃক অনুমোদন অথবা প্রো/এন্টারপ্রাইজ প্যাকেজ প্রয়োজন।
        </p>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              setIsAccessDeniedModalOpen(false);
              setIsPricingModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition min-h-[44px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>বিকাশ দিয়ে প্যাকেজ আপগ্রেড করুন (১৯৯৳ বা ৪৯৯৳)</span>
          </button>

          <a
            href={`mailto:${SUPER_ADMIN_EMAIL}?subject=Waz%20Media%20Account%20Approval%20Request%20(${encodeURIComponent(
              currentUser?.email || ''
            )})&body=Hello%20Super%20Admin,%0A%0APlease%20approve%20my%20account%20access%20for%20Waz%20Media%20Studio.%0A%0AEmail:%20${encodeURIComponent(
              currentUser?.email || ''
            )}%0AName:%20${encodeURIComponent(currentUser?.displayName || '')}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] text-[#f5f3ee] border border-white/10 text-xs font-semibold transition min-h-[42px]"
          >
            <Mail className="w-4 h-4 text-[#d4af37]" />
            <span>সুপার এডমিনকে অনুমোদনের অনুরোধ পাঠান</span>
          </a>

          <button
            type="button"
            onClick={() => {
              setIsAccessDeniedModalOpen(false);
              setCurrentView('landing');
            }}
            className="w-full py-2.5 px-4 rounded-xl text-[#807a72] hover:text-[#f5f3ee] text-xs font-medium transition min-h-[40px]"
          >
            ডেমো ও ল্যান্ডিং পেজ দেখুন
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
