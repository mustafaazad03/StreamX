#!/usr/bin/env node

/**
 * StreamX Appwrite Setup Script
 * 
 * This script helps you set up the Appwrite collections and configurations.
 * Run with: node scripts/setup-appwrite.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🚀 StreamX - Appwrite Setup Helper\n');
  console.log('This script will help you generate the .env.local file with your Appwrite credentials.\n');

  const endpoint = await question('Appwrite Endpoint (default: https://cloud.appwrite.io/v1): ') || 'https://cloud.appwrite.io/v1';
  const projectId = await question('Appwrite Project ID: ');
  const databaseId = await question('Appwrite Database ID: ');
  const usersCollectionId = await question('Users Collection ID: ');
  const pollsCollectionId = await question('Polls Collection ID: ');
  const responsesCollectionId = await question('Responses Collection ID: ');
  const sessionsCollectionId = await question('Sessions Collection ID: ');
  const bucketId = await question('Storage Bucket ID: ');
  const apiKey = await question('Appwrite API Key (optional, for server-side): ');
  const appUrl = await question('App URL (default: http://localhost:3000): ') || 'http://localhost:3000';

  const envContent = `# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=${endpoint}
NEXT_PUBLIC_APPWRITE_PROJECT_ID=${projectId}

# Appwrite Database IDs
NEXT_PUBLIC_APPWRITE_DATABASE_ID=${databaseId}
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=${usersCollectionId}
NEXT_PUBLIC_APPWRITE_POLLS_COLLECTION_ID=${pollsCollectionId}
NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID=${responsesCollectionId}
NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID=${sessionsCollectionId}

# Appwrite Storage
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=${bucketId}

# App Configuration
NEXT_PUBLIC_APP_URL=${appUrl}
NEXT_PUBLIC_APP_NAME=StreamX

# Server-side Appwrite API Key (for functions)
APPWRITE_API_KEY=${apiKey}
`;

  const envPath = path.join(process.cwd(), '.env.local');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ .env.local file created successfully!\n');
  console.log('📝 Next steps:');
  console.log('   1. Review .env.local file');
  console.log('   2. Make sure all Appwrite collections are created with correct permissions');
  console.log('   3. Run: bun dev (or npm run dev)');
  console.log('   4. Visit: http://localhost:3000\n');

  rl.close();
}

main().catch(console.error);
