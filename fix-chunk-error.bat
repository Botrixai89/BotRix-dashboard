@echo off
echo Clearing Next.js cache...
if exist .next rmdir /s /q .next
echo Cache cleared!

echo Installing dependencies...
npm install

echo Starting development server...
npm run dev
