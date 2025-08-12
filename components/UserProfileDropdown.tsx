'use client'

import { Settings, User, Grid3X3, LogOut } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

interface UserProfileDropdownProps {
  user: {
    name: string
    email: string
  }
  onLogout: () => void
  isLoggingOut?: boolean
}

export function UserProfileDropdown({ user, onLogout, isLoggingOut = false }: UserProfileDropdownProps) {
  const handleLogout = () => {
    onLogout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isLoggingOut}
        className={`w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
          isLoggingOut ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-200'
        }`}
      >
        <span className="text-sm font-medium text-teal-600">
          {isLoggingOut ? (
            <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            user.name?.charAt(0).toUpperCase() || 'U'
          )}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-0 z-[1000]"
        sideOffset={8}
      >
        {/* User Information Section */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-teal-600">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        </div>

        {/* Submit Feedback Section */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="text-sm font-medium text-gray-900 mb-1">Submit Feedback</div>
          <div className="text-xs text-gray-600">YOU have a voice!</div>
        </div>

        {/* Navigation Options */}
        <div className="py-2">
          <DropdownMenuItem className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Settings className="mr-3 h-4 w-4" />
            Account Settings
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
            <User className="mr-3 h-4 w-4" />
            Admin Mode
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Grid3X3 className="mr-3 h-4 w-4" />
            Integrations
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer ${
              isLoggingOut ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
            }`}
          >
            <LogOut className="mr-3 h-4 w-4" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </DropdownMenuItem>
        </div>

        {/* Footer Links */}
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center">
            Privacy • Terms
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 