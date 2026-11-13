import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BadgeCheck,
  FolderHeart,
  PlusCircle,
  Crown,
  Calendar,
  Home,
  MoreHorizontal,
  X,
  ChevronRight,
  LogIn,
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengaliUtils';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    brand,
    savedDesigns,
    startNewDesign,
    currentUser,
    isSuperAdmin,
    isApproved,
    setIsAuthModalOpen,
    currentPlan,
    dailyPosterLimit,
    setIsPricingModalOpen,
  } = useApp();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'captions', label: 'বাণী ও ক্যাপশন', icon: BookOpen },
    { id: 'planner', label: 'মিডিয়া প্ল্যানার', icon: Calendar },
    { id: 'poster', label: 'পোস্টার স্টুডিও', icon: Sparkles },
    { id: 'brand', label: 'ব্র্যান্ডিং', icon: BadgeCheck },
    {
      id: 'saved',
      label: 'সংরক্ষিত গ্যালারি',
      icon: FolderHeart,
      count: savedDesigns.length > 0 ? savedDesigns.length : undefined,
    },
    ...(isSuperAdmin
      ? [{ id: 'admin', label: 'সুপার এডমিন', icon: Crown, isSpecial: true }]
      : []),
  ];

  const primaryMobileItems = [
    { id: 'dashboard', label: 'ড্যাশ', icon: LayoutDashboard },
    { id: 'captions', label: 'বাণী', icon: BookOpen },
    { id: 'planner', label: 'প্ল্যানার', icon: Calendar },
    { id: 'poster', label: 'স্টুডিও', icon: Sparkles },
  ];

  const secondaryMobileItems = [
    { id: 'brand', label: 'ব্র্যান্ডিং ও লোগো', icon: BadgeCheck },
    {
      id: 'saved',
      label: 'সংরক্ষিত গ্যালারি',
      icon: FolderHeart,
      count: savedDesigns.length > 0 ? savedDesigns.length : undefined,
    },
    ...(isSuperAdmin ? [{ id: 'admin', label: 'সুপার এডমিন প্যানেল', icon: Crown }] : []),
    { id: 'landing', label: 'হোম ও ল্যান্ডিং পেজ', icon: Home },
  ];

  const isSecondaryActive = secondaryMobileItems.some((item) => item.id === currentView);

  const handleNav = (id: string) => {
    setCurrentView(id);
    setMobileMoreOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#101014] border-r border-white/[0.08] min-h-screen p-4 sticky top-0 h-screen select-none z-30 shrink-0">
        {/* Brand Header */}
        <button
          type="button"
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#18181f] text-left transition border border-transparent hover:border-white/[0.08]"
          title="হোম ও ল্যান্ডিং পেজে যান"
        >
          <div className="w-9 h-9 rounded-xl bg-[#18181f] border border-white/10 flex items-center justify-center shrink-0 p-1.5">
            <img
              src={brand.logo || '/logo.svg'}
              alt={brand.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm tracking-wide text-[#f2d77d] block truncate">
              {brand.name || 'WAZ MEDIA'}
            </span>
            <span className="text-[11px] text-[#807a72] block truncate">
              ইসলামিক মিডিয়া স্টুডিও
            </span>
          </div>
        </button>

        {/* Primary CTA */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              startNewDesign();
              setCurrentView('poster');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs shadow-sm transition active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন পোস্টার বানান</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto" aria-label="মূল নেভিগেশন">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition relative ${
                  isActive
                    ? 'bg-[#1b1b22] text-[#f5f3ee] border border-[#d4af37]/30'
                    : 'text-[#b6b0a6] hover:text-[#f5f3ee] hover:bg-[#16161c] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#d4af37]' : 'text-[#807a72]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className="text-[11px] font-semibold text-[#b6b0a6] tabular-nums">
                    {toBengaliNumber(item.count)}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setCurrentView('landing')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#807a72] hover:text-[#f5f3ee] hover:bg-[#16161c] transition"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>হোম ও ল্যান্ডিং পেজ</span>
            </button>
          </div>
        </nav>

        {/* Plan Quota Summary */}
        <div className="my-3 p-3.5 rounded-xl bg-[#141419] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-[#f5f3ee]">
              <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
              {currentPlan === 'enterprise'
                ? 'এন্টারপ্রাইজ'
                : currentPlan === 'pro'
                ? 'প্রো ক্রিয়েটর'
                : 'ফ্রি প্যাকেজ'}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium tabular-nums">
              {dailyPosterLimit === -1 ? 'আনলিমিটেড' : `${toBengaliNumber(dailyPosterLimit)}/দিন`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsPricingModalOpen(true)}
            className="w-full py-2 px-3 rounded-lg bg-[#1b1b22] hover:bg-[#23232c] text-[#f2d77d] border border-[#d4af37]/30 text-xs font-semibold transition"
          >
            প্রাইসিং ও আপগ্রেড
          </button>
        </div>

        {/* Account Status Footer */}
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full text-left pt-3 border-t border-white/[0.08] text-xs flex flex-col gap-1 hover:bg-[#16161c] p-2.5 rounded-xl transition"
          title="ক্লাউড ও একাউন্ট সেটিংস খুলুন"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-medium text-[#f5f3ee] truncate">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isSuperAdmin
                    ? 'bg-[#d4af37]'
                    : isApproved
                    ? 'bg-emerald-400'
                    : currentUser
                    ? 'bg-amber-400'
                    : 'bg-[#807a72]'
                }`}
              />
              <span className="truncate">
                {isSuperAdmin
                  ? 'সুপার এডমিন'
                  : isApproved
                  ? 'অনুমোদিত ক্রিয়েটর'
                  : currentUser
                  ? 'অনুমোদন অপেক্ষমাণ'
                  : 'অফলাইন মোড'}
              </span>
            </span>
            <span className="text-[10px] text-[#807a72] font-medium shrink-0">
              {isSuperAdmin ? 'Admin' : isApproved ? 'Active' : currentUser ? 'Pending' : 'Guest'}
            </span>
          </div>
          <span className="text-[11px] text-[#807a72] truncate">
            {currentUser
              ? currentUser.displayName || currentUser.email
              : 'ক্লাউডে সেভ করতে লগইন করুন'}
          </span>
        </button>
      </aside>

      {/* Mobile Bottom Navigation Bar (5 clean slots, <=64px height, >=44px touch targets) */}
      <nav
        aria-label="মোবাইল নেভিগেশন"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#101014]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-5 items-center h-16 px-1"
      >
        {primaryMobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl text-[11px] font-medium transition ${
                isActive ? 'text-[#f2d77d]' : 'text-[#807a72] hover:text-[#f5f3ee]'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#d4af37]' : ''}`} />
              <span className="truncate max-w-[56px]">{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileMoreOpen(true)}
          className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl text-[11px] font-medium transition ${
            isSecondaryActive || mobileMoreOpen ? 'text-[#f2d77d]' : 'text-[#807a72] hover:text-[#f5f3ee]'
          }`}
          aria-expanded={mobileMoreOpen}
        >
          <MoreHorizontal className="w-4 h-4 mb-0.5" />
          <span>আরো</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer */}
      {mobileMoreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="অতিরিক্ত মেনু"
          onClick={() => setMobileMoreOpen(false)}
        >
          <div
            className="w-full bg-[#141419] border-t border-white/12 rounded-t-2xl p-5 space-y-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <img
                  src={brand.logo || '/logo.svg'}
                  alt={brand.name}
                  className="w-7 h-7 object-contain"
                />
                <div>
                  <span className="text-sm font-bold text-[#f5f3ee] block">
                    {brand.name || 'WAZ MEDIA'}
                  </span>
                  <span className="text-[11px] text-[#807a72] block">সকল মেনু ও সেটিংস</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                aria-label="মেনু বন্ধ করুন"
                className="w-10 h-10 rounded-xl bg-[#1b1b22] text-[#b6b0a6] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {secondaryMobileItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition min-h-[44px] ${
                      isActive
                        ? 'bg-[#1b1b22] text-[#f2d77d] border border-[#d4af37]/30'
                        : 'bg-[#101014] text-[#f5f3ee] border border-white/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-[#807a72]'}`} />
                      <span>{item.label}</span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-[#807a72]">
                      {item.count !== undefined && (
                        <span className="tabular-nums">{toBengaliNumber(item.count)}</span>
                      )}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMoreOpen(false);
                  setIsPricingModalOpen(true);
                }}
                className="py-3 px-4 rounded-xl bg-[#d4af37] text-[#0b0b0e] font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Crown className="w-4 h-4" />
                <span>প্যাকেজ ও আপগ্রেড</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMoreOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="py-3 px-4 rounded-xl bg-[#1b1b22] text-[#f5f3ee] border border-white/10 font-semibold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <LogIn className="w-4 h-4 text-[#d4af37]" />
                <span>{currentUser ? 'একাউন্ট' : 'লগইন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
