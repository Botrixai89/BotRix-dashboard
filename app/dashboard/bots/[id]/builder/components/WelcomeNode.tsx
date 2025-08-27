import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MessageCircle, Edit, Sparkles, Copy, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const WelcomeNode = memo(({ data }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState(data.message || '')

  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage)
    data.message = newMessage
    data.onChange?.({ message: newMessage })
  }

  const copyMessage = () => {
    navigator.clipboard.writeText(message)
  }

  const previewMessage = () => {
    alert(`Welcome Message Preview:\n\n${message}`)
  }

  return (
    <div className="bg-white border-2 border-orange-200 rounded-lg shadow-lg p-4 min-w-[250px] max-w-[350px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-500" />
      
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <MessageCircle className="h-4 w-4 text-orange-600" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900">{data.label || 'Welcome Message'}</div>
          <div className="text-xs text-gray-500">Welcome Node</div>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          {message && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={copyMessage}
                title="Copy message"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={previewMessage}
                title="Preview message"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Welcome Message</label>
            <Textarea
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder="Enter your welcome message..."
              className="mt-1 text-xs min-h-[80px] resize-none"
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{message.length} characters</span>
            <div className="flex items-center space-x-1">
              <Sparkles className="h-3 w-3" />
              <span>First message sent</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-md p-3">
          {message ? (
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-3 w-3 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900 whitespace-pre-wrap line-clamp-3">
                    {message}
                  </div>
                  {message.length > 100 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {message.length} characters • Click edit to see full message
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="text-xs text-gray-500">No welcome message</div>
              <div className="text-xs text-gray-400 mt-1">Click edit to add welcome message</div>
            </div>
          )}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500" />
    </div>
  )
})

WelcomeNode.displayName = 'WelcomeNode'

export default WelcomeNode
