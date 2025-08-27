import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { User, Edit, UserCheck, Settings, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const InputNode = memo(({ data }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [prompt, setPrompt] = useState(data.prompt || '')
  const [variable, setVariable] = useState(data.variable || '')
  const [inputType, setInputType] = useState(data.inputType || 'text')

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt)
    data.prompt = newPrompt
    data.onChange?.({ prompt: newPrompt })
  }

  const handleVariableChange = (newVariable: string) => {
    setVariable(newVariable)
    data.variable = newVariable
    data.onChange?.({ variable: newVariable })
  }

  const handleInputTypeChange = (newType: string) => {
    setInputType(newType)
    data.inputType = newType
    data.onChange?.({ inputType: newType })
  }

  const getInputTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <MessageSquare className="h-3 w-3" />
      case 'email':
        return <MessageSquare className="h-3 w-3" />
      case 'phone':
        return <MessageSquare className="h-3 w-3" />
      case 'number':
        return <MessageSquare className="h-3 w-3" />
      default:
        return <MessageSquare className="h-3 w-3" />
    }
  }

  const getInputTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return 'Text Input'
      case 'email':
        return 'Email Input'
      case 'phone':
        return 'Phone Input'
      case 'number':
        return 'Number Input'
      default:
        return 'Text Input'
    }
  }

  return (
    <div className="bg-white border-2 border-purple-200 rounded-lg shadow-lg p-4 min-w-[250px] max-w-[350px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <User className="h-4 w-4 text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900">{data.label || 'Get User Input'}</div>
          <div className="text-xs text-gray-500">Input Node</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-gray-700">Prompt Message</Label>
            <Input
              value={prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="What would you like to ask the user?"
              className="mt-1 text-xs"
            />
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700">Variable Name</Label>
            <Input
              value={variable}
              onChange={(e) => handleVariableChange(e.target.value)}
              placeholder="user_response"
              className="mt-1 text-xs"
            />
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700">Input Type</Label>
            <Select value={inputType} onValueChange={handleInputTypeChange}>
              <SelectTrigger className="mt-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="email">Email Input</SelectItem>
                <SelectItem value="phone">Phone Input</SelectItem>
                <SelectItem value="number">Number Input</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <UserCheck className="h-3 w-3" />
            <span>Will collect user input</span>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-md p-3">
          {prompt ? (
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserCheck className="h-3 w-3 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900 whitespace-pre-wrap line-clamp-2">
                    {prompt}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    {getInputTypeIcon(inputType)}
                    <span>{getInputTypeLabel(inputType)}</span>
                  </div>
                </div>
                
                {variable && (
                  <div className="text-xs text-gray-400">
                    → {variable}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              <div className="text-xs text-gray-500">No prompt configured</div>
              <div className="text-xs text-gray-400 mt-1">Click edit to add prompt</div>
            </div>
          )}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
    </div>
  )
})

InputNode.displayName = 'InputNode'

export default InputNode
