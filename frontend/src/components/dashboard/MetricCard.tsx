import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  subtitle?: string;
  icon: React.ElementType;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, subtitle, icon: Icon }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-gray-400" />
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
        </div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className={clsx(
        'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
        changeType === 'increase' && 'bg-green-900 text-green-300',
        changeType === 'decrease' && 'bg-red-900 text-red-300',
        changeType === 'neutral' && 'bg-gray-700 text-gray-300'
      )}>
        {changeType === 'increase' && <ArrowUpIcon className="h-3 w-3" />}
        {changeType === 'decrease' && <ArrowDownIcon className="h-3 w-3" />}
        {change}
      </div>
    </div>
  </div>
);

export default MetricCard;
