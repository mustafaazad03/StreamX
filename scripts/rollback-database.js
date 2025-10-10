#!/usr/bin/env node

/**
 * Appwrite Database Rollback Script
 * 
 * This script deletes all collections created by the migration.
 * Use with caution - this will delete all data!
 * 
 * Usage:
 *   node scripts/rollback-database.js
 */

const { Client, Databases } = require('node-appwrite');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const client = new Client();
const databases = new Databases(client);

// Configure client
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deleteCollection(collectionId, name) {
  try {
    console.log(`🗑️  Deleting collection: ${name} (${collectionId})`);
    await databases.deleteCollection(DATABASE_ID, collectionId);
    console.log(`   ✅ Deleted: ${name}`);
  } catch (error) {
    if (error.code === 404) {
      console.log(`   ⚠️  Collection not found: ${name}`);
    } else {
      console.error(`   ❌ Error deleting ${name}:`, error.message);
    }
  }
}

async function rollback() {
  console.log('\n⚠️  StreamX Database Rollback\n');
  console.log('================================\n');
  console.log('⚠️  WARNING: This will delete ALL collections and their data!');
  console.log('⚠️  This action CANNOT be undone!\n');
  
  const confirmation = await question('Type "DELETE ALL" to confirm: ');
  
  if (confirmation !== 'DELETE ALL') {
    console.log('\n❌ Rollback cancelled.');
    rl.close();
    process.exit(0);
  }
  
  console.log('\n🚀 Starting rollback...\n');
  
  try {
    const collectionIds = {
      users: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'users',
      polls: process.env.NEXT_PUBLIC_APPWRITE_POLLS_COLLECTION_ID || 'polls',
      responses: process.env.NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID || 'responses',
      sessions: process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID || 'sessions',
    };
    
    for (const [name, id] of Object.entries(collectionIds)) {
      await deleteCollection(id, name);
    }
    
    console.log('\n✅ Rollback completed successfully!');
    console.log('\nYou can now run the migration again if needed:');
    console.log('   node scripts/migrate-database.js\n');
    
  } catch (error) {
    console.error('\n❌ Rollback failed:', error.message);
    process.exit(1);
  }
  
  rl.close();
}

// Run rollback
rollback();
