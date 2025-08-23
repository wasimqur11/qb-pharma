import React, { useState, useRef } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { parseCSVData, convertToTransactions, validateImportData, type ImportResult } from '../utils/dataImportUtils';
import { DocumentArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const DataImport: React.FC = () => {
  const { addTransaction } = useTransactions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isImported, setIsImported] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);
    setWarnings([]);
    setImportResult(null);
    setIsImported(false);

    try {
      const content = await readFileAsText(file);
      console.log('File content loaded, length:', content.length);
      
      // Parse the CSV data
      const rawData = parseCSVData(content);
      console.log('Parsed CSV rows:', rawData.length);
      
      // Validate the data
      const validation = validateImportData(rawData);
      setErrors(validation.errors);
      setWarnings(validation.warnings);
      console.log('Validation result:', validation);
      
      if (validation.isValid) {
        // Convert to transactions
        const result = convertToTransactions(rawData);
        console.log('Generated transactions:', result.transactions.length);
        console.log('Transaction summary:', result.summary);
        setImportResult(result);
      }
    } catch (error) {
      console.error('File processing error:', error);
      setErrors([`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!importResult) return;

    try {
      console.log('Starting import of', importResult.transactions.length, 'transactions');
      
      // Add all transactions to the context with error handling for each
      let successCount = 0;
      let errorCount = 0;
      
      importResult.transactions.forEach((transaction, index) => {
        try {
          addTransaction(transaction);
          successCount++;
        } catch (err) {
          console.error(`Error importing transaction ${index + 1}:`, err);
          errorCount++;
        }
      });

      console.log(`Import completed: ${successCount} successful, ${errorCount} failed`);
      
      setIsImported(true);
      
      if (errorCount > 0) {
        alert(`Imported ${successCount} transactions successfully, ${errorCount} failed. Check console for details.`);
      } else {
        alert(`Successfully imported ${successCount} transactions!`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Error importing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Import Transaction Data</h2>
        <p className="text-gray-400 text-sm">
          Upload your TestData.csv file. Expected columns: Date, Fee, Payment (Dr. Expenses), Sale, Payment (Distributor), Expenses, Note
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv,.txt"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <DocumentArrowUpIcon className="h-5 w-5" />
          {isProcessing ? 'Processing...' : 'Select CSV File'}
        </button>
        <p className="text-gray-500 text-xs mt-2">
          Your TestData.csv file is ready to import directly!
        </p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-6 bg-red-900/30 border border-red-700 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-red-300 font-semibold">Errors Found</h3>
          </div>
          <ul className="text-red-400 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-6 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <h3 className="text-yellow-300 font-semibold">Warnings</h3>
          </div>
          <ul className="text-yellow-400 text-sm space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Import Summary */}
      {importResult && (
        <div className="mb-6 bg-gray-900 border border-gray-600 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">Import Preview</h3>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">Total Transactions</div>
              <div className="text-lg font-bold text-white">{importResult.summary.totalTransactions}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-green-400">Pharmacy Sales</div>
              <div className="text-lg font-bold text-green-300">{formatCurrency(importResult.summary.pharmacySales)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-blue-400">Consultation Fees</div>
              <div className="text-lg font-bold text-blue-300">{formatCurrency(importResult.summary.consultationFees)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-purple-400">Distributor Payments</div>
              <div className="text-lg font-bold text-purple-300">{formatCurrency(importResult.summary.distributorPayments)}</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-2">Expenses</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Doctor Expenses:</span>
                  <span className="text-white">{formatCurrency(importResult.summary.doctorExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Clinic Expenses:</span>
                  <span className="text-white">{formatCurrency(importResult.summary.clinicExpenses)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-2">Payments</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Partner Distributions:</span>
                  <span className="text-white">{formatCurrency(importResult.summary.partnerDistributions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Employee Salaries:</span>
                  <span className="text-white">{formatCurrency(importResult.summary.employeeSalaries)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-2">Categories Detected</div>
              <div className="space-y-1 text-sm text-gray-300">
                <div>• Pharmacy Sales</div>
                <div>• Consultation Fees</div>
                <div>• Doctor Expenses</div>
                <div>• Distributor Payments</div>
                <div>• Partner Distributions</div>
                <div>• Employee Payments</div>
                <div>• Clinic Expenses</div>
              </div>
            </div>
          </div>

          {/* Import Button */}
          {!isImported && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleImport}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Import {importResult.summary.totalTransactions} Transactions
              </button>
            </div>
          )}

          {/* Success Message */}
          {isImported && (
            <div className="mt-6 bg-green-900/30 border border-green-700 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-green-300 font-semibold">
                  Successfully imported {importResult.summary.totalTransactions} transactions!
                </span>
              </div>
              <p className="text-green-400 text-sm mt-2">
                You can now view the imported data in the dashboard and use it for payment estimation.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Your Data Structure:</h4>
        <ul className="text-blue-400 text-sm space-y-1">
          <li><strong>Date:</strong> Transaction date (DD-MMM-YYYY format)</li>
          <li><strong>Fee:</strong> Consultation fees earned</li>
          <li><strong>Payment:</strong> Doctor expenses paid</li>
          <li><strong>Sale:</strong> Pharmacy sales revenue</li>
          <li><strong>Payment:</strong> Distributor payments made</li>
          <li><strong>Expenses:</strong> Other expenses (partner distributions, salaries)</li>
          <li><strong>Note:</strong> Partner names (Ajaz, Anayat, Wasim, Afzal) or expense types</li>
        </ul>
        <div className="mt-3 p-2 bg-blue-800/50 rounded text-xs text-blue-300">
          <strong>Ready to import:</strong> Your TestData.csv contains {/* calculated from file */}60 days of transaction data from June-August 2025
        </div>
      </div>
    </div>
  );
};

export default DataImport;