# Local HTTPS Setup Guide

This guide explains how to set up HTTPS for local development, which is **required for LazorKit transactions**.

## Why HTTPS is Required

- **Transactions require HTTPS** - LazorKit's transaction signing pipeline needs a secure context
- While passkey authentication may work on `http://localhost`, sending transactions will fail
- Production deployments (Vercel, Netlify) provide HTTPS automatically

## Quick Setup (Recommended)

Next.js 16+ includes built-in HTTPS support with automatic certificate generation:

```bash
npm run dev:https
```

This will:
1. Automatically generate self-signed certificates
2. Store them in `.next/certificates/` directory
3. Start the dev server on `https://localhost:3000`

**First Time:**
- Your browser will show a security warning (this is normal for self-signed certificates)
- Click "Advanced" → "Proceed to localhost" (or similar)
- The certificate is safe for local development

## Manual Certificate Setup (Optional)

If you prefer to use your own certificates or need to trust them system-wide:

### Step 1: Generate Self-Signed Certificate

Using OpenSSL (if installed):

```bash
# Create certificates directory
mkdir -p certificates

# Generate private key
openssl genrsa -out certificates/localhost.key 2048

# Generate certificate signing request
openssl req -new -key certificates/localhost.key -out certificates/localhost.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in certificates/localhost.csr \
  -signkey certificates/localhost.key -out certificates/localhost.crt
```

### Step 2: Trust the Certificate (Optional)

To avoid browser warnings, you can trust the certificate:

**Windows:**
1. Double-click `certificates/localhost.crt`
2. Click "Install Certificate"
3. Choose "Local Machine" → "Trusted Root Certification Authorities"
4. Complete the wizard

**macOS:**
1. Open Keychain Access
2. Drag `certificates/localhost.crt` into System keychain
3. Right-click certificate → "Get Info" → "Trust" → "Always Trust"

**Linux:**
```bash
sudo cp certificates/localhost.crt /usr/local/share/ca-certificates/localhost.crt
sudo update-ca-certificates
```

### Step 3: Configure Next.js (If Using Custom Certificates)

If you want to use custom certificates, you'll need to configure Next.js server. However, the `--experimental-https` flag handles this automatically, so manual setup is usually not needed.

## Troubleshooting

### Certificate Errors

If you see certificate errors:
1. Make sure you're using `https://localhost:3000` (not `http://`)
2. Accept the browser security warning for localhost
3. Clear browser cache and try again

### Port Already in Use

If port 3000 is in use:
```bash
# Use a different port
npm run dev:https -- -p 3001
```

Then access `https://localhost:3001`

### Browser Still Shows Warning

This is expected for self-signed certificates. You can:
- Accept the warning (safe for local development)
- Trust the certificate system-wide (see Step 2 above)

## Production

For production, deploy to a service that provides HTTPS:
- **Vercel** - Automatic HTTPS
- **Netlify** - Automatic HTTPS
- **Custom Server** - Configure SSL certificates with your hosting provider

No additional setup needed - HTTPS is handled automatically by the hosting platform.

