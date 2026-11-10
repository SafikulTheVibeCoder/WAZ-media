import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Sparkles, 
  BadgeCheck, 
  FolderHeart,
  PlusCircle,
  Cloud,
  ShieldCheck,
  User as UserIcon,
  Crown,
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
    userProfile,
    isSuperAdmin,
    isApproved,
    setIsAuthModalOpen,
    currentPlan,
    dailyPosterLimit,
    setIsPricingModalOpen,
  } = useApp();


  const navItems = [
    { id: 'landing', label: 'হোম ও ল্যান্ডিং', icon: Sparkles },
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'captions', label: 'বাণী ও ক্যাপশন', icon: BookOpen },
    { id: 'poster', label: 'পোস্টার স্টুডিও', icon: Sparkles },
    { id: 'brand', label: 'ব্র্যান্ডিং', icon: BadgeCheck },
    { id: 'saved', label: 'সংরক্ষিত গ্যালারি', icon: FolderHeart, badge: savedDesigns.length },
    ...(isSuperAdmin
      ? [{ id: 'admin', label: 'সুপার এডমিন', icon: Crown, badge: 'Master', isSpecial: true }]
      : []),
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#140e0a] border-r border-[#2d2117] min-h-screen p-4 sticky top-0 h-screen select-none z-30">
        {/* Brand Header */}
        <div 
          onClick={() => setCurrentView(currentUser ? 'dashboard' : 'landing')}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#1f1610] cursor-pointer transition border border-transparent hover:border-[#382a1d]"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1d150e] border border-[#3b2a1a] flex items-center justify-center shrink-0 p-1.5 shadow-sm">
            <img
              src={brand.logo || '/logo.svg'}
              alt={brand.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-base tracking-wider text-[#f7df94] truncate">
              {brand.name || 'WAZ MEDIA'}
            </h1>
            <p className="text-[11px] text-[#a9947c] tracking-wider truncate uppercase">
              {brand.tagline || 'ISLAMIC POSTER STUDIO'}
            </p>
          </div>
        </div>

        {/* Quick action: New Poster */}
        <div className="mt-5 px-1">
          <button
            onClick={() => {
              startNewDesign();
              setCurrentView('poster');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-semibold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন পোস্টার বানান</span>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="mt-6 flex-1 space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d4af37]/20 to-[#8c6d1f]/10 text-[#f7df94] border border-[#d4af37]/40 shadow-sm'
                    : 'text-[#baa791] hover:text-[#f4eee2] hover:bg-[#1f1610]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-[#877461]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    item.id === 'admin'
                      ? 'bg-[#d4af37] text-[#140e0a] border-[#edd390]'
                      : 'bg-[#d4af37]/20 text-[#f7df94] border-[#d4af37]/30'
                  }`}>
                    {typeof item.badge === 'number' ? toBengaliNumber(item.badge) : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Upgrade / Pricing Banner in Sidebar */}
        <div className="my-2 p-3 rounded-2xl bg-gradient-to-br from-[#24170d] to-[#160f09] border border-[#d4af37]/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-[#f7df94]">
              <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
              {currentPlan === 'enterprise'
                ? 'এন্টারপ্রাইজ'
                : currentPlan === 'pro'
                ? 'প্রো ক্রিয়েটর'
                : 'ফ্রি প্যাকেজ'}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {dailyPosterLimit === -1 ? 'আনলিমিটেড' : `${toBengaliNumber(dailyPosterLimit)}টি/দিন`}
            </span>
          </div>

          <button
            onClick={() => setIsPricingModalOpen(true)}
            className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            <span>প্রাইসিং ও আপগ্রেড</span>
          </button>
        </div>

        {/* Bottom footer status */}
        <div 
          onClick={() => setIsAuthModalOpen(true)}
          className="pt-3 border-t border-[#2d2117] text-xs text-[#7e6d5b] flex flex-col gap-2 cursor-pointer hover:bg-[#1a120b] p-2 rounded-xl transition border border-transparent hover:border-[#38281b]"
          title="ক্লাউড ও পারমিশন সেটিংস খুলুন"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-[#baa791]">
              <span className={`w-2 h-2 rounded-full ${
                isSuperAdmin
                  ? 'bg-amber-400 animate-pulse'
                  : isApproved
                  ? 'bg-emerald-400 animate-pulse'
                  : currentUser
                  ? 'bg-amber-500'
                  : 'bg-neutral-500'
              }`}></span>
              {isSuperAdmin
                ? 'সুপার এডমিন সক্রিয়'
                : isApproved
                ? 'অনুমোদিত ক্রিয়েটর'
                : currentUser
                ? 'অনুমোদন অপেক্ষমাণ'
                : 'অফলাইন ডেমো'}
            </span>
            <span className="text-[10px] text-[#635547] bg-[#1a130e] px-1.5 py-0.5 rounded border border-[#2b2017]">
              {isSuperAdmin ? 'Admin' : isApproved ? 'Active' : currentUser ? 'Pending' : 'Guest'}
            </span>
          </div>

          <p className="text-[11px] leading-relaxed text-[#7a6a59] line-clamp-2">
            {currentUser 
              ? `${currentUser.displayName || currentUser.email}` 
              : 'ক্লাউডে সিঙ্ক ও যে কোনো ডিভাইস থেকে পেতে লগইন করুন।'}
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#140e0a]/95 backdrop-blur-md border-t border-[#2d2117] flex justify-around items-center px-1 py-1.5 shadow-2xl overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition shrink-0 ${
                isActive
                  ? 'text-[#f7df94] font-semibold'
                  : 'text-[#877461] hover:text-[#d3c2ad]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#d4af37]' : 'text-[#877461]'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-[#d4af37] text-[#140e0a] text-[8px] font-bold rounded-full min-w-3.5 h-3.5 px-0.5 flex items-center justify-center">
                    {typeof item.badge === 'number' ? toBengaliNumber(item.badge) : '★'}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
