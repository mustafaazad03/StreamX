# Database Migration Guide

## Quick Start

### Prerequisites

1. **Create Database in Appwrite Console**
   - Go to Databases → Create Database
   - Name: `streamx_db`
   - Copy the Database ID

2. **Create API Key**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "StreamX Migration"
   - Select scopes:
     - `databases.read`
     - `databases.write`
     - `collections.read`
     - `collections.write`
     - `attributes.read`
     - `attributes.write`
     - `indexes.read`
     - `indexes.write`
     - `buckets.read`
     - `buckets.write`
   - Copy the API Key (you won't see it again!)

3. **Update .env.local**
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
   APPWRITE_API_KEY=your_api_key
   ```

### Run Migration

```bash
# Run complete migration (database + storage)
npm run migrate

# Or run individually:
npm run migrate:db       # Only database collections
npm run migrate:storage  # Only storage bucket
```

### What Gets Created

#### Collections

1. **users**
   - Stores user account information
   - Subscription tiers
   - Activity tracking

2. **polls**
   - Poll metadata and configuration
   - Questions and settings
   - QR codes and share links

3. **responses**
   - User submissions
   - Anonymous responses supported
   - Timestamped answers

4. **sessions**
   - Active poll sessions
   - Participant counts
   - Session management

#### Storage

- **poll_assets** bucket
  - QR code images
  - Poll attachments
  - Max file size: 5MB
  - Allowed: jpg, jpeg, png, svg, pdf

### After Migration

1. **Copy Collection IDs**
   The migration will output collection IDs. Add them to `.env.local`:
   ```env
   NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
   NEXT_PUBLIC_APPWRITE_POLLS_COLLECTION_ID=polls
   NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID=responses
   NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID=sessions
   NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=poll_assets
   ```

2. **Verify in Appwrite Console**
   - Check all collections exist
   - Verify attributes are created
   - Confirm indexes are active
   - Check permissions are set

3. **Start Development**
   ```bash
   npm run dev
   ```

## Troubleshooting

### "API key not valid"
- Verify API key in .env.local
- Check API key has required scopes
- Ensure key hasn't expired

### "Database not found"
- Create database in Appwrite Console first
- Update NEXT_PUBLIC_APPWRITE_DATABASE_ID

### "Collection already exists"
- Migration will skip existing collections
- If you need to recreate, delete from Console first
- Or use rollback script: `npm run rollback`

### "Attribute creation failed"
- Check attribute doesn't already exist
- Verify size limits are appropriate
- Wait a few seconds between attempts

### Rate Limiting
- The script includes delays to avoid rate limits
- If you get rate limited, wait and retry
- Increase delays in script if needed

## Rollback

To delete all collections and start fresh:

```bash
npm run rollback
```

⚠️ **WARNING**: This deletes ALL data! Type "DELETE ALL" to confirm.

## Manual Verification Checklist

After migration, verify:

- [ ] All 4 collections exist
- [ ] Each collection has all attributes
- [ ] Indexes are created and active
- [ ] Permissions are correctly set
- [ ] Storage bucket exists
- [ ] Storage permissions are correct
- [ ] Environment variables are updated
- [ ] Application starts without errors

## Permissions Summary

### Collections (except responses)
- Read: Any
- Create: Users
- Update: Users
- Delete: Users

### Responses Collection
- Read: Users (creator only)
- Create: Any (allows anonymous)
- Update: Users
- Delete: Users

### Storage Bucket
- Read: Any
- Create: Users
- Update: Users
- Delete: Users

## Collection Schemas

### Users Collection
```
email: string(255) - unique index
name: string(255)
subscription: string(50) - default: 'free'
createdAt: string(50)
lastActive: string(50)
pollsCreated: integer - default: 0
totalParticipants: integer - default: 0
```

### Polls Collection
```
creatorId: string(255) - indexed
title: string(500)
description: string(2000)
questions: string(50000) - JSON
settings: string(5000) - JSON
isActive: boolean - indexed, default: true
createdAt: string(50) - indexed DESC
updatedAt: string(50)
expiresAt: string(50)
qrCodeUrl: string(5000)
shareableLink: string(500)
responseCount: integer - default: 0
viewCount: integer - default: 0
```

### Responses Collection
```
pollId: string(255) - indexed
participantId: string(255) - indexed
participantEmail: string(255)
participantName: string(255)
answers: string(50000) - JSON
submittedAt: string(50) - indexed DESC
ipAddress: string(50)
userAgent: string(500)
```

### Sessions Collection
```
pollId: string(255) - indexed
isActive: boolean - indexed, default: true
participantCount: integer - default: 0
startedAt: string(50) - indexed DESC
endedAt: string(50)
```

## Support

If you encounter issues:
1. Check Appwrite Console logs
2. Review script output for errors
3. Verify all prerequisites are met
4. Check Appwrite status page
5. Consult Appwrite documentation

---

For more information, see the main [SETUP.md](./SETUP.md) guide.
