#!/usr/bin/env node

/**
 * Appwrite Database Migration Script
 * 
 * This script creates all necessary collections for StreamX with proper
 * attributes, indexes, and permissions.
 * 
 * Prerequisites:
 * 1. Create a database in Appwrite Console
 * 2. Get your Database ID
 * 3. Create an API Key with proper permissions
 * 4. Set environment variables in .env.local
 * 
 * Usage:
 *   node scripts/migrate-database.js
 */

const { Client, Databases, Permission, Role } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client();
const databases = new Databases(client);

// Configure client
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

// Collection schemas
const collections = {
  users: {
    name: 'users',
    attributes: [
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'subscription', type: 'string', size: 50, required: true, default: 'free' },
      { key: 'createdAt', type: 'string', size: 50, required: true },
      { key: 'lastActive', type: 'string', size: 50, required: true },
      { key: 'pollsCreated', type: 'integer', required: false, default: 0 },
      { key: 'totalParticipants', type: 'integer', required: false, default: 0 },
    ],
    indexes: [
      { key: 'email_unique', type: 'unique', attributes: ['email'] },
      { key: 'subscription_key', type: 'key', attributes: ['subscription'] },
    ],
  },
  polls: {
    name: 'polls',
    attributes: [
      { key: 'creatorId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 500, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'questions', type: 'string', size: 50000, required: true },
      { key: 'settings', type: 'string', size: 5000, required: true },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'createdAt', type: 'string', size: 50, required: true },
      { key: 'updatedAt', type: 'string', size: 50, required: true },
      { key: 'expiresAt', type: 'string', size: 50, required: false },
      { key: 'qrCodeUrl', type: 'string', size: 5000, required: false },
      { key: 'shareableLink', type: 'string', size: 500, required: false },
      { key: 'responseCount', type: 'integer', required: false, default: 0 },
      { key: 'viewCount', type: 'integer', required: false, default: 0 },
    ],
    indexes: [
      { key: 'creatorId_key', type: 'key', attributes: ['creatorId'] },
      { key: 'isActive_key', type: 'key', attributes: ['isActive'] },
      { key: 'createdAt_desc', type: 'key', attributes: ['createdAt'], orders: ['DESC'] },
    ],
  },
  responses: {
    name: 'responses',
    attributes: [
      { key: 'pollId', type: 'string', size: 255, required: true },
      { key: 'participantId', type: 'string', size: 255, required: true },
      { key: 'participantEmail', type: 'string', size: 255, required: false },
      { key: 'participantName', type: 'string', size: 255, required: false },
      { key: 'answers', type: 'string', size: 50000, required: true },
      { key: 'submittedAt', type: 'string', size: 50, required: true },
      { key: 'ipAddress', type: 'string', size: 50, required: false },
      { key: 'userAgent', type: 'string', size: 500, required: false },
    ],
    indexes: [
      { key: 'pollId_key', type: 'key', attributes: ['pollId'] },
      { key: 'participantId_key', type: 'key', attributes: ['participantId'] },
      { key: 'submittedAt_desc', type: 'key', attributes: ['submittedAt'], orders: ['DESC'] },
    ],
  },
  sessions: {
    name: 'sessions',
    attributes: [
      { key: 'pollId', type: 'string', size: 255, required: true },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'participantCount', type: 'integer', required: false, default: 0 },
      { key: 'startedAt', type: 'string', size: 50, required: true },
      { key: 'endedAt', type: 'string', size: 50, required: false },
    ],
    indexes: [
      { key: 'pollId_key', type: 'key', attributes: ['pollId'] },
      { key: 'isActive_key', type: 'key', attributes: ['isActive'] },
      { key: 'startedAt_desc', type: 'key', attributes: ['startedAt'], orders: ['DESC'] },
    ],
  },
};

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createCollection(collectionId, schema) {
  try {
    console.log(`\n📦 Creating collection: ${schema.name}`);
    
    const collection = await databases.createCollection(
      DATABASE_ID,
      collectionId,
      schema.name,
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    
    console.log(`   ✅ Collection created: ${collection.$id}`);
    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log(`   ⚠️  Collection already exists: ${schema.name}`);
      return null;
    }
    throw error;
  }
}

async function createAttributes(collectionId, attributes) {
  console.log(`\n📝 Creating attributes for collection: ${collectionId}`);
  
  for (const attr of attributes) {
    try {
      await wait(1000); // Wait to avoid rate limiting
      
      let attribute;
      if (attr.type === 'string') {
        attribute = await databases.createStringAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.size,
          attr.required,
          attr.default,
          false // array
        );
      } else if (attr.type === 'integer') {
        attribute = await databases.createIntegerAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required,
          undefined, // min
          undefined, // max
          attr.default,
          false // array
        );
      } else if (attr.type === 'boolean') {
        attribute = await databases.createBooleanAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required,
          attr.default,
          false // array
        );
      }
      
      console.log(`   ✅ Created attribute: ${attr.key} (${attr.type})`);
    } catch (error) {
      if (error.code === 409) {
        console.log(`   ⚠️  Attribute already exists: ${attr.key}`);
      } else {
        console.error(`   ❌ Error creating attribute ${attr.key}:`, error.message);
      }
    }
  }
  
  // Wait for attributes to be available
  console.log('   ⏳ Waiting for attributes to be ready...');
  await wait(5000);
}

async function createIndexes(collectionId, indexes) {
  console.log(`\n📊 Creating indexes for collection: ${collectionId}`);
  
  for (const idx of indexes) {
    try {
      await wait(1000); // Wait to avoid rate limiting
      
      const index = await databases.createIndex(
        DATABASE_ID,
        collectionId,
        idx.key,
        idx.type,
        idx.attributes,
        idx.orders || []
      );
      
      console.log(`   ✅ Created index: ${idx.key} (${idx.type})`);
    } catch (error) {
      if (error.code === 409) {
        console.log(`   ⚠️  Index already exists: ${idx.key}`);
      } else {
        console.error(`   ❌ Error creating index ${idx.key}:`, error.message);
      }
    }
  }
}

async function updateCollectionPermissions(collectionId, collectionName) {
  console.log(`\n🔒 Updating permissions for: ${collectionName}`);
  
  try {
    let permissions = [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ];
    
    // Special permissions for responses collection - allow any to create
    if (collectionName === 'responses') {
      permissions = [
        Permission.read(Role.users()),
        Permission.create(Role.any()), // Allow anonymous responses
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ];
    }
    
    await databases.updateCollection(
      DATABASE_ID,
      collectionId,
      collectionName,
      permissions,
      false, // documentSecurity
      true   // enabled
    );
    
    console.log(`   ✅ Permissions updated`);
  } catch (error) {
    console.error(`   ❌ Error updating permissions:`, error.message);
  }
}

async function migrate() {
  console.log('\n🚀 StreamX Database Migration\n');
  console.log('================================\n');
  
  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
    console.error('❌ Error: NEXT_PUBLIC_APPWRITE_PROJECT_ID not set in .env.local');
    process.exit(1);
  }
  
  if (!process.env.APPWRITE_API_KEY) {
    console.error('❌ Error: APPWRITE_API_KEY not set in .env.local');
    console.error('   Please create an API key in Appwrite Console with proper permissions');
    process.exit(1);
  }
  
  if (!DATABASE_ID) {
    console.error('❌ Error: NEXT_PUBLIC_APPWRITE_DATABASE_ID not set in .env.local');
    console.error('   Please create a database in Appwrite Console first');
    process.exit(1);
  }
  
  console.log(`📍 Database ID: ${DATABASE_ID}`);
  console.log(`📍 Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}\n`);
  
  try {
    // Get collection IDs from env or use defaults
    const collectionIds = {
      users: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'users',
      polls: process.env.NEXT_PUBLIC_APPWRITE_POLLS_COLLECTION_ID || 'polls',
      responses: process.env.NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID || 'responses',
      sessions: process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID || 'sessions',
    };
    
    // Create collections
    for (const [key, collectionId] of Object.entries(collectionIds)) {
      const schema = collections[key];
      
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Processing: ${schema.name.toUpperCase()}`);
      console.log('='.repeat(50));
      
      // Create collection
      await createCollection(collectionId, schema);
      
      // Create attributes
      await createAttributes(collectionId, schema.attributes);
      
      // Create indexes
      if (schema.indexes && schema.indexes.length > 0) {
        await createIndexes(collectionId, schema.indexes);
      }
      
      // Update permissions
      await updateCollectionPermissions(collectionId, schema.name);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Migration completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📝 Next steps:');
    console.log('   1. Update your .env.local with collection IDs if using custom IDs');
    console.log('   2. Verify collections in Appwrite Console');
    console.log('   3. Test your application: npm run dev');
    console.log('\n✅ Collection IDs:');
    for (const [key, id] of Object.entries(collectionIds)) {
      console.log(`   - ${key}: ${id}`);
    }
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
