#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🚀 BotRix Dashboard Environment Setup\n');
  console.log('This script will help you create a .env.local file with the necessary configuration.\n');

  const envPath = path.join(process.cwd(), '.env.local');
  
  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('\n📝 Please provide the following information:\n');

  // Database Configuration
  const mongodbUri = await question('MongoDB URI (default: mongodb://localhost:27017/botrix-dashboard): ') || 'mongodb://localhost:27017/botrix-dashboard';
  
  // JWT Configuration
  const jwtSecret = await question('JWT Secret (default: your-super-secret-jwt-key-change-in-production): ') || 'your-super-secret-jwt-key-change-in-production';
  
  // NextAuth Configuration
  const nextAuthUrl = await question('NextAuth URL (default: http://localhost:3000): ') || 'http://localhost:3000';
  const nextAuthSecret = await question('NextAuth Secret (default: your-nextauth-secret-key-change-in-production): ') || 'your-nextauth-secret-key-change-in-production';
  
  // Google OAuth Configuration
  console.log('\n🔐 Google OAuth Configuration (Optional but recommended):');
  console.log('To set up Google OAuth:');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create a new project or select existing one');
  console.log('3. Enable Google+ API');
  console.log('4. Create OAuth 2.0 credentials');
  console.log('5. Add http://localhost:3000 to authorized origins');
  console.log('6. Add http://localhost:3000/api/auth/callback/google to redirect URIs\n');
  
  const googleClientId = await question('Google Client ID (optional): ');
  const googleClientSecret = await question('Google Client Secret (optional): ');

  // Build environment content
  let envContent = `# Database Configuration
MONGODB_URI=${mongodbUri}

# JWT Configuration
JWT_SECRET=${jwtSecret}

# NextAuth Configuration
NEXTAUTH_URL=${nextAuthUrl}
NEXTAUTH_SECRET=${nextAuthSecret}

# App Configuration
NODE_ENV=development
`;

  if (googleClientId && googleClientSecret) {
    envContent += `
# Google OAuth Configuration
GOOGLE_CLIENT_ID=${googleClientId}
GOOGLE_CLIENT_SECRET=${googleClientSecret}
`;
  } else {
    envContent += `
# Google OAuth Configuration (Optional)
# GOOGLE_CLIENT_ID=your_google_client_id_here
# GOOGLE_CLIENT_SECRET=your_google_client_secret_here
`;
  }

  // Write to file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env.local file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Start MongoDB (if using local instance)');
    console.log('3. Start the development server: npm run dev');
    console.log('4. Visit http://localhost:3000');
    
    if (!googleClientId || !googleClientSecret) {
      console.log('\n⚠️  Note: Google OAuth is not configured. You can still use email/password authentication.');
      console.log('   To enable Google OAuth later, update the .env.local file with your credentials.');
    }
    
    console.log('\n📖 For more detailed setup instructions, see SETUP.md');
  } catch (error) {
    console.error('\n❌ Error creating .env.local file:', error.message);
  }

  rl.close();
}

setupEnvironment().catch(console.error);
