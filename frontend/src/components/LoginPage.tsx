import React, { useState } from 'react';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  LockClosedIcon, 
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import qbLogo from '../assets/qblogo.png';

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const success = await login(formData.username, formData.password);
      
      if (!success) {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: 'username' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 flex relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>
      
      {/* Left Side - Branding & Description */}
      <div className="hidden lg:flex flex-1 items-stretch p-16 relative z-10">
        <div className="max-w-2xl w-full flex flex-col">
          {/* Logo & Branding */}
          <div className="text-left mb-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl flex-shrink-0">
                <img src={qbLogo} alt="QB Pharmacy Management" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-lg leading-tight">
                  QB Pharmacy Management
                </h1>
                <p className="text-lg text-white/80 drop-shadow-md font-medium mt-2">
                  Where Healthcare Meets Analytics
                </p>
              </div>
            </div>
          </div>

          {/* Combined Description & Features Container */}
          <div className="bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl p-8 flex-1 flex flex-col justify-center">
            {/* Software Description */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 drop-shadow-md">
                Comprehensive Business Intelligence Platform
              </h2>
              <div className="space-y-3">
                <p className="text-sm text-white/90 leading-relaxed font-medium">
                  QB Pharmacy Management is a comprehensive business intelligence platform designed for pharmacy owners and healthcare entrepreneurs. Manage multiple revenue streams including pharmacy sales, doctor consultations, and business partnerships.
                </p>
                <p className="text-sm text-white/90 leading-relaxed font-medium">
                  Track stakeholder relationships, automate financial reporting, and gain real-time insights into your healthcare business performance.
                </p>
              </div>
            </div>

            {/* Key Features */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 drop-shadow-md">
                Key Features
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-white/90 font-medium">Multi-stream revenue management</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-white/90 font-medium">Automated financial reporting</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-white/90 font-medium">Real-time business analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-white/90 font-medium">Stakeholder relationship tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header - Only visible on small screens */}
      <div className="lg:hidden absolute top-0 left-0 right-0 z-20 p-6 bg-black/20 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl flex-shrink-0">
            <img src={qbLogo} alt="QB Pharmacy Management" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white drop-shadow-lg">
              QB Pharmacy Management
            </h1>
            <p className="text-xs text-white/80 drop-shadow-md font-medium">
              Where Healthcare Meets Analytics
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[36rem] flex items-stretch p-6 lg:p-16 relative z-10 pt-24 lg:pt-16">
        <div className="w-full max-w-md mx-auto lg:mx-0 flex flex-col">
          {/* Login Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-white/80 drop-shadow-md">
              Sign in to your account to continue
            </p>
          </div>
          
          {/* Login Form Container - Matching height with left side */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-8 relative overflow-hidden flex-1 flex flex-col justify-center">
            {/* Glass effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 rounded-2xl"></div>
            <div className="relative z-10">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-3 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-300 flex-shrink-0" />
                    <p className="text-red-200 text-xs">{error}</p>
                  </div>
                )}

                {/* Username Field */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-semibold text-white drop-shadow-md">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-white/80" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={formData.username}
                      onChange={handleInputChange('username')}
                      className="w-full pl-12 pr-4 py-4 bg-black/30 backdrop-blur-sm border border-white/40 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 text-sm font-medium shadow-inner"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-white drop-shadow-md">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-white/80" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      className="w-full pl-12 pr-14 py-4 bg-black/30 backdrop-blur-sm border border-white/40 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 text-sm font-medium shadow-inner"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/80 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 backdrop-blur-sm border border-white/40 rounded-xl shadow-xl text-sm font-bold text-white hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] drop-shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="bg-black/30 backdrop-blur-sm border border-blue-400/50 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-2 drop-shadow-md">Demo Credentials</h3>
                  <div className="text-sm text-white space-y-1 font-medium">
                    <p><span className="font-bold">Username:</span> superadmin</p>
                    <p><span className="font-bold">Password:</span> admin123</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Features - Only visible on small screens */}
          <div className="lg:hidden mt-6 pt-6 border-t border-white/20">
            <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 drop-shadow-md text-center">
                Comprehensive Business Intelligence Platform
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-white/90 font-medium">Multi-stream revenue management</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-white/90 font-medium">Automated financial reporting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-white/90 font-medium">Real-time business analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-white/90 font-medium">Stakeholder relationship tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer for Login Side */}
          <div className="text-center mt-6">
            <p className="text-xs text-white/60 drop-shadow-md">
              © 2024 QB Pharmacy Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;