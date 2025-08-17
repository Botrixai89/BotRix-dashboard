'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Bell, Mail, MessageSquare, Shield, Zap, Save } from 'lucide-react'
import { showSuccess, showError } from '@/lib/toast'

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface NotificationSettings {
  email: {
    botMessages: boolean
    systemUpdates: boolean
    securityAlerts: boolean
    weeklyReports: boolean
    marketingEmails: boolean
  }
  push: {
    botMessages: boolean
    systemUpdates: boolean
    securityAlerts: boolean
    mentions: boolean
  }
  frequency: {
    immediate: boolean
    hourly: boolean
    daily: boolean
  }
}

export function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      botMessages: true,
      systemUpdates: true,
      securityAlerts: true,
      weeklyReports: false,
      marketingEmails: false
    },
    push: {
      botMessages: true,
      systemUpdates: false,
      securityAlerts: true,
      mentions: true
    },
    frequency: {
      immediate: true,
      hourly: false,
      daily: false
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      showSuccess('Notification settings saved successfully!')
      onClose()
    } catch (error) {
      showError('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (category: keyof NotificationSettings, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting as keyof typeof prev[typeof category]]
      }
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
              <p className="text-sm text-gray-500">Manage how you receive notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Email Notifications */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="h-5 w-5 text-gray-600" />
              <h4 className="text-lg font-medium text-gray-900">Email Notifications</h4>
            </div>
            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Bot Messages</p>
                  <p className="text-xs text-gray-500">Receive emails when your bots get new messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.botMessages}
                    onChange={() => handleToggle('email', 'botMessages')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">System Updates</p>
                  <p className="text-xs text-gray-500">Platform updates and new features</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.systemUpdates}
                    onChange={() => handleToggle('email', 'systemUpdates')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Security Alerts</p>
                  <p className="text-xs text-gray-500">Important security notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.securityAlerts}
                    onChange={() => handleToggle('email', 'securityAlerts')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Weekly Reports</p>
                  <p className="text-xs text-gray-500">Weekly summary of bot performance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.weeklyReports}
                    onChange={() => handleToggle('email', 'weeklyReports')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                  <p className="text-xs text-gray-500">Product updates and tips</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.marketingEmails}
                    onChange={() => handleToggle('email', 'marketingEmails')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-5 w-5 text-gray-600" />
              <h4 className="text-lg font-medium text-gray-900">Push Notifications</h4>
            </div>
            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Bot Messages</p>
                  <p className="text-xs text-gray-500">Real-time notifications for new messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.push.botMessages}
                    onChange={() => handleToggle('push', 'botMessages')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">System Updates</p>
                  <p className="text-xs text-gray-500">Platform maintenance and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.push.systemUpdates}
                    onChange={() => handleToggle('push', 'systemUpdates')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Security Alerts</p>
                  <p className="text-xs text-gray-500">Critical security notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.push.securityAlerts}
                    onChange={() => handleToggle('push', 'securityAlerts')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Notification Frequency */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <h4 className="text-lg font-medium text-gray-900">Notification Frequency</h4>
            </div>
            <div className="pl-7">
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="frequency"
                    checked={settings.frequency.immediate}
                    onChange={() => setSettings(prev => ({
                      ...prev,
                      frequency: { immediate: true, hourly: false, daily: false }
                    }))}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Immediate</p>
                    <p className="text-xs text-gray-500">Get notified as soon as something happens</p>
                  </div>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="frequency"
                    checked={settings.frequency.hourly}
                    onChange={() => setSettings(prev => ({
                      ...prev,
                      frequency: { immediate: false, hourly: true, daily: false }
                    }))}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hourly Digest</p>
                    <p className="text-xs text-gray-500">Receive notifications bundled every hour</p>
                  </div>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="frequency"
                    checked={settings.frequency.daily}
                    onChange={() => setSettings(prev => ({
                      ...prev,
                      frequency: { immediate: false, hourly: false, daily: true }
                    }))}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Daily Summary</p>
                    <p className="text-xs text-gray-500">Get a daily summary of all notifications</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
