import React, { useState, useRef } from 'react';
import {
  DocumentArrowUpIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { useStakeholders } from '../contexts/StakeholderContext';
import type { Distributor } from '../types';

interface DistributorBulkUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DistributorUploadData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  creditBalance: number;
  paymentSchedule: 'weekly' | 'bi-weekly' | 'monthly';
  paymentPercentage: number;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface UploadResult {
  success: boolean;
  processed: number;
  errors: ValidationError[];
  data?: DistributorUploadData[];
  failed?: number;
  duplicates?: number;
}

const DistributorBulkUpload: React.FC<DistributorBulkUploadProps> = ({ isOpen, onClose }) => {
  const { addDistributor, loadAllData } = useStakeholders();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = {
    title: 'Distributor Bulk Upload',
    description: 'Upload distributor information from Excel or CSV file',
    sampleColumns: [
      'Company Name', 'Contact Person', 'Email', 'Phone', 'Address', 
      'Credit Balance', 'Payment Schedule', 'Payment Percentage'
    ],
    requiredColumns: ['Company Name', 'Contact Person', 'Email', 'Phone', 'Address'],
    maxRows: 500
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please select a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
    setUploadResult(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const validateDistributorData = (data: any[], startRow: number = 2): { validData: DistributorUploadData[]; errors: ValidationError[] } => {
    const validData: DistributorUploadData[] = [];
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowNumber = startRow + index;
      const distributorData: Partial<DistributorUploadData> = {};

      // Required field validation
      const name = row['Company Name'] || row['Name'] || row['company_name'] || row['name'];
      if (!name || typeof name !== 'string' || name.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'Company Name',
          message: 'Company Name is required'
        });
      } else {
        distributorData.name = name.trim();
      }

      const contactPerson = row['Contact Person'] || row['Contact'] || row['contact_person'] || row['contact'];
      if (!contactPerson || typeof contactPerson !== 'string' || contactPerson.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'Contact Person',
          message: 'Contact Person is required'
        });
      } else {
        distributorData.contactPerson = contactPerson.trim();
      }

      const email = row['Email'] || row['email'];
      if (!email || typeof email !== 'string' || email.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'Email',
          message: 'Email is required'
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.push({
          row: rowNumber,
          field: 'Email',
          message: 'Invalid email format'
        });
      } else {
        distributorData.email = email.trim().toLowerCase();
      }

      const phone = row['Phone'] || row['phone'];
      if (!phone || typeof phone !== 'string' || phone.toString().trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'Phone',
          message: 'Phone number is required'
        });
      } else {
        distributorData.phone = phone.toString().trim();
      }

      const address = row['Address'] || row['address'];
      if (!address || typeof address !== 'string' || address.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'Address',
          message: 'Address is required'
        });
      } else {
        distributorData.address = address.trim();
      }

      // Optional fields with defaults
      const creditBalance = row['Credit Balance'] || row['credit_balance'] || 0;
      distributorData.creditBalance = typeof creditBalance === 'number' ? creditBalance : parseFloat(creditBalance.toString()) || 0;

      const paymentSchedule = row['Payment Schedule'] || row['payment_schedule'] || 'monthly';
      const validSchedules = ['weekly', 'bi-weekly', 'monthly'];
      if (validSchedules.includes(paymentSchedule.toString().toLowerCase().trim())) {
        distributorData.paymentSchedule = paymentSchedule.toString().toLowerCase().trim() as 'weekly' | 'bi-weekly' | 'monthly';
      } else {
        distributorData.paymentSchedule = 'monthly';
      }

      const paymentPercentage = row['Payment Percentage'] || row['payment_percentage'] || 10;
      const parsedPercentage = typeof paymentPercentage === 'number' ? paymentPercentage : parseFloat(paymentPercentage.toString()) || 10;
      distributorData.paymentPercentage = Math.max(1, Math.min(100, parsedPercentage));

      // Only add if all required fields are valid
      if (distributorData.name && distributorData.contactPerson && distributorData.email && 
          distributorData.phone && distributorData.address) {
        validData.push(distributorData as DistributorUploadData);
      }
    });

    return { validData, errors };
  };

  const processExcelFile = async (file: File): Promise<UploadResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            resolve({
              success: false,
              processed: 0,
              errors: [{
                row: 1,
                field: 'File',
                message: 'File is empty or has no valid data'
              }]
            });
            return;
          }

          if (jsonData.length > config.maxRows) {
            resolve({
              success: false,
              processed: 0,
              errors: [{
                row: 1,
                field: 'File',
                message: `File contains ${jsonData.length} rows. Maximum allowed is ${config.maxRows}`
              }]
            });
            return;
          }

          const { validData, errors } = validateDistributorData(jsonData);

          resolve({
            success: errors.length === 0 && validData.length > 0,
            processed: validData.length,
            errors,
            data: validData
          });

        } catch (error) {
          resolve({
            success: false,
            processed: 0,
            errors: [{
              row: 1,
              field: 'File',
              message: 'Failed to parse file. Please check the format and try again.'
            }]
          });
        }
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleProcessFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress({ current: 0, total: 0 });

    try {
      const result = await processExcelFile(file);

      if (result.success && result.data) {
        const totalRecords = result.data.length;
        setUploadProgress({ current: 0, total: totalRecords });

        let successCount = 0;
        let failedCount = 0;
        let duplicateCount = 0;
        const uploadErrors: ValidationError[] = [...result.errors];

        // Process distributors in small batches to avoid UI freezing
        const BATCH_SIZE = 3;
        for (let i = 0; i < result.data.length; i += BATCH_SIZE) {
          const batch = result.data.slice(i, Math.min(i + BATCH_SIZE, result.data.length));

          // Process batch concurrently with proper error handling
          const batchPromises = batch.map(async (distributorData, batchIndex) => {
            const rowNumber = i + batchIndex + 2; // +2 for header row and 0-based index
            try {
              const nextPaymentDue = new Date();
              nextPaymentDue.setDate(nextPaymentDue.getDate() +
                (distributorData.paymentSchedule === 'weekly' ? 7 :
                 distributorData.paymentSchedule === 'bi-weekly' ? 14 : 30));

              // Call API directly without updating local state to prevent overwhelming React
              const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/stakeholders/distributors`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  name: distributorData.name,
                  contactPerson: distributorData.contactPerson,
                  email: distributorData.email,
                  phone: distributorData.phone,
                  address: distributorData.address,
                  creditBalance: distributorData.creditBalance,
                  paymentSchedule: distributorData.paymentSchedule,
                  paymentPercentage: distributorData.paymentPercentage,
                  nextPaymentDue: nextPaymentDue.toISOString().split('T')[0]
                })
              });

              const responseData = await response.json();

              if (!response.ok) {
                throw new Error(responseData.error || 'Failed to add distributor');
              }

              return { success: true, rowNumber };
            } catch (error: any) {
              // Check if it's a duplicate error
              const isDuplicate = error?.message?.includes('duplicate') ||
                                 error?.message?.includes('already exists');

              return {
                success: false,
                rowNumber,
                isDuplicate,
                error: error?.message || 'Unknown error'
              };
            }
          });

          const batchResults = await Promise.all(batchPromises);

          // Update counts
          batchResults.forEach((res) => {
            if (res.success) {
              successCount++;
            } else {
              failedCount++;
              if (res.isDuplicate) {
                duplicateCount++;
                uploadErrors.push({
                  row: res.rowNumber,
                  field: 'Company Name',
                  message: 'Duplicate: A distributor with this name already exists'
                });
              } else {
                uploadErrors.push({
                  row: res.rowNumber,
                  field: 'Upload',
                  message: res.error || 'Failed to add distributor'
                });
              }
            }
          });

          // Update progress - use callback to avoid stale state
          setUploadProgress(prev => ({ ...prev, current: i + batch.length }));

          // Delay to allow UI to update and prevent overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setUploadResult({
          success: successCount > 0,
          processed: successCount,
          failed: failedCount,
          duplicates: duplicateCount,
          errors: uploadErrors
        });

        // Refresh all stakeholder data to sync across all clients
        if (successCount > 0) {
          await loadAllData();
        }
      } else {
        setUploadResult(result);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        processed: 0,
        errors: [{
          row: 1,
          field: 'File',
          message: 'An unexpected error occurred while processing the file.'
        }]
      });
    }

    setIsProcessing(false);
    setUploadProgress({ current: 0, total: 0 });
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Company Name': 'ABC Pharmaceuticals',
        'Contact Person': 'John Doe',
        'Email': 'john@abc-pharma.com',
        'Phone': '+92-300-1234567',
        'Address': '123 Medical St, Karachi',
        'Credit Balance': 50000,
        'Payment Schedule': 'weekly',
        'Payment Percentage': 10
      },
      {
        'Company Name': 'XYZ Medical Supplies',
        'Contact Person': 'Jane Smith',
        'Email': 'jane@xyz-medical.com',
        'Phone': '+92-321-7654321',
        'Address': '456 Health Ave, Lahore',
        'Credit Balance': 75000,
        'Payment Schedule': 'bi-weekly',
        'Payment Percentage': 12
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Distributors');
    XLSX.writeFile(wb, 'distributor_bulk_upload_template.xlsx');
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    setUploadProgress({ current: 0, total: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-750">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <UserGroupIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{config.title}</h2>
              <p className="text-sm text-gray-400">{config.description}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {!uploadResult ? (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-blue-400">Upload Instructions</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>• Upload Excel (.xlsx, .xls) or CSV files only</p>
                      <p>• Maximum file size: 10MB</p>
                      <p>• Maximum rows: {config.maxRows.toLocaleString()}</p>
                      <p>• Required columns: {config.requiredColumns.join(', ')}</p>
                      <p>• Optional columns: Credit Balance, Payment Schedule, Payment Percentage</p>
                      <p>• Payment Schedule options: weekly, bi-weekly, monthly (default: monthly)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-gray-750 border border-gray-600 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-white">Download Template</h4>
                  <p className="text-sm text-gray-400">Get the Excel template with sample data and required columns</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download Template
                </button>
              </div>

              {/* File Upload Area */}
              <div
                className={clsx(
                  "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  dragActive 
                    ? "border-blue-500 bg-blue-500/10" 
                    : file 
                      ? "border-green-500 bg-green-500/10"
                      : "border-gray-600 hover:border-gray-500"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                />
                
                <div className="space-y-4">
                  <div className={clsx(
                    "mx-auto w-16 h-16 rounded-full flex items-center justify-center",
                    file ? "bg-green-600" : "bg-gray-600"
                  )}>
                    {file ? (
                      <CheckCircleIcon className="h-8 w-8 text-white" />
                    ) : (
                      <CloudArrowUpIcon className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  
                  {file ? (
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-white">{file.name}</p>
                      <p className="text-sm text-gray-400">
                        Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        onClick={resetUpload}
                        className="text-sm text-blue-400 hover:text-blue-300 underline"
                      >
                        Choose different file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-white">
                        Drag and drop your distributor file here
                      </p>
                      <p className="text-gray-400">or click to browse</p>
                      <p className="text-sm text-gray-500">
                        Supports: .xlsx, .xls, .csv
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Columns */}
              <div className="bg-gray-750 border border-gray-600 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3">Expected Columns</h4>
                <div className="flex flex-wrap gap-2">
                  {config.sampleColumns.map((column, index) => (
                    <span
                      key={index}
                      className={clsx(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        config.requiredColumns.includes(column)
                          ? "bg-red-900 text-red-300 border border-red-600"
                          : "bg-gray-700 text-gray-300 border border-gray-600"
                      )}
                    >
                      {column}
                      {config.requiredColumns.includes(column) && <span className="ml-1">*</span>}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">* Required columns</p>
              </div>
            </div>
          ) : (
            /* Upload Results */
            <div className="space-y-4">
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Success Count */}
                <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    <h4 className="text-sm font-medium text-green-400">Successful</h4>
                  </div>
                  <p className="text-2xl font-bold text-white">{uploadResult.processed || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Records added successfully</p>
                </div>

                {/* Duplicate Count */}
                <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                    <h4 className="text-sm font-medium text-yellow-400">Duplicates</h4>
                  </div>
                  <p className="text-2xl font-bold text-white">{uploadResult.duplicates || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Company names already exist</p>
                </div>

                {/* Failed Count */}
                <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <XMarkIcon className="h-5 w-5 text-red-400" />
                    <h4 className="text-sm font-medium text-red-400">Failed</h4>
                  </div>
                  <p className="text-2xl font-bold text-white">{(uploadResult.failed || 0) - (uploadResult.duplicates || 0)}</p>
                  <p className="text-xs text-gray-400 mt-1">Other validation errors</p>
                </div>
              </div>

              {/* Overall Status */}
              <div className={clsx(
                "p-4 rounded-lg border",
                uploadResult.success
                  ? "bg-green-900/20 border-green-600/50"
                  : "bg-red-900/20 border-red-600/50"
              )}>
                <div className="flex items-center gap-3">
                  {uploadResult.success ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  ) : (
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                  )}
                  <div>
                    <h3 className={clsx(
                      "font-medium",
                      uploadResult.success ? "text-green-400" : "text-red-400"
                    )}>
                      {uploadResult.success
                        ? uploadResult.failed
                          ? 'Upload Completed with Some Errors'
                          : 'Upload Completed Successfully!'
                        : 'Upload Failed'
                      }
                    </h3>
                    <p className="text-sm text-gray-300">
                      Total: {(uploadResult.processed || 0) + (uploadResult.failed || 0)} records processed
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Error Breakdown */}
              {uploadResult.errors.length > 0 && (
                <div className="bg-gray-750 border border-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                    Detailed Error Report ({uploadResult.errors.length} issues)
                  </h4>

                  {/* Categorize errors */}
                  {(() => {
                    const duplicateErrors = uploadResult.errors.filter(e => e.message.includes('Duplicate') || e.message.includes('already exists'));
                    const validationErrors = uploadResult.errors.filter(e => !e.message.includes('Duplicate') && !e.message.includes('already exists'));

                    return (
                      <div className="space-y-4">
                        {/* Duplicate Errors */}
                        {duplicateErrors.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-yellow-400 mb-2 uppercase">
                              Duplicate Entries ({duplicateErrors.length})
                            </h5>
                            <div className="space-y-1 max-h-40 overflow-y-auto bg-gray-800 rounded p-2">
                              {duplicateErrors.map((error, index) => (
                                <div key={index} className="text-sm text-yellow-300 flex items-start gap-2 py-0.5">
                                  <span className="text-yellow-400 mt-0.5">•</span>
                                  <span>
                                    <strong className="text-yellow-400">Row {error.row}:</strong> {error.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Validation Errors */}
                        {validationErrors.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-red-400 mb-2 uppercase">
                              Validation Errors ({validationErrors.length})
                            </h5>
                            <div className="space-y-1 max-h-40 overflow-y-auto bg-gray-800 rounded p-2">
                              {validationErrors.map((error, index) => (
                                <div key={index} className="text-sm text-red-300 flex items-start gap-2 py-0.5">
                                  <span className="text-red-400 mt-0.5">•</span>
                                  <span>
                                    <strong className="text-red-400">Row {error.row}, {error.field}:</strong> {error.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={resetUpload}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Upload Another File
                </button>
                {uploadResult.success && (
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!uploadResult && (
          <div className="px-6 py-4 border-t border-gray-700 bg-gray-750">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessFile}
                disabled={!file || isProcessing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {uploadProgress.total > 0
                      ? `Processing... ${uploadProgress.current}/${uploadProgress.total}`
                      : 'Processing...'
                    }
                  </>
                ) : (
                  <>
                    <DocumentArrowUpIcon className="h-4 w-4" />
                    Process File
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributorBulkUpload;