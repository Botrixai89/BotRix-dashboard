import React from 'react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  variant?: 'default' | 'minimal' | 'fullscreen'
  className?: string
}

export function Loading({ 
  size = 'md', 
  text = 'Loading...', 
  variant = 'default',
  className = '' 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-teal-600 rounded-full animate-spin`} />
      </div>
    )
  }

            if (variant === 'fullscreen') {
            return (
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                  {/* Loading dots only */}
                  <div className="flex justify-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  
                  {/* Text */}
                  <p className="text-gray-600 font-medium">{text}</p>
                </div>
              </div>
            )
          }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-teal-600 rounded-full animate-spin`} />
        <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" style={{animationDelay: '0.5s'}} />
      </div>
      {text && (
        <p className={`${textSizes[size]} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  )
}

// Specialized loading components
export function PageLoading() {
  return <Loading variant="fullscreen" text="Loading page..." />
}

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  return <Loading variant="minimal" size={size} className={className} />
}

export function ButtonLoading({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <Loading variant="minimal" size={size} />
}

// Legacy component for backward compatibility
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  return <Spinner size={size} className={className} />
}
