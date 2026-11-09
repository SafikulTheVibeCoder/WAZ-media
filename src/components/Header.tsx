import React from 'react';
import { useApp } from '../context/AppContext';
import { getTodayHijriEstimate } from '../utils/bengaliUtils';
import { Cloud, User as UserIcon, Check, Crown } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actionButton }) => {
  const { brand, currentUser, userProfile, isSuperAdmin, isApproved, setIsAuthModalOpen, setCurrentView } = useApp();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#2d2117]">
      {/* Mobile brand header shown only on small screens */}
      <div className="flex md:hidden items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1d150e] border border-[#3b2a1a] flex items-center justify-center shrink-0 p-1 shadow-sm">
            <img
              src={brand.logo || '/logo.svg'}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wider text-[#f7df94]">{brand.name}</span>
            <span className="text-[10px] text-[#877461] block">{brand.tagline}</span>
          </div>
        </div>

        {/* Mobile Auth button */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f1610] border border-[#3b2a1a] text-xs text-[#f7df94]"
        >
          <Cloud className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>{currentUser ? 'ক্লাউড সিঙ্ক' : 'লগইন'}</span>
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#f4eee2]">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-sm text-[#9b8976] mt-1 font-normal max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Hijri date */}
        <div className="hidden lg:flex flex-col text-right">
          <span className="text-xs font-medium text-[#c49b3a]">আজকের তারিখ</span>
          <span className="text-xs text-[#877461]">{getTodayHijriEstimate()}</span>
        </div>

        {/* Super Admin Panel Shortcut Button (Only for Super Admin) */}
        {isSuperAdmin && (
          <button
            onClick={() => setCurrentView('admin')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#d4af37]/20 to-[#b38927]/20 hover:from-[#d4af37]/30 hover:to-[#b38927]/30 border border-[#d4af37]/50 text-xs font-bold text-[#f7df94] transition shadow-sm"
            title="সুপার এডমিন কন্ট্রোল প্যানেল"
          >
            <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>এডমিন প্যানেল</span>
          </button>
        )}

        {/* Firebase Cloud Sync / Account Button */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#17110c] hover:bg-[#201710] border border-[#38281b] hover:border-[#4d3725] text-xs transition shadow-sm"
          title="ফায়ারবেস ক্লাউড ডেটাবেজ ও ব্যবহারকারী একাউন্ট"
        >
          {currentUser ? (
            <>
              <div className="w-6 h-6 rounded-lg bg-[#281c12] border border-[#d4af37]/40 overflow-hidden flex items-center justify-center shrink-0">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                )}
              </div>
              <div className="text-left">
                <span className="font-semibold text-[#f7df94] block truncate max-w-[100px]">
                  {currentUser.displayName || 'ব্যবহারকারী'}
                </span>
                <span className={`text-[10px] flex items-center gap-1 leading-none ${
                  isSuperAdmin ? 'text-[#f7df94]' : isApproved ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isSuperAdmin ? 'bg-[#d4af37]' : isApproved ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}></span>
                  {isSuperAdmin ? 'Super Admin' : isApproved ? 'Approved' : 'Pending'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-lg bg-[#231810] flex items-center justify-center text-[#d4af37]">
                <Cloud className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-[#baa791] block">ক্লাউড লগইন</span>
                <span className="text-[10px] text-[#7d6b59] block leading-none">সিঙ্ক করুন</span>
              </div>
            </>
          )}
        </button>

        {actionButton}
      </div>
    </div>
  );
};
