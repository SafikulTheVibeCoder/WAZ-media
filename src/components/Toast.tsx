import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2 } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#1e150f] text-[#f7df94] border border-[#d4af37]/40 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <CheckCircle2 className="w-5 h-5 text-[#d4af37] shrink-0" />
      <span className="text-sm font-medium">{toast}</span>
    </div>
  );
};
