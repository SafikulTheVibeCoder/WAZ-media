import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2 } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#18181f] text-[#f5f3ee] border border-[#d4af37]/35 shadow-2xl max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0" />
      <span className="text-xs sm:text-sm font-medium leading-snug">{toast}</span>
    </div>
  );
};
