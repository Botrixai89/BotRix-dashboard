'use client'

import { UserProfileDropdown } from '@/components/UserProfileDropdown'
import { NotificationDropdown } from '@/components/NotificationDropdown'
import { HelpDropdown } from '@/components/HelpDropdown'
import { showSuccess } from '@/lib/toast'

export default function TestDropdownsPage() {
  // Sample user data
  const sampleUser = {
    name: 'John Doe',
    email: 'john@example.com'
  }

  // Sample notifications
  const sampleNotifications = [
    {
      id: '1',
      message: 'Your bot "Customer Support Bot" has received 15 new messages',
      timestamp: '2 hours ago',
      read: false
    },
    {
      id: '2',
      message: 'Bot performance report is ready for review',
      timestamp: '1 day ago',
      read: true
    },
    {
      id: '3',
      message: 'New feature: Voice integration is now available',
      timestamp: '3 days ago',
      read: true
    }
  ]

  // Help dropdown handlers
  const handleFeedback = () => {
    showSuccess('Feedback form will open in a new window')
  }

  const handleHelpDocs = () => {
    showSuccess('Opening help documentation')
  }

  const handleWhatsApp = () => {
    showSuccess('Connecting to WhatsApp support')
  }

  const handleQuery = () => {
    showSuccess('Opening query form')
  }

  const handleReportIssue = () => {
    showSuccess('Opening issue report form')
  }

  const handleExpertAssistance = () => {
    showSuccess('Connecting to expert support')
  }

  const handleLogout = () => {
    showSuccess('Logging out...')
  }

  // User profile dropdown handlers
  const handleUserFeedback = () => {
    showSuccess('Opening feedback form')
  }

  const handleAccountSettings = () => {
    showSuccess('Opening account settings')
  }

  const handleAdminMode = () => {
    showSuccess('Switching to admin mode')
  }

  const handleIntegrations = () => {
    showSuccess('Opening integrations panel')
  }

  const handlePrivacy = () => {
    showSuccess('Opening privacy policy')
  }

  const handleTerms = () => {
    showSuccess('Opening terms of service')
  }

  // Notification dropdown handlers
  const handleNotificationSettings = () => {
    showSuccess('Opening notification settings')
  }

  const handleClearAllNotifications = () => {
    showSuccess('All notifications cleared')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dropdown Components Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">AI LifeBot Style Dropdowns</h2>
          
          <div className="flex items-center justify-center space-x-8">
            {/* Help Dropdown */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Help Dropdown</h3>
              <HelpDropdown
                onFeedback={handleFeedback}
                onHelpDocs={handleHelpDocs}
                onWhatsApp={handleWhatsApp}
                onQuery={handleQuery}
                onReportIssue={handleReportIssue}
                onExpertAssistance={handleExpertAssistance}
              />
            </div>

            {/* Notification Dropdown */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notification Dropdown</h3>
              <NotificationDropdown 
                notifications={sampleNotifications}
                onSettings={handleNotificationSettings}
                onClearAll={handleClearAllNotifications}
              />
            </div>

            {/* User Profile Dropdown */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-2">User Profile Dropdown</h3>
              <UserProfileDropdown 
                user={sampleUser} 
                onLogout={handleLogout}
                onFeedback={handleUserFeedback}
                onAccountSettings={handleAccountSettings}
                onAdminMode={handleAdminMode}
                onIntegrations={handleIntegrations}
                onPrivacy={handlePrivacy}
                onTerms={handleTerms}
              />
            </div>
          </div>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features Implemented:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ <strong>User Profile Dropdown:</strong> Shows user info, feedback section, and navigation options</li>
              <li>✅ <strong>Notification Dropdown:</strong> Displays notifications with pause toggle and settings</li>
              <li>✅ <strong>Help Dropdown:</strong> Provides various help options with icons and descriptions</li>
              <li>✅ <strong>Click Outside to Close:</strong> All dropdowns close when clicking outside</li>
              <li>✅ <strong>Responsive Design:</strong> Dropdowns are properly positioned and styled</li>
              <li>✅ <strong>Hover Effects:</strong> Smooth transitions and hover states</li>
            </ul>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Instructions:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Click on "Need help?" to see the help dropdown with various support options</li>
              <li>• Click on the bell icon to see the notification dropdown with toggle and settings</li>
              <li>• Click on the user avatar (J) to see the user profile dropdown with account options</li>
              <li>• All dropdowns will show success messages when options are clicked</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 