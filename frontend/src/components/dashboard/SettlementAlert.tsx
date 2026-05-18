import React from 'react';
import { useRoleBasedData } from '../../hooks/useRoleBasedData';
import { useStakeholders } from '../../contexts/StakeholderContext';
import { formatCurrency } from '../../utils/formatters';

interface SettlementAlertProps {
  onStartSettlement: () => void;
}

const SettlementAlert: React.FC<SettlementAlertProps> = ({ onStartSettlement }) => {
  const { filteredDashboardStats } = useRoleBasedData();
  const { businessPartners } = useStakeholders();

  // Use all-time stats instead of filtered period data for settlement decisions
  const allTimeStats = filteredDashboardStats;
  const pharmacyCash = allTimeStats.pharmacyCashPosition;
  const hasBusinessPartners = businessPartners.length > 0;

  // Check if there are actual partner dues to pay
  const partnerPayables = allTimeStats.businessPartnerPayables;
  const totalPartnerDues = partnerPayables.reduce((sum, p) => sum + p.netPayable, 0);

  // Show alert only when:
  // 1. There's pharmacy cash available, AND
  // 2. There are business partners, AND
  // 3. There are actual partner dues to pay
  if (pharmacyCash <= 0 || !hasBusinessPartners || totalPartnerDues <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/30 border border-emerald-600/50 rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl animate-pulse">💰</div>
          <div>
            <h3 className="font-semibold text-emerald-400 text-xl">Settlement Opportunity Available</h3>
            <p className="text-gray-300 mb-2">
              Partner dues: <span className="font-mono text-emerald-400">{formatCurrency(totalPartnerDues)}</span> | Available cash: <span className="font-mono text-emerald-400">{formatCurrency(pharmacyCash)}</span>
            </p>
            <p className="text-sm text-emerald-300">
              Pay partner dues, track equity adjustments, and create a Settlement Point
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onStartSettlement}
            className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-transform text-lg"
          >
            🎯 Start Settlement
          </button>
          <p className="text-xs text-gray-400 text-center">
            {businessPartners.length} partner{businessPartners.length !== 1 ? 's' : ''} ready
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettlementAlert;
