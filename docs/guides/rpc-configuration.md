# RPC Configuration Guide

## Current Setup

The demo currently uses Solana's public Devnet RPC:
```
https://api.devnet.solana.com
```

**⚠️ Important**: This public RPC has strict rate limits and will return `429 Too Many Requests` errors when exceeded.

## Recommended: Use a Private RPC Provider

For production or heavy testing, use a private RPC provider:

### Option 1: Helius (Recommended)

1. Sign up at [Helius](https://www.helius.dev/)
2. Get your API key
3. Update `LazorkitProviderWrapper.tsx`:

```typescript
const RPC_URL = 'https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY';
```

### Option 2: QuickNode

1. Sign up at [QuickNode](https://www.quicknode.com/)
2. Create a Devnet endpoint
3. Update `LazorkitProviderWrapper.tsx`:

```typescript
const RPC_URL = 'https://YOUR_ENDPOINT.solana-devnet.quiknode.pro/YOUR_KEY';
```

### Option 3: Alchemy

1. Sign up at [Alchemy](https://www.alchemy.com/)
2. Create a Solana Devnet app
3. Update `LazorkitProviderWrapper.tsx`:

```typescript
const RPC_URL = 'https://solana-devnet.g.alchemy.com/v2/YOUR_API_KEY';
```

### Option 4: Triton

1. Sign up at [Triton](https://triton.one/)
2. Get your Devnet endpoint
3. Update `LazorkitProviderWrapper.tsx`:

```typescript
const RPC_URL = 'https://YOUR_ENDPOINT.triton.one';
```

## Environment Variables (Optional)

For better security, you can use environment variables:

1. Create `.env.local`:
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

2. Update `LazorkitProviderWrapper.tsx`:
```typescript
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
```

## Rate Limiting Optimizations

The demo includes several optimizations to reduce RPC calls:

1. **Balance Polling**: Set to 30 second intervals (reduced from more frequent polling)
2. **Transaction History**: Fetches only once on wallet connect (not on every render)
3. **Transaction Limit**: Limited to 5 transactions instead of 10
4. **Error Handling**: Gracefully handles 429 errors without spamming

## Free Tier Limits

Most providers offer free tiers with generous limits:

- **Helius**: 100,000 requests/day (free tier)
- **QuickNode**: 1M requests/month (free tier)
- **Alchemy**: 300M compute units/month (free tier)

These are more than sufficient for development and demos.

