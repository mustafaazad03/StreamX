# StreamX - Complete Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** or **Bun** installed
- **Git** for version control
- **Appwrite Cloud** account (free tier available)
- Basic understanding of React/Next.js

## 🚀 Step-by-Step Setup

### Step 1: Create Appwrite Project

1. **Sign up for Appwrite Cloud**
   - Visit [https://cloud.appwrite.io](https://cloud.appwrite.io)
   - Create a free account
   - Verify your email

2. **Create New Project**
   - Click "Create Project"
   - Name: `StreamX` (or your preferred name)
   - Click "Create"
   - **Save your Project ID** - you'll need this later

### Step 2: Configure Authentication

1. Navigate to **Auth** section in your Appwrite project

2. **Enable Email/Password Authentication**
   - Go to "Settings" tab
   - Enable "Email/Password"
   - Set password length minimum: 8

3. **Enable Anonymous Sessions**
   - Enable "Anonymous" in Auth settings
   - This allows poll participants to respond without creating accounts

4. **Configure OAuth (Optional but Recommended)**
   - Enable "Google" provider
     - Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
     - Add OAuth Client ID and Secret
   - Enable "GitHub" provider
     - Get credentials from [GitHub OAuth Apps](https://github.com/settings/developers)
     - Add Client ID and Secret

### Step 3: Create Database

1. Navigate to **Databases** section
2. Click "Create Database"
3. Name: `streamx_db`
4. Click "Create"
5. **Save the Database ID**

### Step 4: Create Collections

#### Collection 1: Users

1. Click "Create Collection"
2. Name: `users`
3. **Save Collection ID**

**Add Attributes:**
```
- email: String, Size: 255, Required
- name: String, Size: 255, Required
- subscription: String, Size: 50, Required, Default: 'free'
- createdAt: String, Size: 50, Required
- lastActive: String, Size: 50, Required
- pollsCreated: Integer, Default: 0
- totalParticipants: Integer, Default: 0
```

**Create Index:**
- Key: `email`
- Type: Unique
- Attributes: email

**Set Permissions:**
- Create: `Users`
- Read: `Users`
- Update: `Users`
- Delete: `Users`

#### Collection 2: Polls

1. Click "Create Collection"
2. Name: `polls`
3. **Save Collection ID**

**Add Attributes:**
```
- creatorId: String, Size: 255, Required
- title: String, Size: 500, Required
- description: String, Size: 2000
- questions: String, Size: 50000, Required
- settings: String, Size: 5000, Required
- isActive: Boolean, Required, Default: true
- createdAt: String, Size: 50, Required
- updatedAt: String, Size: 50, Required
- expiresAt: String, Size: 50
- qrCodeUrl: String, Size: 5000
- shareableLink: String, Size: 500
- responseCount: Integer, Default: 0
- viewCount: Integer, Default: 0
```

**Create Indexes:**
1. Key: `creatorId`, Type: Key, Attributes: creatorId
2. Key: `isActive`, Type: Key, Attributes: isActive
3. Key: `createdAt_desc`, Type: Key, Attributes: createdAt (Order: DESC)

**Set Permissions:**
- Create: `Users`
- Read: `Any`
- Update: `Users`
- Delete: `Users`

#### Collection 3: Responses

1. Click "Create Collection"
2. Name: `responses`
3. **Save Collection ID**

**Add Attributes:**
```
- pollId: String, Size: 255, Required
- participantId: String, Size: 255, Required
- participantEmail: String, Size: 255
- participantName: String, Size: 255
- answers: String, Size: 50000, Required
- submittedAt: String, Size: 50, Required
- ipAddress: String, Size: 50
- userAgent: String, Size: 500
```

**Create Indexes:**
1. Key: `pollId`, Type: Key, Attributes: pollId
2. Key: `participantId`, Type: Key, Attributes: participantId
3. Key: `submittedAt_desc`, Type: Key, Attributes: submittedAt (Order: DESC)

**Set Permissions:**
- Create: `Any`
- Read: `Users`
- Update: `None`
- Delete: `Users`

#### Collection 4: Sessions

1. Click "Create Collection"
2. Name: `sessions`
3. **Save Collection ID**

**Add Attributes:**
```
- pollId: String, Size: 255, Required
- isActive: Boolean, Required, Default: true
- participantCount: Integer, Default: 0
- startedAt: String, Size: 50, Required
- endedAt: String, Size: 50
```

**Create Indexes:**
1. Key: `pollId`, Type: Key, Attributes: pollId
2. Key: `isActive`, Type: Key, Attributes: isActive
3. Key: `startedAt_desc`, Type: Key, Attributes: startedAt (Order: DESC)

**Set Permissions:**
- Create: `Users`
- Read: `Any`
- Update: `Users`
- Delete: `Users`

### Step 5: Create Storage Bucket

1. Navigate to **Storage** section
2. Click "Create Bucket"
3. Name: `poll_assets`
4. **Save Bucket ID**

**Configure Bucket:**
- Maximum File Size: 5 MB (5242880 bytes)
- Allowed File Extensions: `jpg, jpeg, png, svg, pdf`
- Encryption: Enabled
- Antivirus: Enabled (if available)

**Set Permissions:**
- Create: `Users`
- Read: `Any`
- Update: `Users`
- Delete: `Users`

### Step 6: Configure Platform

1. Navigate to **Settings** > **Platforms**
2. Click "Add Platform"
3. Select "Web App"
4. Name: `StreamX Web`
5. Hostname: `localhost` (for development)
6. Click "Create"

**For Production:**
- Add another platform with your Vercel domain (e.g., `streamx.vercel.app`)

### Step 7: Get API Key (Optional - for server-side functions)

1. Navigate to **Settings** > **API Keys**
2. Click "Create API Key"
3. Name: `StreamX Server`
4. Scopes: Select all required scopes
5. **Save the API Key securely** - it won't be shown again

### Step 8: Clone and Configure Project

```bash
# Clone the repository
git clone <your-repo-url>
cd streamx

# Install dependencies
bun install
# or
npm install

# Copy environment file
cp .env.example .env.local
```

### Step 9: Configure Environment Variables

Edit `.env.local` and fill in all the IDs you saved:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here

NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users_collection_id
NEXT_PUBLIC_APPWRITE_POLLS_COLLECTION_ID=polls_collection_id
NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID=responses_collection_id
NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID=sessions_collection_id

NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_bucket_id_here

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=StreamX

APPWRITE_API_KEY=your_api_key_here
```

**Alternative: Use Setup Script**
```bash
node scripts/setup-appwrite.js
```
Follow the prompts to generate `.env.local`

### Step 10: Start Development Server

```bash
bun dev
# or
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## ✅ Verify Setup

1. **Test Landing Page**: Should load without errors
2. **Test Registration**: Create a new account
3. **Test Login**: Log in with your account
4. **Test Poll Creation**: Create a test poll
5. **Test Poll Participation**: Access poll via QR code/link
6. **Test Real-time**: Submit response and watch dashboard update

## 🔧 Troubleshooting

### Issue: "Invalid Credentials" Error

**Solution:**
- Verify Project ID in `.env.local`
- Check if Email/Password auth is enabled in Appwrite
- Clear browser cache and cookies

### Issue: "Collection Not Found"

**Solution:**
- Verify all Collection IDs in `.env.local`
- Ensure collections are created in the correct database
- Check collection names match exactly

### Issue: "Permission Denied"

**Solution:**
- Review collection permissions in Appwrite Console
- Ensure `Any` permission is set for reading polls
- Verify user is authenticated for protected routes

### Issue: QR Code Not Generating

**Solution:**
- Check if `qrcode` package is installed
- Verify Storage bucket is configured
- Check browser console for errors

### Issue: Real-time Not Working

**Solution:**
- Verify Appwrite endpoint includes `/v1`
- Check browser console for WebSocket errors
- Ensure collections have proper read permissions

## 🚀 Next Steps

1. **Customize Branding**: Edit colors in `tailwind.config.ts`
2. **Add Custom Domain**: Configure in Vercel and Appwrite
3. **Enable Analytics**: Integrate your preferred analytics tool
4. **Set Up Monitoring**: Use Sentry or similar for error tracking
5. **Configure Email**: Set up SMTP in Appwrite for email notifications

## 📚 Additional Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## 🆘 Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review Appwrite Console logs
3. Check browser console for errors
4. Create an issue on GitHub
5. Join the Appwrite Discord community

---

Happy polling! 🎉
