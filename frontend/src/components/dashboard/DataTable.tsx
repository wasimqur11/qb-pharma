import React, { useState } from 'react';

interface Column {
  key: string;
  label: string;
  render?: (value: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  data: any[];
  columns: Column[];
  maxRows?: number;
  expandable?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ title, data, columns, maxRows = 5, expandable = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayData = isExpanded ? data : data.slice(0, maxRows);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg h-fit">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {expandable && data.length > maxRows && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
          >
            {isExpanded ? 'Show Less' : `Show All (${data.length})`}
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {displayData.map((row, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {columns[0]?.render ? columns[0].render(row[columns[0].key]) : row[columns[0].key]}
                </p>
              </div>
              <div className="ml-3 text-right">
                <p className="text-sm font-semibold text-gray-300">
                  {columns[1]?.render ? columns[1].render(row[columns[1].key]) : row[columns[1].key]}
                </p>
              </div>
            </div>
          ))}
          {expandable && !isExpanded && data.length > maxRows && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors hover:bg-gray-700 px-2 py-1 rounded"
              >
                +{data.length - maxRows} more items - Click to view all
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataTable;
