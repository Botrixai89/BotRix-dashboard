'use client'

import { MessageSquare, HelpCircle, Phone, FileText, AlertTriangle, Users } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'

interface HelpDropdownProps {
  onFeedback?: () => void
  onHelpDocs?: () => void
  onWhatsApp?: () => void
  onQuery?: () => void
  onReportIssue?: () => void
  onExpertAssistance?: () => void
}

export function HelpDropdown({
  onFeedback,
  onHelpDocs,
  onWhatsApp,
  onQuery,
  onReportIssue,
  onExpertAssistance
}: HelpDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="text-sm text-gray-600 hover:text-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded px-2 py-1"
      >
        Need help?
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-full max-w-xs sm:w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-0 z-[1000]"
        sideOffset={8}
      >
        <div className="py-2">
          <DropdownMenuItem 
            onClick={onFeedback}
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <MessageSquare className="mr-3 h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium">Send Feedback</div>
              <div className="text-xs text-gray-500">Share your thoughts</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={onHelpDocs}
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <FileText className="mr-3 h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium">Help Docs</div>
              <div className="text-xs text-gray-500">Browse documentation</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={onWhatsApp}
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <Phone className="mr-3 h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium">Connect on WhatsApp</div>
              <div className="text-xs text-gray-500">Chat with support</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={onQuery}
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <HelpCircle className="mr-3 h-4 w-4 text-purple-500" />
            <div>
              <div className="font-medium">Ask a Query</div>
              <div className="text-xs text-gray-500">Get quick answers</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={onReportIssue}
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <AlertTriangle className="mr-3 h-4 w-4 text-orange-500" />
            <div>
              <div className="font-medium">Report an issue</div>
              <div className="text-xs text-gray-500">Report bugs or problems</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={onExpertAssistance}
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <Users className="mr-3 h-4 w-4 text-teal-500" />
            <div>
              <div className="font-medium">Expert Assistance</div>
              <div className="text-xs text-gray-500">Get professional help</div>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 