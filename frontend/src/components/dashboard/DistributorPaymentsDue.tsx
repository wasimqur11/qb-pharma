import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrency } from '../../utils/formatters';

const DistributorPaymentsDue: React.FC = () => {
  const { getDistributorPaymentsDue } = useTransactions();
  const paymentsDue = getDistributorPaymentsDue();

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg h-fit">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
        <BellIcon className="h-4 w-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-white">Distributor Payments Due</h3>
        {paymentsDue.length > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {paymentsDue.length}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {paymentsDue.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">No payments due today</p>
          ) : (
            paymentsDue.slice(0, 4).map((payment, idx) => {
              const isOverdue = new Date(payment.dueDate) < new Date();
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">{payment.name}</p>
                    <span className={`text-sm font-bold ${isOverdue ? 'text-red-400' : 'text-orange-400'}`}>
                      {formatCurrency(payment.amountDue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                    {isOverdue && <span className="text-red-400 font-medium">OVERDUE</span>}
                  </div>
                </div>
              );
            })
          )}
          {paymentsDue.length > 4 && (
            <div className="pt-2 text-center border-t border-gray-700">
              <p className="text-xs text-gray-400">+{paymentsDue.length - 4} more payments due</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistributorPaymentsDue;
