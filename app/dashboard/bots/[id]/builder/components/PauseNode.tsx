import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Clock, Edit, Pause, Play, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PauseNode = memo(({ data }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [duration, setDuration] = useState(data.duration || 2)
  const [timeUnit, setTimeUnit] = useState(data.timeUnit || 'seconds')
  const [reason, setReason] = useState(data.reason || '')

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration)
    data.duration = newDuration
    data.onChange?.({ duration: newDuration })
  }

  const handleTimeUnitChange = (newUnit: string) => {
    setTimeUnit(newUnit)
    data.timeUnit = newUnit
    data.onChange?.({ timeUnit: newUnit })
  }

  const handleReasonChange = (newReason: string) => {
    setReason(newReason)
    data.reason = newReason
    data.onChange?.({ reason: newReason })
  }

  const formatDuration = (dur: number, unit: string) => {
    if (dur === 1) {
      return `${dur} ${unit.slice(0, -1)}`
    }
    return `${dur} ${unit}`
  }

  const getTotalSeconds = (dur: number, unit: string) => {
    switch (unit) {
      case 'seconds':
        return dur
      case 'minutes':
        return dur * 60
      case 'hours':
        return dur * 3600
      default:
        return dur
    }
  }

  return (
    <div className="bg-white border-2 border-yellow-200 rounded-lg shadow-lg p-4 min-w-[250px] max-w-[350px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-500" />
      
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
          <Clock className="h-4 w-4 text-yellow-600" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900">{data.label || 'Pause'}</div>
          <div className="text-xs text-gray-500">Pause Node</div>
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium text-gray-700">Duration</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                min="1"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">Unit</Label>
              <Select value={timeUnit} onValueChange={handleTimeUnitChange}>
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Seconds</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700">Reason (Optional)</Label>
            <Input
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              placeholder="Why is this pause needed?"
              className="mt-1 text-xs"
            />
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Timer className="h-3 w-3" />
            <span>Will pause for {formatDuration(duration, timeUnit)} ({getTotalSeconds(duration, timeUnit)}s total)</span>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-md p-3">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <Pause className="h-3 w-3 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {formatDuration(duration, timeUnit)}
                </div>
                {reason && (
                  <div className="text-xs text-gray-500 mt-1">
                    {reason}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Timer className="h-3 w-3" />
                <span>{getTotalSeconds(duration, timeUnit)}s total</span>
              </div>
              
              <div className="flex items-center space-x-1 text-xs text-yellow-600">
                <Play className="h-3 w-3" />
                <span>Pause</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-500" />
    </div>
  )
})

PauseNode.displayName = 'PauseNode'

export default PauseNode
