import { memo, useState, useRef } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Image, Upload, X, Eye, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ImageNode = memo(({ data }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [imageUrl, setImageUrl] = useState(data.imageUrl || '')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const newImageUrl = result.url
        setImageUrl(newImageUrl)
        data.imageUrl = newImageUrl
        data.onChange?.({ imageUrl: newImageUrl })
      } else {
        console.error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlChange = (url: string) => {
    setImageUrl(url)
    data.imageUrl = url
    data.onChange?.({ imageUrl: url })
  }

  const removeImage = () => {
    setImageUrl('')
    data.imageUrl = ''
    data.onChange?.({ imageUrl: '' })
  }

  return (
    <div className="bg-white border-2 border-green-200 rounded-lg shadow-lg p-4 min-w-[250px] max-w-[350px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500" />
      
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <Image className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900">{data.label || 'Send Image'}</div>
          <div className="text-xs text-gray-500">Image Node</div>
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
            <Label className="text-xs font-medium text-gray-700">Image URL</Label>
            <Input
              value={imageUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Enter image URL or upload file..."
              className="mt-1 text-xs"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1" />
              ) : (
                <Upload className="h-3 w-3 mr-1" />
              )}
              Upload
            </Button>
            {imageUrl && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-md p-3">
          {imageUrl ? (
            <div className="space-y-2">
              <div className="relative group">
                <img
                  src={imageUrl}
                  alt="Uploaded image"
                  className="w-full h-32 object-cover rounded-md"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAxMDBMMTAwIDYwTDE0MCAxMDBIMTYwVjE0MEg0MFYxMDBINjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIxMCIgZmlsbD0iIzlCOUJBQCIvPgo8L3N2Zz4K'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-md flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 bg-white text-gray-700 hover:bg-gray-100"
                    onClick={() => window.open(imageUrl, '_blank')}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
              <div className="text-xs text-gray-600 truncate">{imageUrl}</div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Image className="h-6 w-6 text-gray-400" />
              </div>
              <div className="text-xs text-gray-500">No image selected</div>
              <div className="text-xs text-gray-400 mt-1">Click edit to add image</div>
            </div>
          )}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
    </div>
  )
})

ImageNode.displayName = 'ImageNode'

export default ImageNode
