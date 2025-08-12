# AI LifeBot Style Dropdown Implementation

This document describes the implementation of three dropdown components that replicate the structure and functionality of the AI LifeBot platform.

## Overview

Three main dropdown components have been implemented:

1. **User Profile Dropdown** - Triggered by clicking the user's avatar
2. **Notification Dropdown** - Triggered by clicking the bell icon
3. **Help Dropdown** - Triggered by clicking "Need help?"

## Components

### 1. UserProfileDropdown (`components/UserProfileDropdown.tsx`)

**Features:**
- User information display (name, email, avatar)
- Submit Feedback section with tagline
- Navigation options with icons:
  - Account Settings
  - Admin Mode
  - Integrations
  - Logout
- Footer with Privacy/Terms links

**Props:**
```typescript
interface UserProfileDropdownProps {
  user: {
    name: string
    email: string
  }
  onLogout: () => void
}
```

### 2. NotificationDropdown (`components/NotificationDropdown.tsx`)

**Features:**
- Notification count badge
- Header with pause toggle and settings
- Latest notifications list
- Clear all functionality
- Empty state message
- Unread notification indicators

**Props:**
```typescript
interface NotificationDropdownProps {
  notifications?: Array<{
    id: string
    message: string
    timestamp: string
    read: boolean
  }>
}
```

### 3. HelpDropdown (`components/HelpDropdown.tsx`)

**Features:**
- Multiple help options with icons and descriptions:
  - Send Feedback
  - Help Docs
  - Connect on WhatsApp
  - Ask a Query
  - Report an issue
  - Expert Assistance

**Props:**
```typescript
interface HelpDropdownProps {
  onFeedback?: () => void
  onHelpDocs?: () => void
  onWhatsApp?: () => void
  onQuery?: () => void
  onReportIssue?: () => void
  onExpertAssistance?: () => void
}
```

## Base Components

### DropdownMenu (`components/ui/dropdown-menu.tsx`)

A reusable dropdown menu system with:
- DropdownMenu (container)
- DropdownMenuTrigger (trigger button)
- DropdownMenuContent (dropdown content)
- DropdownMenuItem (menu items)

## Integration

### Dashboard Integration

The dropdowns are integrated into the main dashboard (`app/dashboard/page.tsx`):

```tsx
// Header section
<div className="flex items-center space-x-4">
  <Link href="/dashboard/settings">Switch Account</Link>
  
  <HelpDropdown
    onFeedback={handleFeedback}
    onHelpDocs={handleHelpDocs}
    onWhatsApp={handleWhatsApp}
    onQuery={handleQuery}
    onReportIssue={handleReportIssue}
    onExpertAssistance={handleExpertAssistance}
  />
  
  {user && (
    <div className="flex items-center space-x-2">
      <span>{user.name}</span>
      <NotificationDropdown notifications={sampleNotifications} />
      <UserProfileDropdown user={user} onLogout={handleLogoutClick} />
    </div>
  )}
</div>
```

### Test Page

A test page is available at `/test-dropdowns` to demonstrate all dropdown functionality without authentication.

## Styling

All components use Tailwind CSS with:
- Consistent color scheme (teal primary, gray secondary)
- Proper spacing and typography
- Hover effects and transitions
- Responsive design
- Shadow and border styling matching AI LifeBot

## Functionality

### Common Features
- Click outside to close
- Proper positioning
- Smooth animations
- Accessibility considerations
- Mobile-friendly design

### User Profile Dropdown
- Displays user information
- Handles logout functionality
- Shows feedback section
- Navigation options

### Notification Dropdown
- Shows notification count
- Pause/unpause notifications
- Display notification list
- Clear all functionality

### Help Dropdown
- Multiple help options
- Icon-based navigation
- Descriptive text for each option
- Callback handlers for each action

## Usage Examples

### Basic Usage
```tsx
import { UserProfileDropdown } from '@/components/UserProfileDropdown'

<UserProfileDropdown 
  user={{ name: 'John Doe', email: 'john@example.com' }}
  onLogout={() => console.log('Logging out...')}
/>
```

### With Notifications
```tsx
import { NotificationDropdown } from '@/components/NotificationDropdown'

<NotificationDropdown 
  notifications={[
    {
      id: '1',
      message: 'New message received',
      timestamp: '2 hours ago',
      read: false
    }
  ]}
/>
```

### Help Options
```tsx
import { HelpDropdown } from '@/components/HelpDropdown'

<HelpDropdown
  onFeedback={() => console.log('Feedback clicked')}
  onHelpDocs={() => console.log('Help docs clicked')}
  onWhatsApp={() => console.log('WhatsApp clicked')}
  onQuery={() => console.log('Query clicked')}
  onReportIssue={() => console.log('Report issue clicked')}
  onExpertAssistance={() => console.log('Expert assistance clicked')}
/>
```

## Customization

All components are highly customizable through:
- Props for functionality
- CSS classes for styling
- Icon customization
- Content modification

The structure closely matches the AI LifeBot platform while maintaining flexibility for your specific needs. 