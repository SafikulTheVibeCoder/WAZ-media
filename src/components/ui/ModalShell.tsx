import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidthClass?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  hideHeader?: boolean;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidthClass = 'max-w-lg',
  headerActions,
  footer,
  children,
  hideHeader = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'ডায়ালগ'}
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidthClass} bg-[#141419] border border-white/10 rounded-2xl shadow-2xl text-[#f5f3ee] overflow-hidden max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader && (
          <div className="px-5 py-4 border-b border-white/[0.08] bg-[#101014] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/25 flex items-center justify-center text-[#d4af37] shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h2 className="text-base sm:text-lg font-bold text-[#f5f3ee] truncate">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs text-[#807a72] mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                aria-label="বন্ধ করুন"
                className="w-10 h-10 rounded-xl bg-[#1b1b22] hover:bg-[#24242d] border border-white/[0.08] flex items-center justify-center text-[#b6b0a6] hover:text-[#f5f3ee] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-white/[0.08] bg-[#101014] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
