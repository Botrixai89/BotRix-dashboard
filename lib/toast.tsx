import React from 'react'
import toast from 'react-hot-toast'

// Common toast messages
export const toastMessages = {
  // Success messages
  loginSuccess: 'Login successful! Redirecting to dashboard...',
  signupSuccess: 'Account created successfully! Redirecting to dashboard...',
  botCreated: 'Bot created successfully! Redirecting...',
  botUpdated: 'Bot updated successfully!',
  botDeleted: 'Bot deleted successfully!',
  settingsSaved: 'Settings saved successfully!',
  
  // Error messages
  loginFailed: 'Login failed. Please check your credentials.',
  signupFailed: 'Registration failed. Please try again.',
  networkError: 'Network error. Please check your connection and try again.',
  botNotFound: 'Bot not found. Please check the bot configuration.',
  serverError: 'Server error. Our team has been notified.',
  validationError: 'Please check your input and try again.',
  passwordMismatch: 'Passwords do not match!',
  
  // Loading messages
  creatingBot: 'Creating your bot...',
  savingSettings: 'Saving settings...',
  logging: 'Signing you in...',
  registering: 'Creating your account...',
}

// Toast utility functions
export const showSuccess = (message: string) => {
  return toast.success(message, {
    duration: 3000,
  })
}

export const showError = (message: string) => {
  return toast.error(message, {
    duration: 5000,
  })
}

export const showLoading = (message: string) => {
  return toast.loading(message)
}

export const showInfo = (message: string) => {
  return toast(message, {
    icon: '💡',
    duration: 4000,
  })
}

// Promise toast - great for async operations
export const showPromiseToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string
    error: string
  }
) => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  })
}

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss()
}

// Custom toast with action button
export const showActionToast = (
  message: string,
  actionLabel: string,
  action: () => void
) => {
  return toast(
    (t) => (
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          onClick={() => {
            action()
            toast.dismiss(t.id)
          }}
        >
          {actionLabel}
        </button>
      </div>
    ),
    {
      duration: 6000,
    }
  )
}

// Undo toast - useful for destructive actions
export const showUndoToast = (
  message: string,
  undoAction: () => void
) => {
  return showActionToast(message, 'Undo', undoAction)
} 