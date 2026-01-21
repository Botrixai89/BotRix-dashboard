# Fixing ChunkLoadError in BotRix Dashboard

## Problem
You're experiencing a `ChunkLoadError: Loading chunk app/layout failed` error when running the Next.js development server.

## Root Cause
This error typically occurs due to:
1. Corrupted Next.js build cache
2. Naming conflicts in component imports
3. Network issues in development mode
4. Circular dependencies

## Solutions Applied

### 1. Fixed Naming Conflicts ✅
- Renamed conflicting `AuthProvider` imports in `app/layout.tsx`
- Changed `AuthProvider` from `@/lib/auth-context` to `CustomAuthProvider`

### 2. Enhanced Next.js Configuration ✅
- Added webpack configuration to handle chunk loading timeouts
- Improved development server stability

### 3. Created Fix Scripts ✅
- `fix-chunk-error.ps1` - PowerShell script for Windows
- `fix-chunk-error.bat` - Batch script for Windows

## How to Fix

### Option 1: Use the PowerShell Script (Recommended)
```powershell
.\fix-chunk-error.ps1
```

### Option 2: Manual Steps
1. **Stop the development server** (Ctrl+C)
2. **Clear the Next.js cache:**
   ```powershell
   Remove-Item -Recurse -Force .next
   ```
3. **Reinstall dependencies:**
   ```powershell
   npm install
   ```
4. **Start the development server:**
   ```powershell
   npm run dev
   ```

### Option 3: Use the Clean Development Script
```powershell
npm run dev:clean
```

## Prevention
- Always stop the development server properly (Ctrl+C)
- Clear cache when switching between branches
- Keep Next.js and dependencies updated

## If the Problem Persists
1. Clear `node_modules` and reinstall:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```
2. Check for any TypeScript errors:
   ```powershell
   npm run lint
   ```
3. Try building the project:
   ```powershell
   npm run build
   ```

## Files Modified
- `app/layout.tsx` - Fixed naming conflicts
- `next.config.js` - Added webpack configuration
- `package.json` - Added clean development script
- `fix-chunk-error.ps1` - Created fix script
- `fix-chunk-error.bat` - Created alternative fix script
