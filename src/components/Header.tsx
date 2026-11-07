import React from 'react';
import { useApp } from '../context/AppContext';
import { getTodayHijriEstimate } from '../utils/bengaliUtils';
import { Sparkles, Image as ImageIcon, Bookmark } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actionButton }) => {
  const { brand } = useApp();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#2d2117]">
      {/* Mobile brand header shown only on small screens */}
      <div className="flex md:hidden items-center gap-3">
        <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-[#d4af37] to-[#8c6d1f] flex items-center justify-center shrink-0">
          <img
            src={brand.logo || '/logo.svg'}
            alt="Logo"
            className="w-full h-full object-contain rounded-full bg-[#140e0a]"
          />
        </div>
        <div>
          <span className="font-bold text-sm tracking-wider text-[#f7df94]">{brand.name}</span>
          <span className="text-[10px] text-[#877461] block">{brand.tagline}</span>
        </div>
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
        <div className="hidden lg:flex flex-col text-right">
          <span className="text-xs font-medium text-[#c49b3a]">আজকের তারিখ</span>
          <span className="text-xs text-[#877461]">{getTodayHijriEstimate()}</span>
        </div>
        {actionButton}
      </div>
    </div>
  );
};
