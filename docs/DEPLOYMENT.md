# StreamX - Production Deployment Guide

This guide walks you through deploying StreamX to production using Vercel and Appwrite Cloud.

## 📋 Pre-Deployment Checklist

- [ ] Appwrite project fully configured
- [ ] All collections created with correct permissions
- [ ] Storage bucket configured
- [ ] OAuth providers configured (if using)
- [ ] Local development tested and working
- [ ] Environment variables documented

## 🚀 Deploy to Vercel

### Step 1: Prepare Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - StreamX polling platform"

# Create GitHub repository and push
git remote add origin https://github.com/your-username/streamx.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. **Sign up/Login to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your StreamX repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `next build`
   - Output Directory: `.next`

4. **Add Environment Variables**
   Click "Environment Variables" and add all variables from your `.env.local`:

   ```
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
   NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users_id
   NEXT_PUBLIC_APPWRITE_POLLS_COLLECTION_ID=polls_id
   NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID=responses_id
   NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID=sessions_id
   NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=bucket_id
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_APP_NAME=StreamX
   APPWRITE_API_KEY=your_api_key
   ```

   ⚠️ **Important**: Update `NEXT_PUBLIC_APP_URL` with your Vercel URL

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Get your deployment URL (e.g., `streamx.vercel.app`)

### Step 3: Configure Appwrite for Production

1. **Add Platform in Appwrite**
   - Go to Appwrite Console → Your Project → Settings → Platforms
   - Click "Add Platform" → "Web App"
   - Name: `StreamX Production`
   - Hostname: `your-domain.vercel.app` (your Vercel URL)
   - Click "Create"

2. **Update OAuth Redirect URLs (if using OAuth)**
   
   **For Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to your OAuth Client
   - Add to Authorized redirect URIs:
     ```
     https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/671...
     ```
   - Replace with your actual Appwrite callback URL

   **For GitHub OAuth:**
   - Go to [GitHub OAuth Apps](https://github.com/settings/developers)
   - Edit your OAuth App
   - Update Authorization callback URL:
     ```
     https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/671...
     ```

3. **Configure CORS (if needed)**
   - In Appwrite Console, ensure your Vercel domain is in the platforms list
   - This allows API requests from your production domain

### Step 4: Update DNS (Optional - Custom Domain)

If you want to use a custom domain like `polls.yourdomain.com`:

1. **Add Domain in Vercel**
   - Go to your project → Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Appwrite Platform**
   - Add another platform with your custom domain
   - Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables

3. **Update OAuth Redirects**
   - Update Google/GitHub OAuth apps with new domain

### Step 5: Verify Production Deployment

Test these critical flows:

1. **Landing Page**
   - [ ] Loads without errors
   - [ ] All images and styles load
   - [ ] Navigation works

2. **Authentication**
   - [ ] Sign up works
   - [ ] Login works
   - [ ] OAuth works (Google/GitHub)
   - [ ] Logout works

3. **Poll Creation**
   - [ ] Can create new poll
   - [ ] QR code generates
   - [ ] Share link works

4. **Poll Participation**
   - [ ] Can access poll via link
   - [ ] Can submit responses
   - [ ] Anonymous participation works

5. **Real-time Updates**
   - [ ] Dashboard updates when response submitted
   - [ ] Response count updates
   - [ ] Charts update in real-time

6. **Analytics**
   - [ ] Poll statistics display correctly
   - [ ] Export to CSV works
   - [ ] Charts render properly

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env.local` to git
- ✅ Add `.env.local` to `.gitignore`
- ✅ Rotate API keys periodically
- ✅ Use different Appwrite projects for dev/prod

### 2. Appwrite Configuration
- ✅ Enable rate limiting in Appwrite
- ✅ Set appropriate session duration
- ✅ Configure proper CORS policies
- ✅ Enable 2FA for Appwrite account

### 3. Application Security
- ✅ Input validation on all forms
- ✅ Sanitize user-generated content
- ✅ Implement CSRF protection (Next.js handles this)
- ✅ Use HTTPS only (Vercel provides this)

### 4. Data Privacy
- ✅ Implement GDPR compliance
- ✅ Add privacy policy
- ✅ Allow users to delete their data
- ✅ Encrypt sensitive data

## 📊 Monitoring & Analytics

### 1. Vercel Analytics
```bash
# Enable Vercel Analytics
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 2. Error Tracking with Sentry (Optional)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 3. Uptime Monitoring

Use services like:
- [Uptime Robot](https://uptimerobot.com/)
- [Pingdom](https://www.pingdom.com/)
- [Better Uptime](https://betteruptime.com/)

Set up monitors for:
- Main application (/)
- API health (/api/health)
- Authentication (/auth/login)

## 🚀 Performance Optimization

### 1. Enable Vercel Speed Insights
```bash
npm install @vercel/speed-insights
```

### 2. Optimize Images
- Use Next.js Image component
- Set appropriate sizes
- Enable lazy loading

### 3. Enable Caching
- Configure proper cache headers
- Use SWR for client-side caching
- Implement Redis for server-side caching (if needed)

### 4. Database Optimization
- Create proper indexes in Appwrite
- Limit query results
- Paginate large datasets

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your repository:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically deploys
```

### Branch Previews

Create preview deployments for testing:

```bash
# Create feature branch
git checkout -b feature/new-feature

# Push to GitHub
git push origin feature/new-feature

# Vercel creates preview deployment
```

## 📈 Scaling Considerations

### 1. Appwrite Limits (Free Tier)
- 75,000 requests per day
- 1 GB bandwidth per day
- 2 GB storage

**Upgrade to Pro when needed:**
- More requests
- Higher bandwidth
- Priority support

### 2. Vercel Limits (Hobby Tier)
- 100 GB bandwidth per month
- Unlimited websites
- Automatic SSL

**Upgrade to Pro when needed:**
- More bandwidth
- Team collaboration
- Advanced analytics

### 3. Database Scaling
- Monitor collection sizes
- Archive old data
- Implement data retention policies

## 🆘 Troubleshooting Production Issues

### Issue: 500 Internal Server Error

**Check:**
- Vercel deployment logs
- Environment variables are set correctly
- Appwrite API endpoint is accessible
- All collection IDs are correct

### Issue: OAuth Not Working

**Check:**
- Redirect URLs match in OAuth provider
- Platform is added in Appwrite
- OAuth credentials are correct
- HTTPS is being used

### Issue: Real-time Not Working

**Check:**
- WebSocket connections allowed
- Appwrite realtime endpoint accessible
- Proper permissions on collections
- Browser console for errors

### Issue: QR Codes Not Loading

**Check:**
- Storage bucket configured
- Bucket permissions set correctly
- CORS configured in Appwrite
- Image optimization in Next.js config

## 📚 Post-Deployment Tasks

- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Document deployment process
- [ ] Set up staging environment
- [ ] Configure CI/CD pipeline
- [ ] Add custom domain (if applicable)
- [ ] Set up analytics
- [ ] Test all features in production
- [ ] Create runbook for common issues
- [ ] Set up support channels

## 🎉 Success!

Your StreamX application is now live! Share it with the world:

- Landing Page: `https://your-domain.vercel.app`
- Dashboard: `https://your-domain.vercel.app/dashboard`
- Sample Poll: Create one and share!

## 📞 Support

For deployment issues:
- Check Vercel deployment logs
- Review Appwrite Console logs
- Consult [Vercel Docs](https://vercel.com/docs)
- Visit [Appwrite Discord](https://discord.gg/appwrite)

---

Happy deploying! 🚀
