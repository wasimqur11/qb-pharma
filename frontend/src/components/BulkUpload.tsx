import React, { useState, useRef } from 'react';
import {
  DocumentArrowUpIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface BulkUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: any[]) => void;
  uploadType: 'distributors' | 'inventory';
}

interface UploadResult {
  success: boolean;
  processed: number;
  errors: string[];
  data?: any[];
}

const BulkUpload: React.FC<BulkUploadProps> = ({ isOpen, onClose, onUpload, uploadType }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUploadConfig = () => {
    switch (uploadType) {
      case 'distributors':
        return {
          title: 'Distributor Bulk Upload',
          description: 'Upload distributor information from Excel file',
          sampleColumns: ['Company Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Credit Balance'],
          requiredColumns: ['Company Name', 'Contact Person', 'Email', 'Phone'],
          maxRows: 1000
        };
      case 'inventory':
        return {
          title: 'Inventory Bulk Upload',
          description: 'Upload inventory data from Excel file',
          sampleColumns: ['Product Name', 'Category', 'Unit Price', 'Quantity', 'Distributor', 'Expiry Date'],
          requiredColumns: ['Product Name', 'Category', 'Unit Price', 'Quantity'],
          maxRows: 5000
        };
      default:
        return {
          title: 'Bulk Upload',
          description: 'Upload data from Excel file',
          sampleColumns: [],
          requiredColumns: [],
          maxRows: 1000
        };
    }
  };

  const config = getUploadConfig();

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
    
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
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

  const processExcelFile = async (file: File): Promise<UploadResult> => {
    // Mock Excel processing - in real implementation, use libraries like xlsx
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = uploadType === 'distributors' ? [
          {
            name: 'ABC Pharmaceuticals',
            contactPerson: 'John Doe',
            email: 'john@abc-pharma.com',
            phone: '+92-300-1234567',
            address: '123 Medical St, Karachi',
            creditBalance: 150000
          },
          {
            name: 'XYZ Medical Supplies',
            contactPerson: 'Jane Smith',
            email: 'jane@xyz-medical.com',
            phone: '+92-321-7654321',
            address: '456 Health Ave, Lahore',
            creditBalance: 200000
          },
          {
            name: 'Global Med Distributors',
            contactPerson: 'Ahmed Ali',
            email: 'ahmed@globalmed.com',
            phone: '+92-300-9876543',
            address: '789 Pharmacy Rd, Islamabad',
            creditBalance: 300000
          }
        ] : [
          {
            productName: 'Panadol 500mg',
            category: 'Pain Relief',
            unitPrice: 2.50,
            quantity: 1000,
            distributor: 'ABC Pharmaceuticals',
            expiryDate: '2025-12-31'
          },
          {
            productName: 'Augmentin 625mg',
            category: 'Antibiotic',
            unitPrice: 15.75,
            quantity: 500,
            distributor: 'XYZ Medical Supplies',
            expiryDate: '2025-08-15'
          }
        ];

        resolve({
          success: true,
          processed: mockData.length,
          errors: [],
          data: mockData
        });
      }, 2000);
    });
  };

  const handleProcessFile = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const result = await processExcelFile(file);
      setUploadResult(result);
      
      if (result.success && result.data) {
        onUpload(result.data);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        processed: 0,
        errors: ['Failed to process file. Please check the format and try again.']
      });
    }
    setIsProcessing(false);
  };

  const downloadTemplate = () => {
    // Mock template download
    alert(`${config.title} template downloaded (demo functionality)`);
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-750">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <DocumentArrowUpIcon className="h-5 w-5 text-white" />
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
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-gray-750 border border-gray-600 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-white">Download Template</h4>
                  <p className="text-sm text-gray-400">Get the Excel template with required columns</p>
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
                        Drag and drop your file here
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
              <div className={clsx(
                "p-4 rounded-lg border",
                uploadResult.success 
                  ? "bg-green-900/30 border-green-600" 
                  : "bg-red-900/30 border-red-600"
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
                      {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {uploadResult.success 
                        ? `${uploadResult.processed} records processed successfully`
                        : `${uploadResult.errors.length} errors found`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="bg-gray-750 border border-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Errors:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-400 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
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

export default BulkUpload;