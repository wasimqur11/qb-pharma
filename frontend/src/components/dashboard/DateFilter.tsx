import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface DateFilterProps {
  selectedPeriod: string;
  dateRange: { from: string; to: string };
  onPeriodChange: (period: string) => void;
  onDateRangeChange: (range: { from: string; to: string }) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ selectedPeriod, dateRange, onPeriodChange, onDateRangeChange }) => (
  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 mb-4">
    {/* Desktop Layout */}
    <div className="hidden md:flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-300">Period:</span>
        </div>

        <select
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        >
          <option value="7days">7 Days</option>
          <option value="30days">30 Days</option>
          <option value="90days">90 Days</option>
          <option value="6months">6 Months</option>
          <option value="1year">1 Year</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.from}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.to}
            min={dateRange.from}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      <div className="text-xs text-gray-400">
        {new Date(dateRange.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
        {new Date(dateRange.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
    </div>

    {/* Mobile Layout */}
    <div className="md:hidden space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-300">Filter Period</span>
        </div>
        <div className="text-xs text-gray-400">
          {new Date(dateRange.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
          {new Date(dateRange.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last 1 Year</option>
        </select>

        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.from}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
            className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
          <input
            type="date"
            value={dateRange.to}
            min={dateRange.from}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
            className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>
    </div>
  </div>
);

export default DateFilter;
