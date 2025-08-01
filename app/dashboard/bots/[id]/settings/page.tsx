'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { showSuccess, showError } from '@/lib/toast';
import { 
  Bot, 
  Settings, 
  Shield, 
  Zap, 
  Globe, 
  Users, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function BotSettingsPage() {
  const params = useParams();
  const botId = params.id as string;
  
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Bot general settings
  const [generalForm, setGeneralForm] = useState({
    name: '',
    description: '',
    category: 'customer-support',
    status: 'active',
    language: 'en',
  });

  // Bot security settings
  const [securityForm, setSecurityForm] = useState({
    apiKey: '',
    webhookSecret: '',
    rateLimit: '1000',
    ipWhitelist: '',
    requireAuth: true,
  });

  // Bot integration settings
  const [integrationForm, setIntegrationForm] = useState({
    webhookUrl: '',
    slackWebhook: '',
    discordWebhook: '',
    emailNotifications: '',
    zapierWebhook: '',
  });

  // Bot advanced settings
  const [advancedForm, setAdvancedForm] = useState({
    maxConversations: '1000',
    sessionTimeout: '30',
    autoArchive: true,
    dataRetention: '90',
    debugMode: false,
  });

  useEffect(() => {
    fetchBotSettings();
  }, [botId]);

  const fetchBotSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bots/${botId}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.bot) {
        setGeneralForm({
          name: data.bot.name || '',
          description: data.bot.description || '',
          category: data.bot.category || 'customer-support',
          status: data.bot.status || 'active',
          language: data.bot.language || 'en',
        });
        
        // Load other settings if available
        if (data.bot.settings) {
          setSecurityForm(prev => ({
            ...prev,
            apiKey: data.bot.settings.apiKey || '',
            webhookSecret: data.bot.settings.webhookSecret || '',
            rateLimit: data.bot.settings.rateLimit || '1000',
            ipWhitelist: data.bot.settings.ipWhitelist || '',
            requireAuth: data.bot.settings.requireAuth !== false,
          }));
          
          setIntegrationForm(prev => ({
            ...prev,
            webhookUrl: data.bot.settings.webhookUrl || '',
            slackWebhook: data.bot.settings.slackWebhook || '',
            discordWebhook: data.bot.settings.discordWebhook || '',
            emailNotifications: data.bot.settings.emailNotifications || '',
            zapierWebhook: data.bot.settings.zapierWebhook || '',
          }));
        }
      }
    } catch (err) {
      showError('Failed to load bot settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneralSave = async () => {
    if (!generalForm.name.trim()) {
      showError('Bot name is required');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: generalForm.name.trim(),
          description: generalForm.description.trim(),
          category: generalForm.category,
          status: generalForm.status,
          language: generalForm.language,
        }),
        credentials: 'include',
      });
      if (res.ok) {
        showSuccess('General settings updated successfully!');
        fetchBotSettings();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to update general settings');
      }
    } catch (err) {
      showError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecuritySave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            apiKey: securityForm.apiKey,
            webhookSecret: securityForm.webhookSecret,
            rateLimit: securityForm.rateLimit,
            ipWhitelist: securityForm.ipWhitelist,
            requireAuth: securityForm.requireAuth,
          }
        }),
        credentials: 'include',
      });
      if (res.ok) {
        showSuccess('Security settings updated successfully!');
        fetchBotSettings();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to update security settings');
      }
    } catch (err) {
      showError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleIntegrationSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            webhookUrl: integrationForm.webhookUrl,
            slackWebhook: integrationForm.slackWebhook,
            discordWebhook: integrationForm.discordWebhook,
            emailNotifications: integrationForm.emailNotifications,
            zapierWebhook: integrationForm.zapierWebhook,
          }
        }),
        credentials: 'include',
      });
      if (res.ok) {
        showSuccess('Integration settings updated successfully!');
        fetchBotSettings();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to update integration settings');
      }
    } catch (err) {
      showError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdvancedSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            maxConversations: advancedForm.maxConversations,
            sessionTimeout: advancedForm.sessionTimeout,
            autoArchive: advancedForm.autoArchive,
            dataRetention: advancedForm.dataRetention,
            debugMode: advancedForm.debugMode,
          }
        }),
        credentials: 'include',
      });
      if (res.ok) {
        showSuccess('Advanced settings updated successfully!');
        fetchBotSettings();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to update advanced settings');
      }
    } catch (err) {
      showError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const generateApiKey = () => {
    const key = `botrix_${botId}_${Math.random().toString(36).substring(2, 15)}`;
    setSecurityForm(prev => ({ ...prev, apiKey: key }));
  };

  const generateWebhookSecret = () => {
    const secret = `whsec_${Math.random().toString(36).substring(2, 15)}`;
    setSecurityForm(prev => ({ ...prev, webhookSecret: secret }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied to clipboard!`);
  };

  const deleteBot = async () => {
    if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        showSuccess('Bot deleted successfully!');
        window.location.href = '/dashboard';
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to delete bot');
      }
    } catch (err) {
      showError('Network error. Please try again.');
    }
  };

  const exportBotData = () => {
    const data = {
      general: generalForm,
      security: securityForm,
      integration: integrationForm,
      advanced: advancedForm,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generalForm.name}-settings.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Bot settings exported successfully!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Bot },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integration', label: 'Integrations', icon: Zap },
    { id: 'advanced', label: 'Advanced', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bot Settings</h1>
            <p className="text-gray-600 mt-1">Configure your bot's behavior and integrations</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={exportBotData}
              variant="outline"
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Settings
            </Button>
            <Button 
              onClick={deleteBot}
              variant="destructive"
              className="flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Bot
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
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
            {/* General Settings */}
            {activeTab === 'general' && (
              <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-purple-500" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Bot Name</label>
                      <Input
                        value={generalForm.name}
                        onChange={e => setGeneralForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My Customer Support Bot"
                        disabled={isLoading}
                        className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Category</label>
                      <select
                        value={generalForm.category}
                        onChange={e => setGeneralForm(prev => ({ ...prev, category: e.target.value }))}
                        disabled={isLoading}
                        className="w-full h-12 px-3 border border-gray-200 rounded-md focus:border-purple-300 focus:ring-purple-200"
                      >
                        <option value="customer-support">Customer Support</option>
                        <option value="sales">Sales</option>
                        <option value="marketing">Marketing</option>
                        <option value="hr">HR</option>
                        <option value="technical">Technical</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Status</label>
                      <select
                        value={generalForm.status}
                        onChange={e => setGeneralForm(prev => ({ ...prev, status: e.target.value }))}
                        disabled={isLoading}
                        className="w-full h-12 px-3 border border-gray-200 rounded-md focus:border-purple-300 focus:ring-purple-200"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Language</label>
                      <select
                        value={generalForm.language}
                        onChange={e => setGeneralForm(prev => ({ ...prev, language: e.target.value }))}
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                    <textarea
                      value={generalForm.description}
                      onChange={e => setGeneralForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this bot does..."
                      disabled={isLoading}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-purple-300 focus:ring-purple-200"
                    />
                  </div>
                  <div className="pt-4">
                                          <Button 
                        onClick={handleGeneralSave} 
                        disabled={isSaving || isLoading}
                        className="bg-teal-600 text-white border-0 px-8 py-3 hover:bg-teal-700 hover:shadow-lg hover:scale-105 transition-all"
                      >
                      {isSaving ? 'Saving...' : 'Save General Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-purple-500" />
                    Security & Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">API Key</label>
                      <div className="flex space-x-2">
                        <div className="flex-1 relative">
                          <Input
                            type={showApiKey ? "text" : "password"}
                            value={securityForm.apiKey}
                            onChange={e => setSecurityForm(prev => ({ ...prev, apiKey: e.target.value }))}
                            placeholder="Generate your API key"
                            disabled={isLoading}
                            className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200 pr-20"
                          />
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <Button 
                          onClick={generateApiKey}
                          variant="outline"
                          className="px-4"
                        >
                          Generate
                        </Button>
                        {securityForm.apiKey && (
                          <Button 
                            onClick={() => copyToClipboard(securityForm.apiKey, 'API Key')}
                            variant="outline"
                            className="px-4"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Use this key to authenticate API requests</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Webhook Secret</label>
                      <div className="flex space-x-2">
                        <Input
                          type="password"
                          value={securityForm.webhookSecret}
                          onChange={e => setSecurityForm(prev => ({ ...prev, webhookSecret: e.target.value }))}
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
                        {securityForm.webhookSecret && (
                          <Button 
                            onClick={() => copyToClipboard(securityForm.webhookSecret, 'Webhook Secret')}
                            variant="outline"
                            className="px-4"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Secret for verifying webhook signatures</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Rate Limit (requests/hour)</label>
                        <Input
                          value={securityForm.rateLimit}
                          onChange={e => setSecurityForm(prev => ({ ...prev, rateLimit: e.target.value }))}
                          placeholder="1000"
                          disabled={isLoading}
                          type="number"
                          className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">IP Whitelist (optional)</label>
                        <Input
                          value={securityForm.ipWhitelist}
                          onChange={e => setSecurityForm(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                          placeholder="192.168.1.1, 10.0.0.0/8"
                          disabled={isLoading}
                          className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Require Authentication</h3>
                        <p className="text-sm text-gray-600">Force users to authenticate before accessing the bot</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.requireAuth}
                        onChange={e => setSecurityForm(prev => ({ ...prev, requireAuth: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={handleSecuritySave} 
                      disabled={isSaving || isLoading}
                      className="gradient-primary text-white border-0 px-8 py-3 hover:shadow-lg hover:scale-105 transition-all"
                    >
                      {isSaving ? 'Saving...' : 'Save Security Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Integration Settings */}
            {activeTab === 'integration' && (
              <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-purple-500" />
                    Integrations & Webhooks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Main Webhook URL</label>
                      <Input
                        value={integrationForm.webhookUrl}
                        onChange={e => setIntegrationForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                        placeholder="https://your-server.com/webhook"
                        disabled={isLoading}
                        className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Primary webhook for processing bot conversations</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Slack Webhook</label>
                        <Input
                          value={integrationForm.slackWebhook}
                          onChange={e => setIntegrationForm(prev => ({ ...prev, slackWebhook: e.target.value }))}
                          placeholder="https://hooks.slack.com/services/..."
                          disabled={isLoading}
                          className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Discord Webhook</label>
                        <Input
                          value={integrationForm.discordWebhook}
                          onChange={e => setIntegrationForm(prev => ({ ...prev, discordWebhook: e.target.value }))}
                          placeholder="https://discord.com/api/webhooks/..."
                          disabled={isLoading}
                          className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Email Notifications</label>
                        <Input
                          value={integrationForm.emailNotifications}
                          onChange={e => setIntegrationForm(prev => ({ ...prev, emailNotifications: e.target.value }))}
                          placeholder="alerts@yourcompany.com"
                          disabled={isLoading}
                          type="email"
                          className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Zapier Webhook</label>
                        <Input
                          value={integrationForm.zapierWebhook}
                          onChange={e => setIntegrationForm(prev => ({ ...prev, zapierWebhook: e.target.value }))}
                          placeholder="https://hooks.zapier.com/..."
                          disabled={isLoading}
                          className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={handleIntegrationSave} 
                      disabled={isSaving || isLoading}
                      className="gradient-primary text-white border-0 px-8 py-3 hover:shadow-lg hover:scale-105 transition-all"
                    >
                      {isSaving ? 'Saving...' : 'Save Integration Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Advanced Settings */}
            {activeTab === 'advanced' && (
              <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-purple-500" />
                    Advanced Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Max Conversations</label>
                      <Input
                        value={advancedForm.maxConversations}
                        onChange={e => setAdvancedForm(prev => ({ ...prev, maxConversations: e.target.value }))}
                        placeholder="1000"
                        disabled={isLoading}
                        type="number"
                        className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Maximum concurrent conversations</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Session Timeout (minutes)</label>
                      <Input
                        value={advancedForm.sessionTimeout}
                        onChange={e => setAdvancedForm(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                        placeholder="30"
                        disabled={isLoading}
                        type="number"
                        className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Inactive session timeout</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Data Retention (days)</label>
                      <Input
                        value={advancedForm.dataRetention}
                        onChange={e => setAdvancedForm(prev => ({ ...prev, dataRetention: e.target.value }))}
                        placeholder="90"
                        disabled={isLoading}
                        type="number"
                        className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">How long to keep conversation data</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Auto Archive Conversations</h3>
                        <p className="text-sm text-gray-600">Automatically archive old conversations</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={advancedForm.autoArchive}
                        onChange={e => setAdvancedForm(prev => ({ ...prev, autoArchive: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Debug Mode</h3>
                        <p className="text-sm text-gray-600">Enable detailed logging for troubleshooting</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={advancedForm.debugMode}
                        onChange={e => setAdvancedForm(prev => ({ ...prev, debugMode: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={handleAdvancedSave} 
                      disabled={isSaving || isLoading}
                      className="gradient-primary text-white border-0 px-8 py-3 hover:shadow-lg hover:scale-105 transition-all"
                    >
                      {isSaving ? 'Saving...' : 'Save Advanced Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 