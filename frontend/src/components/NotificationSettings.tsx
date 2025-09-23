import React, { useState, useEffect } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  PlayIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import apiClient from '../utils/apiClient';

interface NotificationConfig {
  email?: {
    smtpHost: { value: string; description: string };
    smtpPort: { value: string; description: string };
    smtpUser: { value: string; description: string };
    smtpPassword: { value: string; description: string };
    fromName: { value: string; description: string };
    fromEmail: { value: string; description: string };
    enableTLS: { value: string; description: string };
  };
  sms?: Record<string, { value: string; description: string }>;
  whatsapp?: Record<string, { value: string; description: string }>;
}

interface NotificationLog {
  id: string;
  type: string;
  recipient: string;
  subject?: string;
  message: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
  sentAt?: string;
}

const NotificationSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'whatsapp' | 'logs'>('email');
  const [config, setConfig] = useState<NotificationConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Form states
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromName: '',
    fromEmail: '',
    enableTLS: true
  });

  const [smsConfig, setSmsConfig] = useState({
    provider: 'twilio',
    apiKey: '',
    apiSecret: '',
    fromNumber: ''
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    provider: 'twilio',
    apiKey: '',
    apiSecret: '',
    fromNumber: ''
  });

  const [testConfig, setTestConfig] = useState({
    email: '',
    phone: '',
    whatsapp: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/notifications/config');
      const { configurations } = response.data;

      setConfig(configurations);

      // Show info message if no configurations exist yet
      if (!configurations.email && !configurations.sms && !configurations.whatsapp) {
        setMessage({
          type: 'success',
          text: 'Notification system ready! Configure your email settings below to start sending notifications.'
        });
      }

      // Populate form states
      if (configurations.email) {
        setEmailConfig({
          smtpHost: configurations.email.smtpHost?.value || '',
          smtpPort: parseInt(configurations.email.smtpPort?.value || '587'),
          smtpUser: configurations.email.smtpUser?.value || '',
          smtpPassword: '', // Don't show masked password
          fromName: configurations.email.fromName?.value || '',
          fromEmail: configurations.email.fromEmail?.value || '',
          enableTLS: configurations.email.enableTLS?.value === 'true'
        });
      }

      if (configurations.sms) {
        setSmsConfig({
          provider: configurations.sms.provider?.value || 'twilio',
          apiKey: configurations.sms.apiKey?.value || '',
          apiSecret: '', // Don't show masked secret
          fromNumber: configurations.sms.fromNumber?.value || ''
        });
      }

      if (configurations.whatsapp) {
        setWhatsappConfig({
          provider: configurations.whatsapp.provider?.value || 'twilio',
          apiKey: configurations.whatsapp.apiKey?.value || '',
          apiSecret: '', // Don't show masked secret
          fromNumber: configurations.whatsapp.fromNumber?.value || ''
        });
      }
    } catch (error: any) {
      console.error('Failed to load configuration:', error);
      // Only show error if it's not a 401/403 authentication issue
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage({
          type: 'error',
          text: 'Authentication expired. Please log out and log in again to access notification settings.'
        });
      } else {
        setMessage({
          type: 'error',
          text: error.response?.data?.error || 'Failed to load notification configuration. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await apiClient.get('/notifications/logs?limit=50');
      setLogs(response.data.logs);
    } catch (error: any) {
      console.error('Failed to load logs:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to load notification logs. Please check your permissions.'
      });
    } finally {
      setLogsLoading(false);
    }
  };

  const saveEmailConfig = async () => {
    try {
      setSaving(true);
      await apiClient.put('/notifications/config/email', emailConfig);
      setMessage({ type: 'success', text: 'Email configuration saved successfully' });
      loadConfiguration(); // Reload to get updated configs
    } catch (error: any) {
      console.error('Failed to save email config:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save email configuration' });
    } finally {
      setSaving(false);
    }
  };

  const saveSmsConfig = async () => {
    try {
      setSaving(true);
      await apiClient.put('/notifications/config/sms', smsConfig);
      setMessage({ type: 'success', text: 'SMS configuration saved successfully' });
      loadConfiguration();
    } catch (error: any) {
      console.error('Failed to save SMS config:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save SMS configuration' });
    } finally {
      setSaving(false);
    }
  };

  const saveWhatsappConfig = async () => {
    try {
      setSaving(true);
      await apiClient.put('/notifications/config/whatsapp', whatsappConfig);
      setMessage({ type: 'success', text: 'WhatsApp configuration saved successfully' });
      loadConfiguration();
    } catch (error: any) {
      console.error('Failed to save WhatsApp config:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save WhatsApp configuration' });
    } finally {
      setSaving(false);
    }
  };

  const testConfiguration = async (type: 'email' | 'sms' | 'whatsapp') => {
    const recipients = {
      email: testConfig.email,
      sms: testConfig.phone,
      whatsapp: testConfig.whatsapp
    };

    const recipient = recipients[type];
    if (!recipient) {
      setMessage({ type: 'error', text: `Please enter a ${type} address to test` });
      return;
    }

    try {
      setTesting(true);
      await apiClient.post(`/notifications/config/test/${type}`, { recipient });
      setMessage({ type: 'success', text: `Test ${type} notification sent successfully` });

      // Reload logs to show the test notification
      if (activeTab === 'logs') {
        setTimeout(loadLogs, 1000);
      }
    } catch (error: any) {
      console.error(`Failed to test ${type}:`, error);
      setMessage({ type: 'error', text: error.response?.data?.error || `Failed to test ${type} configuration` });
    } finally {
      setTesting(false);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-400';
      case 'delivered': return 'text-green-500';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />;
      default:
        return <InformationCircleIcon className="h-4 w-4 text-yellow-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        <span className="ml-2 text-gray-300">Loading notification settings...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Notification Settings</h2>
        <p className="text-gray-400 mt-1">Configure email, SMS, and WhatsApp notifications</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-md ${
          message.type === 'success'
            ? 'bg-green-900/20 border border-green-700/50 text-green-300'
            : 'bg-red-900/20 border border-red-700/50 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex space-x-1">
          {[
            { id: 'email', label: 'Email', icon: EnvelopeIcon },
            { id: 'sms', label: 'SMS', icon: PhoneIcon },
            { id: 'whatsapp', label: 'WhatsApp', icon: ChatBubbleLeftRightIcon },
            { id: 'logs', label: 'Logs', icon: InformationCircleIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setMessage(null); // Clear messages when switching tabs
              }}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Email Configuration */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={emailConfig.smtpHost}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={emailConfig.smtpPort}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value) })}
                  placeholder="587"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SMTP Username/Email
                </label>
                <input
                  type="email"
                  value={emailConfig.smtpUser}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                  placeholder="your-email@gmail.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SMTP Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.smtpPassword ? 'text' : 'password'}
                    value={emailConfig.smtpPassword}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
                    placeholder="App password or email password"
                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('smtpPassword')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.smtpPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  value={emailConfig.fromName}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                  placeholder="QB Pharma"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From Email
                </label>
                <input
                  type="email"
                  value={emailConfig.fromEmail}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                  placeholder="noreply@qbpharma.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableTLS"
                checked={emailConfig.enableTLS}
                onChange={(e) => setEmailConfig({ ...emailConfig, enableTLS: e.target.checked })}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
              />
              <label htmlFor="enableTLS" className="ml-2 text-sm text-gray-300">
                Enable TLS encryption
              </label>
            </div>

            {/* Test Email */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Test Email Configuration</h4>
              <div className="flex space-x-3">
                <input
                  type="email"
                  value={testConfig.email}
                  onChange={(e) => setTestConfig({ ...testConfig, email: e.target.value })}
                  placeholder="test@example.com"
                  className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => testConfiguration('email')}
                  disabled={testing || !testConfig.email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  {testing ? 'Testing...' : 'Test'}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveEmailConfig}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Email Configuration'}
              </button>
            </div>
          </div>
        )}

        {/* SMS Configuration */}
        {activeTab === 'sms' && (
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-700/50 p-4 rounded-lg">
              <div className="flex items-center">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-blue-300 text-sm">SMS functionality will be implemented in a future release</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SMS Provider
                </label>
                <select
                  value={smsConfig.provider}
                  onChange={(e) => setSmsConfig({ ...smsConfig, provider: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="twilio">Twilio</option>
                  <option value="aws-sns">AWS SNS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key / Account SID
                </label>
                <input
                  type="text"
                  value={smsConfig.apiKey}
                  onChange={(e) => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
                  placeholder="Your API key"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Secret / Auth Token
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.smsSecret ? 'text' : 'password'}
                    value={smsConfig.apiSecret}
                    onChange={(e) => setSmsConfig({ ...smsConfig, apiSecret: e.target.value })}
                    placeholder="Your API secret"
                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('smsSecret')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.smsSecret ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From Number
                </label>
                <input
                  type="text"
                  value={smsConfig.fromNumber}
                  onChange={(e) => setSmsConfig({ ...smsConfig, fromNumber: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveSmsConfig}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save SMS Configuration'}
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp Configuration */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-700/50 p-4 rounded-lg">
              <div className="flex items-center">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-blue-300 text-sm">WhatsApp functionality will be implemented in a future release</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  WhatsApp Provider
                </label>
                <select
                  value={whatsappConfig.provider}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, provider: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="twilio">Twilio</option>
                  <option value="meta">Meta (WhatsApp Business)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key / Access Token
                </label>
                <input
                  type="text"
                  value={whatsappConfig.apiKey}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, apiKey: e.target.value })}
                  placeholder="Your API key"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Secret / App Secret
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.whatsappSecret ? 'text' : 'password'}
                    value={whatsappConfig.apiSecret}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, apiSecret: e.target.value })}
                    placeholder="Your API secret"
                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('whatsappSecret')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.whatsappSecret ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From Number
                </label>
                <input
                  type="text"
                  value={whatsappConfig.fromNumber}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, fromNumber: e.target.value })}
                  placeholder="whatsapp:+1234567890"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveWhatsappConfig}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save WhatsApp Configuration'}
              </button>
            </div>
          </div>
        )}

        {/* Notification Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Notification Logs</h3>
              <button
                onClick={loadLogs}
                disabled={logsLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {logsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {message && (
              <div className={`p-3 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-900/20 border border-green-700/50 text-green-300'
                  : 'bg-red-900/20 border border-red-700/50 text-red-300'
              }`}>
                {message.text}
              </div>
            )}

            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <span className="ml-2 text-gray-400">Loading logs...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {logs && logs.length > 0 ? logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {log.type === 'email' && <EnvelopeIcon className="h-4 w-4 text-blue-400 mr-2" />}
                            {log.type === 'sms' && <PhoneIcon className="h-4 w-4 text-green-400 mr-2" />}
                            {log.type === 'whatsapp' && <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-500 mr-2" />}
                            <span className="text-sm text-gray-300 capitalize">{log.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {log.recipient}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {log.subject || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(log.status)}
                            <span className={`ml-2 text-sm capitalize ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                          {message && message.type === 'error'
                            ? 'Unable to load logs. Please check your permissions and try again.'
                            : 'No notification logs found. Create some transactions to see email notifications here.'
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;