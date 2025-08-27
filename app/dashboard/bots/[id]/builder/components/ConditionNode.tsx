import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Target, Edit, GitBranch, Code, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

const ConditionNode = memo(({ data }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [condition, setCondition] = useState(data.condition || '')
  const [conditionType, setConditionType] = useState(data.conditionType || 'custom')
  const [description, setDescription] = useState(data.description || '')

  const handleConditionChange = (newCondition: string) => {
    setCondition(newCondition)
    data.condition = newCondition
    data.onChange?.({ condition: newCondition })
  }

  const handleConditionTypeChange = (newType: string) => {
    setConditionType(newType)
    data.conditionType = newType
    data.onChange?.({ conditionType: newType })
  }

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription)
    data.description = newDescription
    data.onChange?.({ description: newDescription })
  }

  const getConditionTypeIcon = (type: string) => {
    switch (type) {
      case 'custom':
        return <Code className="h-3 w-3" />
      case 'contains':
        return <GitBranch className="h-3 w-3" />
      case 'equals':
        return <CheckCircle className="h-3 w-3" />
      case 'regex':
        return <Code className="h-3 w-3" />
      default:
        return <Code className="h-3 w-3" />
    }
  }

  const getConditionTypeLabel = (type: string) => {
    switch (type) {
      case 'custom':
        return 'Custom Logic'
      case 'contains':
        return 'Contains Text'
      case 'equals':
        return 'Exact Match'
      case 'regex':
        return 'Regular Expression'
      default:
        return 'Custom Logic'
    }
  }

  const getConditionPreview = () => {
    if (!condition) return 'No condition set'
    
    switch (conditionType) {
      case 'contains':
        return `Message contains "${condition}"`
      case 'equals':
        return `Message equals "${condition}"`
      case 'regex':
        return `Message matches regex: ${condition}`
      default:
        return condition
    }
  }

  return (
    <div className="bg-white border-2 border-red-200 rounded-lg shadow-lg p-4 min-w-[250px] max-w-[350px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-red-500" />
      
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <Target className="h-4 w-4 text-red-600" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900">{data.label || 'Condition'}</div>
          <div className="text-xs text-gray-500">Condition Node</div>
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
            <Label className="text-xs font-medium text-gray-700">Condition Type</Label>
            <Select value={conditionType} onValueChange={handleConditionTypeChange}>
              <SelectTrigger className="mt-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Logic</SelectItem>
                <SelectItem value="contains">Contains Text</SelectItem>
                <SelectItem value="equals">Exact Match</SelectItem>
                <SelectItem value="regex">Regular Expression</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700">Condition</Label>
            <Textarea
              value={condition}
              onChange={(e) => handleConditionChange(e.target.value)}
              placeholder={
                conditionType === 'custom' ? 'if user.message contains "help"' :
                conditionType === 'contains' ? 'Enter text to check for' :
                conditionType === 'equals' ? 'Enter exact text to match' :
                'Enter regular expression pattern'
              }
              className="mt-1 text-xs min-h-[60px] resize-none"
            />
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700">Description (Optional)</Label>
            <Input
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="What does this condition check for?"
              className="mt-1 text-xs"
            />
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <GitBranch className="h-3 w-3" />
            <span>Will branch based on condition</span>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-md p-3">
          {condition ? (
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GitBranch className="h-3 w-3 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {getConditionPreview()}
                  </div>
                  {description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {description}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    {getConditionTypeIcon(conditionType)}
                    <span>{getConditionTypeLabel(conditionType)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-xs text-red-600">
                  <Target className="h-3 w-3" />
                  <span>Condition</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>True</span>
                </div>
                <div className="flex items-center space-x-1 text-red-600">
                  <XCircle className="h-3 w-3" />
                  <span>False</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Target className="h-6 w-6 text-gray-400" />
              </div>
              <div className="text-xs text-gray-500">No condition configured</div>
              <div className="text-xs text-gray-400 mt-1">Click edit to add condition</div>
            </div>
          )}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-red-500" />
    </div>
  )
})

ConditionNode.displayName = 'ConditionNode'

export default ConditionNode
