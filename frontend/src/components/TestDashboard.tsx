import React from 'react';

const TestDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">QB Pharmacy Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Today's Revenue</h3>
            <p className="text-3xl font-bold text-green-600">₨27,000</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Cash Position</h3>
            <p className="text-3xl font-bold text-blue-600">₨185,000</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Monthly Profit</h3>
            <p className="text-3xl font-bold text-purple-600">₨425,000</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Doctor Payables</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Dr. Wasim Qureshi</span>
              <span className="font-bold text-red-600">₨31,000</span>
            </div>
            <div className="flex justify-between">
              <span>Dr. Fatima Sheikh</span>
              <span className="font-bold text-red-600">₨14,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;