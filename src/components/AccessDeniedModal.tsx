import React from 'react';
import { useApp } from '../context/AppContext';
import { SUPER_ADMIN_EMAIL } from '../services/firebaseDb';
import {
  ShieldAlert,
  Clock,
  X,
  Mail,
  Sparkles,
  ArrowRight,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

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


  if (!isAccessDeniedModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#16100b] border border-[#3b2a1a] rounded-3xl p-6 sm:p-7 shadow-2xl text-[#f4eee2] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Amber accent background blur */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setIsAccessDeniedModalOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#201710] hover:bg-[#2b1f16] border border-[#38281b] flex items-center justify-center text-[#9b8976] hover:text-[#f4eee2] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Icon & Header */}
        <div className="text-center pt-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-600/40 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-lg">
            <Clock className="w-8 h-8 animate-pulse text-amber-400" />
          </div>

          <span className="text-[11px] font-semibold tracking-wider text-amber-400 uppercase bg-amber-950/70 border border-amber-800/60 px-3 py-1 rounded-full">
            অনুমোদন অপেক্ষমাণ (Pending Approval)
          </span>

          <h2 className="text-xl font-bold text-[#f7df94] mt-3">
            আপনার একাউন্টটি অনুমোদনের অপেক্ষায় রয়েছে
          </h2>

          <p className="text-xs text-[#baa791] mt-2 leading-relaxed">
            Your account is currently pending Super Admin approval for full access.
          </p>
        </div>

        {/* Details Card */}
        <div className="mt-5 p-4 rounded-2xl bg-[#1d150e] border border-[#38281b] space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#2d2117]">
            <span className="text-[#877461]">চেষ্টা করা ফিচার:</span>
            <span className="font-semibold text-[#f7df94]">{accessDeniedAction}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#2d2117]">
            <span className="text-[#877461]">আপনার ইমেইল:</span>
            <span className="font-medium text-[#f4eee2] truncate max-w-[200px]">
              {currentUser?.email || 'অজ্ঞাত'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#877461]">বর্তমান স্ট্যাটাস:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
              {userProfile?.status === 'pending' ? 'অপেক্ষমাণ (Pending)' : 'বেসিক ইউজার'}
            </span>
          </div>
        </div>

        {/* Explanation message */}
        <div className="mt-4 p-3 rounded-xl bg-[#120e0a] border border-[#261b12] text-[11px] text-[#877461] leading-relaxed">
          <p>
            স্প্যাম প্রতিরোধ এবং কনটেন্টের পবিত্রতা বজায় রাখতে নতুন ব্যবহারকারীদের জন্য পূর্ণ পোস্টার জেনারেটর ও এক্সপোর্ট সুবিধা পাওয়ার পূর্বে সুপার এডমিন (<span className="text-[#f7df94] font-medium">{SUPER_ADMIN_EMAIL}</span>) কর্তৃক ম্যানুয়াল অনুমোদন প্রয়োজন।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={() => {
              setIsAccessDeniedModalOpen(false);
              setIsPricingModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-xs shadow-md transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>বিকাশ দিয়ে প্যাকেজ আপগ্রেড করুন (১৯৯৳ বা ৪৯৯৳)</span>
          </button>

          <a
            href={`mailto:${SUPER_ADMIN_EMAIL}?subject=Waz%20Media%20Account%20Approval%20Request%20(${encodeURIComponent(currentUser?.email || '')})&body=Hello%20Super%20Admin,%0A%0APlease%20approve%20my%20account%20access%20for%20Waz%20Media%20Studio.%0A%0AEmail:%20${encodeURIComponent(currentUser?.email || '')}%0AName:%20${encodeURIComponent(currentUser?.displayName || '')}`}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#201710] hover:bg-[#2b1f16] text-[#baa791] border border-[#38281b] text-xs font-semibold transition"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>সুপার এডমিনকে ফ্রি অনুমোদনের অনুরোধ পাঠান</span>
          </a>

          <button
            onClick={() => {
              setIsAccessDeniedModalOpen(false);
              setCurrentView('landing');
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#17100b] hover:bg-[#221811] text-[#877461] hover:text-[#d4af37] text-xs font-medium transition"
          >
            <span>ডেমো ও ল্যান্ডিং পেজ দেখুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};

