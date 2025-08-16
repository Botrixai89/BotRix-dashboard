'use client'

import { Settings, User, Grid3X3, LogOut, Crown, MessageSquare, ChevronRight, Star, Shield, ExternalLink } from 'lucide-react'
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
        className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl ${
          isLoggingOut ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:from-blue-600 hover:to-purple-700'
        }`}
      >
        <span className="text-sm font-bold text-white">
          {isLoggingOut ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            user.name?.charAt(0).toUpperCase() || 'U'
          )}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-full max-w-xs sm:w-80 bg-white border-0 rounded-2xl shadow-2xl p-0 z-[1000] overflow-hidden backdrop-blur-sm animate-in slide-in-from-top-2 duration-200"
        sideOffset={12}
      >
        {/* User Information Section */}
        <div className="relative p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border-b border-gray-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full -mr-16 -mt-16" />
          <div className="relative flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white">
              <span className="text-xl font-bold text-white">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-lg truncate">{user.name}</div>
              <div className="text-sm text-gray-600 truncate">{user.email}</div>
              <div className="flex items-center mt-1">
                <div className="flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                  Online
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Feedback Section */}
        <div className="mx-4 my-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl cursor-pointer hover:from-orange-100 hover:to-amber-100 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <MessageSquare className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Submit Feedback</div>
                <div className="text-xs text-orange-600 font-medium">YOU have a voice!</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
          </div>
        </div>

        {/* Navigation Options */}
        <div className="px-2 py-3">
          <div className="space-y-1">
            <DropdownMenuItem className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer group transition-all duration-200 mx-2">
              <div className="flex items-center">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
                  <Settings className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                </div>
                <span className="font-medium">Account Settings</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </DropdownMenuItem>
            
            <DropdownMenuItem className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer group transition-all duration-200 mx-2">
              <div className="flex items-center">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-100 transition-colors">
                  <Crown className="h-4 w-4 text-gray-600 group-hover:text-purple-600" />
                </div>
                <span className="font-medium">Admin Mode</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </DropdownMenuItem>
            
            <DropdownMenuItem className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer group transition-all duration-200 mx-2">
              <div className="flex items-center">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-100 transition-colors">
                  <Grid3X3 className="h-4 w-4 text-gray-600 group-hover:text-green-600" />
                </div>
                <span className="font-medium">Integrations</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </DropdownMenuItem>
          </div>
          
          <DropdownMenuSeparator className="my-3" />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center justify-between px-4 py-3 text-sm rounded-lg cursor-pointer group transition-all duration-200 mx-2 ${
              isLoggingOut 
                ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 transition-colors ${
                isLoggingOut 
                  ? 'bg-gray-100' 
                  : 'bg-red-100 group-hover:bg-red-200'
              }`}>
                <LogOut className={`h-4 w-4 ${
                  isLoggingOut ? 'text-gray-400' : 'text-red-600'
                }`} />
              </div>
              <span className="font-medium">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </div>
            {isLoggingOut && (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            )}
          </DropdownMenuItem>
        </div>

        {/* Footer Links */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <button className="hover:text-gray-700 transition-colors flex items-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>Privacy</span>
            </button>
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <button className="hover:text-gray-700 transition-colors flex items-center space-x-1">
              <ExternalLink className="h-3 w-3" />
              <span>Terms</span>
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 