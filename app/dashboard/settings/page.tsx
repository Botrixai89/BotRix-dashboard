'use client'

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { showSuccess, showError } from '@/lib/toast';
import { useAuth } from '@/lib/auth-context';
import { User, Settings, Key, Bell, Shield, Globe, Palette, Download, Upload } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Account settings
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    company: '',
    timezone: 'UTC',
  });

  // API settings
  const [apiForm, setApiForm] = useState({
    apiKey: '',
    webhookSecret: '',
    rateLimit: '1000',
  });

  // Notification settings
  const [notificationForm, setNotificationForm] = useState({
    emailNotifications: true,
    botAlerts: true,
    weeklyReports: false,
    errorAlerts: true,
  });

  // Appearance settings
  const [appearanceForm, setAppearanceForm] = useState({
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.user) {
        setAccountForm({
          name: data.user.name || '',
          email: data.user.email || '',
          company: data.user.company || '',
          timezone: data.user.timezone || 'UTC',
        });
      }
    } catch (err) {
      showError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSave = async () => {
    if (!accountForm.name.trim() || !accountForm.email.trim()) {
      showError('Name and email are required');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        showSuccess('Account settings updated successfully!');
        if (data.user && updateUser) {
          updateUser(data.user);
        }
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to update account settings');
      }
    } catch (err) {
      showError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApiSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API save
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('API settings updated successfully!');
    } catch (err) {
      showError('Failed to update API settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    setIsSaving(true);
    try {
      // Simulate notification save
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Notification preferences updated successfully!');
    } catch (err) {
      showError('Failed to update notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAppearanceSave = async () => {
    setIsSaving(true);
    try {
      // Simulate appearance save
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Appearance settings updated successfully!');
    } catch (err) {
      showError('Failed to update appearance settings');
    } finally {
      setIsSaving(false);
    }
  };

  const generateApiKey = () => {
    const key = 'botrix_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiForm(prev => ({ ...prev, apiKey: key }));
  };

  const generateWebhookSecret = () => {
    const secret = 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiForm(prev => ({ ...prev, webhookSecret: secret }));
  };

  const exportData = () => {
    const data = {
      account: accountForm,
      api: apiForm,
      notifications: notificationForm,
      appearance: appearanceForm,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'botrix-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Settings exported successfully!');
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'api', label: 'API & Webhooks', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Sidebar */}
      <div className="w-64 bg-white/80 backdrop-blur-sm border-r border-purple-100 shadow-sm">
        <div className="flex items-center px-6 py-6 border-b border-purple-100">
          <div className="flex items-center mr-3">
            <img src="/botrix-logo01.png" alt="Botrix Logo" className="h-8 w-auto" />
          </div>
        </div>
        
        <nav className="mt-6 px-4">
          <div className="space-y-2">
            <a href="/dashboard" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
              <User className="mr-3 h-5 w-5" />
              My Bots
            </a>
            <div className="flex items-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-md">
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </div>
          </div>
        </nav>

        {/* User Profile */}
        {user && (
          <div className="absolute bottom-6 left-4 right-4">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Configure your BotrixAI account and preferences</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={exportData}
                variant="outline"
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Settings
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-8 bg-white/50 backdrop-blur-sm rounded-xl p-2 border border-purple-100">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Account Settings */}
              {activeTab === 'account' && (
                <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <User className="w-5 h-5 mr-2 text-purple-500" />
                      Account Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
                        <Input
                          value={accountForm.name}
                          onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your full name"
                          disabled={isLoading}
                          className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Email Address</label>
                        <Input
                          value={accountForm.email}
                          onChange={e => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="you@company.com"
                          disabled={isLoading}
                          type="email"
                          className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Company</label>
                        <Input
                          value={accountForm.company}
                          onChange={e => setAccountForm(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Your company name"
                          disabled={isLoading}
                          className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Timezone</label>
                        <select
                          value={accountForm.timezone}
                          onChange={e => setAccountForm(prev => ({ ...prev, timezone: e.target.value }))}
                          disabled={isLoading}
                          className="w-full h-12 px-3 border border-gray-200 rounded-md focus:border-purple-300 focus:ring-purple-200"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={handleAccountSave} 
                        disabled={isSaving || isLoading}
                        className="gradient-primary text-white border-0 px-8 py-3 hover:shadow-lg hover:scale-105 transition-all"
                      >
                        {isSaving ? 'Saving...' : 'Save Account Settings'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* API Settings */}
              {activeTab === 'api' && (
                <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <Key className="w-5 h-5 mr-2 text-purple-500" />
                      API & Webhook Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">API Key</label>
                        <div className="flex space-x-2">
                          <Input
                            value={apiForm.apiKey}
                            onChange={e => setApiForm(prev => ({ ...prev, apiKey: e.target.value }))}
                            placeholder="Generate your API key"
                            disabled={isLoading}
                            className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                          />
                          <Button 
                            onClick={generateApiKey}
                            variant="outline"
                            className="px-4"
                          >
                            Generate
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Use this key to authenticate API requests</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Webhook Secret</label>
                        <div className="flex space-x-2">
                          <Input
                            value={apiForm.webhookSecret}
                            onChange={e => setApiForm(prev => ({ ...prev, webhookSecret: e.target.value }))}
                            placeholder="Generate webhook secret"
                            disabled={isLoading}
                            className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                          />
                          <Button 
                            onClick={generateWebhookSecret}
                            variant="outline"
                            className="px-4"
                          >
                            Generate
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Secret for verifying webhook signatures</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Rate Limit (requests/hour)</label>
                        <Input
                          value={apiForm.rateLimit}
                          onChange={e => setApiForm(prev => ({ ...prev, rateLimit: e.target.value }))}
                          placeholder="1000"
                          disabled={isLoading}
                          type="number"
                          className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum API requests per hour</p>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={handleApiSave} 
                        disabled={isSaving || isLoading}
                        className="gradient-primary text-white border-0 px-8 py-3 hover:shadow-lg hover:scale-105 transition-all"
                      >
                        {isSaving ? 'Saving...' : 'Save API Settings'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <Bell className="w-5 h-5 mr-2 text-purple-500" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Email Notifications</h3>
                          <p className="text-sm text-gray-600">Receive important updates via email</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationForm.emailNotifications}
                          onChange={e => setNotificationForm(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Bot Alerts</h3>
                          <p className="text-sm text-gray-600">Get notified when bots go offline or have issues</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationForm.botAlerts}
                          onChange={e => setNotificationForm(prev => ({ ...prev, botAlerts: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Weekly Reports</h3>
                          <p className="text-sm text-gray-600">Receive weekly performance summaries</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationForm.weeklyReports}
                          onChange={e => setNotificationForm(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Error Alerts</h3>
                          <p className="text-sm text-gray-600">Get notified of critical errors and issues</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationForm.errorAlerts}
                          onChange={e => setNotificationForm(prev => ({ ...prev, errorAlerts: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={handleNotificationSave} 
                        disabled={isSaving || isLoading}
                        className="gradient-primary text-white border-0 px-8 py-3 hover:shadow-lg hover:scale-105 transition-all"
                      >
                        {isSaving ? 'Saving...' : 'Save Notification Preferences'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <Palette className="w-5 h-5 mr-2 text-purple-500" />
                      Appearance & Language
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Theme</label>
                        <select
                          value={appearanceForm.theme}
                          onChange={e => setAppearanceForm(prev => ({ ...prev, theme: e.target.value }))}
                          disabled={isLoading}
                          className="w-full h-12 px-3 border border-gray-200 rounded-md focus:border-purple-300 focus:ring-purple-200"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto (System)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Language</label>
                        <select
                          value={appearanceForm.language}
                          onChange={e => setAppearanceForm(prev => ({ ...prev, language: e.target.value }))}
                          disabled={isLoading}
                          className="w-full h-12 px-3 border border-gray-200 rounded-md focus:border-purple-300 focus:ring-purple-200"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="ja">Japanese</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Date Format</label>
                        <select
                          value={appearanceForm.dateFormat}
                          onChange={e => setAppearanceForm(prev => ({ ...prev, dateFormat: e.target.value }))}
                          disabled={isLoading}
                          className="w-full h-12 px-3 border border-gray-200 rounded-md focus:border-purple-300 focus:ring-purple-200"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={handleAppearanceSave} 
                        disabled={isSaving || isLoading}
                        className="gradient-primary text-white border-0 px-8 py-3 hover:shadow-lg hover:scale-105 transition-all"
                      >
                        {isSaving ? 'Saving...' : 'Save Appearance Settings'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 