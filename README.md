# StreamX - Real-time Polling Platform


StreamX is a production-grade real-time polling and survey platform built with Next.js 15, Appwrite Cloud, and modern UI components. Create engaging polls in seconds, share with QR codes, and watch responses flow in live.

### Core Features (MVP)

- ✅ **60-Second Poll Creation** - Create beautiful polls with multiple question typesnpm run dev

- ✅ **QR Code Access** - Instant participant access via QR codes (no apps needed)# or

- ✅ **Real-time Responses** - Live updates using Appwrite Realtimeyarn dev

- ✅ **Live Results Dashboard** - Dynamic visualizations with charts# or

- ✅ **Multiple Question Types** - Multiple choice, Yes/No, Rating scales, Textpnpm dev

- ✅ **Anonymous Participation** - No account required for participants# or

- ✅ **Advanced Analytics** - Comprehensive insights and metricsbun dev

### Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSSOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **Backend**: Appwrite Cloud (Auth, Databases, Storage, Realtime, Functions)

- **UI Components**: shadcn/ui, Framer Motion, RechartsYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

- **Deployment**: Vercel (Frontend)

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 🚀 Quick Start

## Learn More

### Prerequisites

- Node.js 18+ or BunTo learn more about Next.js, take a look at the following resources:

- Appwrite Cloud account ([Create one](https://cloud.appwrite.io))

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

### 1. Clone & Install- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

```bash

git clone <your-repo-url>You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

cd streamx

bun install  # or npm install

```
## Deploy on Vercel
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### 2. Set Up Appwrite Cloud

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

#### Create Project
1. Go to [Appwrite Cloud Console](https://cloud.appwrite.io)
2. Create new project → Note Project ID

#### Configure Auth
1. Navigate to **Auth**
2. Enable: Email/Password, Anonymous, Google, GitHub (OAuth)

#### Create Database & Collections

Create Database named `streamx_db`, then create these collections:

**Users Collection:**
```
Attributes:
- email (string, 255, required)
- name (string, 255, required)
- subscription (string, 50, required, default: 'free')
- createdAt (string, 50, required)
- lastActive (string, 50, required)
```

**Polls Collection:**
```
Attributes:
- creatorId (string, 255, required)
- title (string, 500, required)
- description (string, 2000)
- questions (string, 50000, required)
- settings (string, 5000, required)
- isActive (boolean, required, default: true)
- createdAt (string, 50, required)
- updatedAt (string, 50, required)
- qrCodeUrl (string, 5000)
- shareableLink (string, 500)
- responseCount (integer, default: 0)
- viewCount (integer, default: 0)
```

**Responses Collection:**
```
Attributes:
- pollId (string, 255, required)
- participantId (string, 255, required)
- participantEmail (string, 255)
- participantName (string, 255)
- answers (string, 50000, required)
- submittedAt (string, 50, required)
```

**Sessions Collection:**
```
Attributes:
- pollId (string, 255, required)
- isActive (boolean, required, default: true)
- participantCount (integer, default: 0)
- startedAt (string, 50, required)
```

#### Set Permissions
For each collection, configure permissions:
- **Create**: Users (or Any for responses)
- **Read**: Any
- **Update**: Users
- **Delete**: Users

#### Create Storage Bucket
1. Go to **Storage** → Create Bucket: `poll_assets`
2. Max file size: 5MB
3. Allowed: jpg, jpeg, png, svg

### 3. Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id

NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users_id
NEXT_PUBLIC_APPWRITE_POLLS_COLLECTION_ID=polls_id
NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID=responses_id
NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID=sessions_id
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=bucket_id

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=StreamX
APPWRITE_API_KEY=your_api_key
```

### 4. Run Development
```bash
bun dev  # or npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
streamx/
├── app/                    # Next.js App Router
│   ├── auth/              # Auth pages (login, register)
│   ├── dashboard/         # Dashboard & poll management
│   ├── poll/              # Public poll participation
│   └── page.tsx           # Landing page
├── components/ui/         # shadcn/ui components
├── contexts/              # React contexts (Auth, Realtime)
├── hooks/                 # Custom hooks (usePolls, useResponses)
├── lib/
│   ├── appwrite.ts       # Appwrite config
│   ├── types.ts          # TypeScript types
│   └── services/         # Business logic services
└── docs/                 # Documentation
```

## 🔒 Security Features

- Input validation & sanitization
- CSRF protection (Next.js built-in)
- Rate limiting (Appwrite)
- Permission-based access control
- XSS prevention (React built-in)
- Anonymous sessions (secure)

## 🚀 Deployment

### Deploy to Vercel
1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Post-Deployment
1. Update Appwrite platform URLs with your Vercel domain
2. Configure OAuth redirect URLs
3. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars

## 📝 Usage

**Creating a Poll:**
1. Sign up/Login
2. Click "Create New Poll"
3. Add questions & settings
4. Publish & share QR code

**Participating:**
1. Scan QR code or visit link
2. Answer questions
3. Submit & view results (if enabled)

---

Built with ❤️ using Next.js 15 & Appwrite Cloud
