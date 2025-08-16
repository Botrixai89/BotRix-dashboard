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
        className={`w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-lg hover:shadow-xl ${
          isLoggingOut ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:from-green-600 hover:to-emerald-700'
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
        className="w-72 bg-white border-0 rounded-xl shadow-2xl p-0 z-[1000] overflow-hidden backdrop-blur-sm animate-in slide-in-from-top-2 duration-200"
        sideOffset={12}
      >
        {/* User Information Section */}
        <div className="relative p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-b border-gray-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full -mr-10 -mt-10" />
          <div className="relative flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
              <span className="text-sm font-bold text-white">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-base truncate">{user.name}</div>
              <div className="text-xs text-gray-600 truncate">{user.email}</div>
              <div className="flex items-center mt-1">
                <div className="flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                  Online
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Feedback Section */}
        <div className="mx-3 my-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg cursor-pointer hover:from-orange-100 hover:to-amber-100 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <MessageSquare className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Submit Feedback</div>
                <div className="text-xs text-orange-600 font-medium">YOU have a voice!</div>
              </div>
            </div>
            <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-orange-600 transition-colors" />
          </div>
        </div>

        {/* Navigation Options */}
        <div className="px-1 py-2">
          <div className="space-y-0.5">
            <DropdownMenuItem className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer group transition-all duration-200 mx-1">
              <div className="flex items-center">
                <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-green-100 transition-colors">
                  <Settings className="h-3.5 w-3.5 text-gray-600 group-hover:text-green-600" />
                </div>
                <span className="font-medium text-sm">Account Settings</span>
              </div>
              <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </DropdownMenuItem>
            
            <DropdownMenuItem className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer group transition-all duration-200 mx-1">
              <div className="flex items-center">
                <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-emerald-100 transition-colors">
                  <Crown className="h-3.5 w-3.5 text-gray-600 group-hover:text-emerald-600" />
                </div>
                <span className="font-medium text-sm">Admin Mode</span>
              </div>
              <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </DropdownMenuItem>
            
            <DropdownMenuItem className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer group transition-all duration-200 mx-1">
              <div className="flex items-center">
                <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-green-100 transition-colors">
                  <Grid3X3 className="h-3.5 w-3.5 text-gray-600 group-hover:text-green-600" />
                </div>
                <span className="font-medium text-sm">Integrations</span>
              </div>
              <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </DropdownMenuItem>
          </div>
          
          <DropdownMenuSeparator className="my-2" />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer group transition-all duration-200 mx-1 ${
              isLoggingOut 
                ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2 transition-colors ${
                isLoggingOut 
                  ? 'bg-gray-100' 
                  : 'bg-red-100 group-hover:bg-red-200'
              }`}>
                <LogOut className={`h-3.5 w-3.5 ${
                  isLoggingOut ? 'text-gray-400' : 'text-red-600'
                }`} />
              </div>
              <span className="font-medium text-sm">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </div>
            {isLoggingOut && (
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            )}
          </DropdownMenuItem>
        </div>

        {/* Footer Links */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-3 text-xs text-gray-500">
            <button className="hover:text-gray-700 transition-colors flex items-center space-x-1">
              <Shield className="h-2.5 w-2.5" />
              <span>Privacy</span>
            </button>
            <div className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
            <button className="hover:text-gray-700 transition-colors flex items-center space-x-1">
              <ExternalLink className="h-2.5 w-2.5" />
              <span>Terms</span>
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 