import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getHijriDateDetails } from '../services/islamicCalendarService';
import { Cloud, User as UserIcon, Crown, Bell, CheckCircle2, XCircle, Check } from 'lucide-react';

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
    userNotifications,
    unreadNotificationsCount,
    markNotificationRead,
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!notifOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [notifOpen]);

  const handleMarkAllRead = async () => {
    const unread = userNotifications.filter((item) => !item.read);
    await Promise.all(unread.map((item) => markNotificationRead(item.id)));
  };

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

        <div className="flex items-center gap-2 shrink-0">
          {currentUser && userNotifications.length > 0 && (
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="পেমেন্ট নোটিফিকেশন"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#141419] border border-white/10 text-[#f5f3ee] shrink-0"
            >
              <Bell className="w-4 h-4 text-[#d4af37]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E2136E] text-white text-[10px] font-bold tabular-nums flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141419] border border-white/10 text-xs font-medium text-[#f5f3ee] min-h-[40px] shrink-0"
          >
            <Cloud className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>{currentUser ? 'একাউন্ট' : 'লগইন'}</span>
          </button>
        </div>
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

          {/* User Payment Notifications Popover */}
          {currentUser && userNotifications.length > 0 && (
            <div ref={notifContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-expanded={notifOpen}
                aria-label="পেমেন্ট নোটিফিকেশন"
                className="hidden md:inline-flex relative items-center justify-center w-10 h-10 rounded-xl bg-[#141419] hover:bg-[#1b1b22] border border-white/[0.08] hover:border-white/15 text-[#f5f3ee] transition"
                title="পেমেন্ট ও একাউন্ট নোটিফিকেশন"
              >
                <Bell className="w-4 h-4 text-[#d4af37]" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E2136E] text-white text-[10px] font-bold tabular-nums flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="fixed md:absolute right-4 md:right-0 top-16 md:top-12 z-50 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl bg-[#141419] border border-white/10 shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between gap-2 bg-[#1b1b22]">
                    <div>
                      <h3 className="text-xs font-bold text-[#f5f3ee]">পেমেন্ট নোটিফিকেশন</h3>
                      <p className="text-[11px] text-[#807a72] tabular-nums">
                        অপঠিত: {unreadNotificationsCount} টি
                      </p>
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#141419] hover:bg-[#23232c] border border-white/10 text-[11px] font-semibold text-[#f2d77d] transition"
                      >
                        <Check className="w-3 h-3" />
                        <span>সব পঠিত</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06]">
                    {userNotifications.slice(0, 10).map((notif) => {
                      const isApprovedNotice = notif.type === 'payment_approved';
                      return (
                        <button
                          key={notif.id}
                          type="button"
                          onClick={() => {
                            if (!notif.read) {
                              markNotificationRead(notif.id);
                            }
                          }}
                          className={`w-full text-left px-4 py-3 transition flex items-start gap-3 ${
                            notif.read
                              ? 'bg-[#141419] opacity-75 hover:opacity-100'
                              : 'bg-[#1b1b22]/80 hover:bg-[#1b1b22]'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isApprovedNotice ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#f5f3ee] truncate">
                                {notif.title}
                              </span>
                              {!notif.read && (
                                <span className="text-[10px] font-bold text-[#E2136E] shrink-0">
                                  নতুন
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#b6b0a6] leading-relaxed">
                              {notif.message}
                            </p>
                            {notif.rejectionReason && (
                              <p className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/20 rounded-lg px-2.5 py-1.5 leading-relaxed">
                                কারণ: {notif.rejectionReason}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#807a72] font-mono tabular-nums">
                              {notif.createdAt && (
                                <span>{new Date(notif.createdAt).toLocaleString('bn-BD')}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
