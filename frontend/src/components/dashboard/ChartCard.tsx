import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  height?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children, actions, height = '320px' }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden" style={{ height }}>
    <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
      </div>
      {actions && <div className="ml-3 flex-shrink-0">{actions}</div>}
    </div>
    <div className="p-4 h-full" style={{ height: `calc(${height} - 60px)` }}>
      {children}
    </div>
  </div>
);

export default ChartCard;
