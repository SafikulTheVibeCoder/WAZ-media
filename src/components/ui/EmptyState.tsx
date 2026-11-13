import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#141419] border border-white/[0.08] rounded-2xl py-12 px-6 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-[#1b1b22] border border-white/[0.08] flex items-center justify-center text-[#807a72] mb-3.5">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#f5f3ee]">{title}</h3>
      {description && (
        <p className="text-xs text-[#807a72] mt-1.5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
