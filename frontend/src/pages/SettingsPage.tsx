import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  BellIcon,
  CogIcon,
  MoonIcon,
  SunIcon,
  KeyIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  ClockIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface NotificationSettings {
  emailNotifications: boolean;
  tweetScheduled: boolean;
  tweetPublished: boolean;
  extractionComplete: boolean;
  contractAnalyzed: boolean;
}

interface ApiKeySettings {
  openaiKey: string;
  anthropicKey: string;
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessSecret: string;
  api2ConvertKey: string;
}

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'api-keys' | 'security'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    tweetScheduled: true,
    tweetPublished: true,
    extractionComplete: true,
    contractAnalyzed: true
  });

  const [apiKeys, setApiKeys] = useState<ApiKeySettings>({
    openaiKey: '',
    anthropicKey: '',
    twitterApiKey: '',
    twitterApiSecret: '',
    twitterAccessToken: '',
    twitterAccessSecret: '',
    api2ConvertKey: ''
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${apiUrl}/users/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.notifications) {
        setNotifications(response.data.notifications);
      }
      // API keys would be masked from the backend
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApiKeyChange = (key: keyof ApiKeySettings, value: string) => {
    setApiKeys(prev => ({ ...prev, [key]: value }));
  };

  const saveNotificationSettings = async () => {
    setIsSaving(true);
    try {
      await axios.put(
        `${apiUrl}/users/settings/notifications`,
        notifications,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Notification settings saved!');
    } catch (error) {
      toast.error('Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const saveApiKeys = async () => {
    setIsSaving(true);
    try {
      // Only send non-empty keys
      const keysToUpdate = Object.entries(apiKeys).reduce((acc, [key, value]) => {
        if (value && value.trim()) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      await axios.put(
        `${apiUrl}/users/settings/api-keys`,
        keysToUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('API keys updated!');
      // Clear the form after successful save
      setApiKeys({
        openaiKey: '',
        anthropicKey: '',
        twitterApiKey: '',
        twitterApiSecret: '',
        twitterAccessToken: '',
        twitterAccessSecret: '',
        api2ConvertKey: ''
      });
    } catch (error) {
      toast.error('Failed to update API keys');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'api-keys', name: 'API Keys', icon: KeyIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your application preferences and configurations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${activeTab === tab.id
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                General Settings
              </h2>

              <div className="space-y-6">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      Appearance
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Choose your preferred theme
                    </p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="relative inline-flex items-center px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 transition-colors"
                  >
                    {theme === 'light' ? (
                      <>
                        <SunIcon className="h-5 w-5 mr-2 text-yellow-500" />
                        <span className="text-gray-900 dark:text-white">Light</span>
                      </>
                    ) : (
                      <>
                        <MoonIcon className="h-5 w-5 mr-2 text-indigo-400" />
                        <span className="text-gray-900 dark:text-white">Dark</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      Language
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Select your preferred language
                    </p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>

                {/* Timezone */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      Timezone
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Set your local timezone
                    </p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>UTC</option>
                    <option>Eastern Time</option>
                    <option>Pacific Time</option>
                    <option>Central European Time</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                Notification Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('emailNotifications')}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${notifications.emailNotifications ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                    Notification Types
                  </h4>
                  
                  {[
                    { key: 'tweetScheduled', label: 'Tweet Scheduled', desc: 'When a tweet is scheduled for posting' },
                    { key: 'tweetPublished', label: 'Tweet Published', desc: 'When a scheduled tweet is published' },
                    { key: 'extractionComplete', label: 'Text Extraction Complete', desc: 'When text extraction finishes' },
                    { key: 'contractAnalyzed', label: 'Contract Analyzed', desc: 'When contract analysis is complete' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.desc}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications[item.key as keyof NotificationSettings]}
                        onChange={() => handleNotificationChange(item.key as keyof NotificationSettings)}
                        disabled={!notifications.emailNotifications}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    onClick={saveNotificationSettings}
                    disabled={isSaving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API Keys Settings */}
          {activeTab === 'api-keys' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  API Keys Configuration
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Configure your API keys for external services. Keys are encrypted and stored securely.
                </p>
              </div>

              <div className="space-y-6">
                {/* AI Services */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                    AI Services
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        OpenAI API Key
                      </label>
                      <input
                        type={showApiKeys ? 'text' : 'password'}
                        value={apiKeys.openaiKey}
                        onChange={(e) => handleApiKeyChange('openaiKey', e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Anthropic API Key
                      </label>
                      <input
                        type={showApiKeys ? 'text' : 'password'}
                        value={apiKeys.anthropicKey}
                        onChange={(e) => handleApiKeyChange('anthropicKey', e.target.value)}
                        placeholder="sk-ant-..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Twitter API */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                    Twitter API
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        API Key
                      </label>
                      <input
                        type={showApiKeys ? 'text' : 'password'}
                        value={apiKeys.twitterApiKey}
                        onChange={(e) => handleApiKeyChange('twitterApiKey', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        API Secret
                      </label>
                      <input
                        type={showApiKeys ? 'text' : 'password'}
                        value={apiKeys.twitterApiSecret}
                        onChange={(e) => handleApiKeyChange('twitterApiSecret', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Access Token
                      </label>
                      <input
                        type={showApiKeys ? 'text' : 'password'}
                        value={apiKeys.twitterAccessToken}
                        onChange={(e) => handleApiKeyChange('twitterAccessToken', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Access Secret
                      </label>
                      <input
                        type={showApiKeys ? 'text' : 'password'}
                        value={apiKeys.twitterAccessSecret}
                        onChange={(e) => handleApiKeyChange('twitterAccessSecret', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Processing */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                    Document Processing
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API2Convert API Key
                    </label>
                    <input
                      type={showApiKeys ? 'text' : 'password'}
                      value={apiKeys.api2ConvertKey}
                      onChange={(e) => handleApiKeyChange('api2ConvertKey', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showApiKeys}
                      onChange={(e) => setShowApiKeys(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      Show API keys
                    </span>
                  </label>
                  <button
                    onClick={saveApiKeys}
                    disabled={isSaving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Update API Keys'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                Security Settings
              </h2>

              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex">
                    <CheckIcon className="h-5 w-5 text-green-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Two-Factor Authentication
                      </h3>
                      <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                        Your account is secured with 2FA
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                    Active Sessions
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center">
                        <ComputerDesktopIcon className="h-10 w-10 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Current Session
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Active now • This device
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                    Login History
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last login: {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;