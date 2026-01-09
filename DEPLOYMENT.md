# Deployment Guide

This guide provides step-by-step instructions for deploying the LazorKit Demo to various platforms. All platforms provide automatic HTTPS, which is required for LazorKit transactions.

## 🚀 Quick Deploy Options

### Option 1: Render (Recommended)

**Why Render?**
- Simple setup with auto-detection
- Automatic HTTPS (required for transactions)
- Free tier available
- Auto-deploy from GitHub
- Great for Next.js applications

#### Deploy via Render Dashboard

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Web Service**
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub
   - Click "New" → "Web Service"
   - Connect your repository
   - Render auto-detects Next.js
   - Settings:
     - Name: `passkey-lazorkit-demo` (or your choice)
     - Environment: `Node`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
   - Click "Create Web Service"

3. **Your app is live!**
   - Render automatically provides HTTPS
   - Your app URL: `https://your-project.onrender.com`
   - Share this URL as your live demo

**Note:** Render may take a few minutes for the first build. Subsequent deployments are faster.

### Option 2: Vercel

**Why Vercel?**
- Built by Next.js creators - zero configuration
- Automatic HTTPS (required for transactions)
- Free tier with generous limits
- One-click deployment
- Global CDN included

#### Deploy via Vercel Dashboard

1. **Push your code to GitHub**

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "Add New Project"
   - Import your repository
   - Click "Deploy" (no configuration needed!)

3. **Your app is live!**
   - Vercel automatically provides HTTPS
   - Your app URL: `https://your-project.vercel.app`

#### Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production Deployment
vercel --prod
```

### Option 3: Netlify

**Why Netlify?**
- Simple setup
- Automatic HTTPS
- Free tier available
- Continuous deployment from GitHub

#### Deploy via Netlify Dashboard

1. **Push your code to GitHub**

2. **Import to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/Login with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - Build settings (auto-detected):
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Click "Deploy site"

3. **Your app is live!**
   - Netlify automatically provides HTTPS
   - Your app URL: `https://your-project.netlify.app`

#### Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Follow the prompts to link your site
```

### Option 4: Railway

**Why Railway?**
- Simple setup
- Automatic HTTPS
- Free tier available
- One-click deployment

#### Deploy via Railway

1. **Push your code to GitHub**

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Next.js
   - Click "Deploy"

3. **Your app is live!**
   - Railway automatically provides HTTPS
   - Your app URL: `https://your-project.up.railway.app`

## 🔧 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] **Code is pushed to GitHub**
  ```bash
  git add .
  git commit -m "Ready for deployment"
  git push origin main
  ```

- [ ] **Dependencies are up to date**
  ```bash
  npm install
  ```

- [ ] **Build succeeds locally**
  ```bash
  npm run build
  ```

- [ ] **No TypeScript errors**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **No linting errors**
  ```bash
  npm run lint
  ```

## 📝 Environment Variables (Optional)

Most platforms allow you to set environment variables. The app works with defaults, but you can override:

- `NEXT_PUBLIC_SOLANA_RPC_URL` - Solana RPC endpoint (default: `https://api.devnet.solana.com`)
- `NEXT_PUBLIC_LAZORKIT_PORTAL_URL` - LazorKit portal (default: `https://portal.lazor.sh`)
- `NEXT_PUBLIC_PAYMASTER_URL` - Paymaster URL (default: `https://kora.devnet.lazorkit.com`)

**Note:** These are optional. The app uses hardcoded defaults in `app/lib/constants/urls.ts`.

### Setting Environment Variables

**Render:**
- Go to Environment → Environment Variables
- Add each variable
- Redeploy (automatic on save)

**Vercel:**
- Go to Project Settings → Environment Variables
- Add each variable
- Redeploy

**Netlify:**
- Go to Site Settings → Environment Variables
- Add each variable
- Redeploy

## 🧪 Post-Deployment Testing

After deployment, test:

1. **Visit your live URL**
   - Example: `https://your-project.onrender.com`

2. **Test Passkey Connection**
   - Click "Connect with Passkey"
   - Complete biometric authentication
   - Verify wallet address is displayed

3. **Test Transactions** (requires Devnet SOL)
   - Get SOL from [Solana Faucet](https://faucet.solana.com)
   - Send a test transaction
   - Verify on [Solana Explorer](https://explorer.solana.com/?cluster=devnet)

4. **Test on Mobile**
   - Open your app on mobile browser
   - Test passkey authentication (Face ID/Touch ID)
   - Verify responsive design

## 🐛 Troubleshooting

### Build Fails

**Error: "Module not found"**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally and commit `package-lock.json`

**Error: "TypeScript errors"**
- Fix TypeScript errors locally first
- Run `npx tsc --noEmit` to check

### App Doesn't Load

**Error: "404 Not Found"**
- Check build output directory
- For Next.js, ensure build command is `npm run build`
- For Render/Vercel/Netlify, settings are usually auto-detected

**Error: "HTTPS required"**
- All recommended platforms provide HTTPS automatically
- If using custom hosting, ensure HTTPS is configured

### Transactions Don't Work

**Error: "WebAuthn not supported"**
- Ensure you're using HTTPS (not HTTP)
- Check browser compatibility (Chrome, Safari, Edge, Firefox)

**Error: "RPC rate limit"**
- Use a private RPC provider (Helius, QuickNode, Alchemy)
- Set `NEXT_PUBLIC_SOLANA_RPC_URL` environment variable

## 📊 Platform Comparison

| Platform | Setup Time | Free Tier | HTTPS | Best For |
|----------|-----------|-----------|-------|----------|
| **Render** | 5 min | Yes | Auto | Full-stack apps (recommended) |
| **Vercel** | 2 min | Yes | Auto | Next.js apps |
| **Netlify** | 3 min | Yes | Auto | Static sites |
| **Railway** | 3 min | Yes | Auto | Full-stack apps |

**Recommendation:** **Render** is a great choice for Next.js applications with simple setup and reliable free tier. Vercel is also excellent if you prefer faster initial builds.

## 🔗 Sharing Your Live Demo

Once deployed, share your live demo URL:

1. **Add to README.md**
   ```markdown
   ## 🌐 Live Demo
   
   [View Live Demo](https://your-project.onrender.com)
   ```

2. **Add to Bounty Submission**
   - Include the live demo URL in your submission
   - Ensure it's accessible and working

3. **Test Before Submission**
   - Test all features on the live demo
   - Ensure passkey authentication works
   - Test transactions (if possible)

## 📚 Additional Resources

- [Render Deployment Docs](https://render.com/docs)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Netlify Deployment Docs](https://docs.netlify.com)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)

---

**Need help?** Check the [Integration Guide](./docs/guides/integration-guide.md) or open an issue on GitHub.
