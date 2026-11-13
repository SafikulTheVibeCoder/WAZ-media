import React from 'react';
import { useApp } from '../context/AppContext';
import { getHijriDateDetails } from '../services/islamicCalendarService';
import { Cloud, User as UserIcon, Crown } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actionButton }) => {
  const {
    brand,
    currentUser,
    userProfile,
    isSuperAdmin,
    isApproved,
    setIsAuthModalOpen,
    setCurrentView,
  } = useApp();

  return (
    <header className="flex flex-col gap-4 pb-5 mb-6 border-b border-white/[0.08]">
      {/* Compact mobile brand strip */}
      <div className="flex md:hidden items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-2.5 min-w-0"
        >
          <div className="w-8 h-8 rounded-lg bg-[#141419] border border-white/10 flex items-center justify-center shrink-0 p-1">
            <img
              src={brand.logo || '/logo.svg'}
              alt={brand.name}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-sm text-[#f2d77d] truncate">
            {brand.name || 'WAZ MEDIA'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141419] border border-white/10 text-xs font-medium text-[#f5f3ee] min-h-[40px] shrink-0"
        >
          <Cloud className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>{currentUser ? 'একাউন্ট' : 'লগইন'}</span>
        </button>
      </div>

      {/* Main Title & Right Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-[#f5f3ee] leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#b6b0a6] mt-1 font-normal max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Unboxed Hijri Date Metadata */}
          <div className="hidden xl:flex flex-col text-right pr-2 border-r border-white/[0.08]">
            <span className="text-[11px] font-medium text-[#d4af37]">আজকের হিজরি</span>
            <span className="text-xs text-[#807a72]">{getHijriDateDetails(new Date()).formattedBn}</span>
          </div>

          {/* Super Admin Panel Shortcut */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setCurrentView('admin')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#23232c] border border-[#d4af37]/30 text-xs font-semibold text-[#f2d77d] transition min-h-[40px]"
              title="সুপার এডমিন কন্ট্রোল প্যানেল"
            >
              <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>এডমিন প্যানেল</span>
            </button>
          )}

          {/* Account Button */}
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#141419] hover:bg-[#1b1b22] border border-white/[0.08] hover:border-white/15 text-xs transition min-h-[40px]"
            title="ফায়ারবেস ক্লাউড ডেটাবেজ ও ব্যবহারকারী একাউন্ট"
          >
            {currentUser ? (
              <>
                <div className="w-6 h-6 rounded-lg bg-[#1b1b22] border border-[#d4af37]/30 overflow-hidden flex items-center justify-center shrink-0">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  )}
                </div>
                <div className="text-left leading-tight">
                  <span className="font-semibold text-[#f5f3ee] block truncate max-w-[110px]">
                    {currentUser.displayName || userProfile?.displayName || 'ব্যবহারকারী'}
                  </span>
                  <span
                    className={`text-[10px] font-medium ${
                      isSuperAdmin
                        ? 'text-[#d4af37]'
                        : isApproved
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {isSuperAdmin ? 'Super Admin' : isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 text-[#d4af37]" />
                <span className="font-semibold text-[#f5f3ee]">ক্লাউড লগইন</span>
              </>
            )}
          </button>

          {actionButton}
        </div>
      </div>
    </header>
  );
};
