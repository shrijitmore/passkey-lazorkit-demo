# Project Structure

This document outlines the organized folder structure of the LazorKit Demo project, designed for clarity and easy navigation.

## 📁 Directory Structure

```
passkey-lazorkit-demo/
├── app/
│   ├── components/
│   │   ├── features/              # Visual/UI effect components
│   │   │   ├── GlitchText.tsx
│   │   │   ├── PixelBlast.tsx
│   │   │   └── SpotlightCard.tsx
│   │   ├── layout/                # Layout components
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppLayout.tsx
│   │   │   └── AppSidebar.tsx
│   │   ├── providers/             # React Context Providers
│   │   │   ├── LazorkitProviderWrapper.tsx
│   │   │   └── Providers.tsx
│   │   ├── shared/                # Shared/reusable components
│   │   │   ├── BackgroundGradient.tsx
│   │   │   └── BalanceDisplay.tsx
│   │   ├── subscription/          # Subscription-related components
│   │   │   ├── SubscriptionActions.tsx
│   │   │   ├── SubscriptionCard.tsx
│   │   │   ├── SubscriptionDemo.tsx
│   │   │   ├── SubscriptionManager.tsx
│   │   │   └── SubscriptionPaymentHistory.tsx
│   │   ├── ui/                    # Base UI components (shadcn/ui)
│   │   │   ├── AlertMessage.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── TransactionStatus.tsx
│   │   └── wallet/                # Wallet-related components
│   │       ├── TransactionHistory.tsx
│   │       ├── TransferModal.tsx
│   │       └── WalletPanelEnhanced.tsx
│   ├── contexts/                  # React Contexts
│   │   ├── BalanceContext.tsx
│   │   └── ThemeContext.tsx
│   ├── lib/
│   │   ├── cache/                 # Cache management
│   │   │   └── clearCache.ts
│   │   ├── constants/             # Application constants
│   │   │   ├── subscriptionPlans.ts
│   │   │   └── urls.ts
│   │   ├── events/                # Event system
│   │   │   └── walletEvents.ts
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useCopyToClipboard.ts
│   │   │   ├── useTransactionSigning.ts
│   │   │   └── useWebAuthnConnection.ts
│   │   ├── rpc/                   # Solana RPC connection
│   │   │   └── connection.ts
│   │   ├── subscription/          # Subscription logic
│   │   │   ├── storage.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   └── utils/                 # Utility functions
│   │       ├── connectionErrorHandling.ts
│   │       ├── errorHandling.ts
│   │       ├── explorerUrls.ts
│   │       └── webauthnValidation.ts
│   ├── page.tsx                   # Home/Dashboard page
│   ├── profile/
│   │   └── page.tsx               # Profile page
│   ├── subscription/
│   │   └── page.tsx               # Subscription page
│   ├── wallet/
│   │   └── page.tsx               # Wallet page
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
├── docs/                          # Documentation
│   ├── guides/
│   │   ├── integration-guide.md
│   │   ├── local-https-setup.md
│   │   └── rpc-configuration.md
│   ├── technical/
│   │   ├── CODE_EXPLANATION.md
│   │   └── TECHNICAL_EXPLANATION.md
│   ├── tutorials/
│   │   ├── tutorial-1-passkey-wallet.md
│   │   ├── tutorial-2-transactions.md
│   │   ├── tutorial-3-session-persistence.md
│   │   └── tutorial-4-subscription-billing.md
│   └── README.md
└── README.md                       # Main project README
```

## 📂 Component Organization

### Features (`components/features/`)
Visual effects and decorative components:
- **GlitchText.tsx** - Text animation effect
- **PixelBlast.tsx** - Visual effect component
- **SpotlightCard.tsx** - Card with spotlight effect

### Layout (`components/layout/`)
Application layout structure:
- **AppHeader.tsx** - Top navigation header
- **AppLayout.tsx** - Main layout wrapper
- **AppSidebar.tsx** - Side navigation

### Providers (`components/providers/`)
React Context providers:
- **LazorkitProviderWrapper.tsx** - LazorKit SDK provider wrapper
- **Providers.tsx** - Combined providers (Theme, LazorKit, Balance)

### Shared (`components/shared/`)
Reusable components used across features:
- **BackgroundGradient.tsx** - Background gradient component
- **BalanceDisplay.tsx** - SOL balance display component

### Subscription (`components/subscription/`)
Subscription management components:
- **SubscriptionActions.tsx** - Subscription action buttons
- **SubscriptionCard.tsx** - Subscription plan card
- **SubscriptionDemo.tsx** - Subscription demo component
- **SubscriptionManager.tsx** - Subscription management UI
- **SubscriptionPaymentHistory.tsx** - Payment history display

### UI (`components/ui/`)
Base UI components (shadcn/ui style):
- **AlertMessage.tsx** - Alert/notification component
- **LoadingSpinner.tsx** - Loading indicator
- **TransactionStatus.tsx** - Transaction status display
- Plus standard shadcn/ui components (button, card, input, etc.)

### Wallet (`components/wallet/`)
Wallet functionality components:
- **TransactionHistory.tsx** - Transaction history display
- **TransferModal.tsx** - SOL transfer modal
- **WalletPanelEnhanced.tsx** - Enhanced wallet panel

## 📚 Library Organization

### `lib/cache/`
Cache management utilities:
- **clearCache.ts** - Centralized cache clearing

### `lib/constants/`
Application constants:
- **subscriptionPlans.ts** - Subscription plan definitions
- **urls.ts** - Centralized URL constants (RPC, Portal, Paymaster, Explorer)

### `lib/events/`
Event system:
- **walletEvents.ts** - Wallet-related events

### `lib/hooks/`
Custom React hooks:
- **useCopyToClipboard.ts** - Clipboard functionality
- **useTransactionSigning.ts** - Transaction signing with retry logic
- **useWebAuthnConnection.ts** - WebAuthn connection management

### `lib/rpc/`
Solana RPC connection:
- **connection.ts** - Singleton Connection instance

### `lib/subscription/`
Subscription business logic:
- **storage.ts** - LocalStorage management
- **types.ts** - TypeScript types
- **utils.ts** - Utility functions

### `lib/utils/`
General utilities:
- **connectionErrorHandling.ts** - RPC error handling
- **errorHandling.ts** - Error parsing and user-friendly messages
- **explorerUrls.ts** - Solana Explorer URL generation
- **webauthnValidation.ts** - WebAuthn validation utilities

## 🎯 Benefits of This Structure

1. **Feature-Based Organization**: Components are grouped by feature (wallet, subscription) making it easy to find related code
2. **Clear Separation**: UI components, business logic, and utilities are clearly separated
3. **Scalability**: Easy to add new features by creating new folders
4. **Maintainability**: Related files are co-located, reducing cognitive load
5. **Reusability**: Shared components are clearly identified in the `shared/` folder
6. **Submission Ready**: Professional structure suitable for code review and submission

## 📝 Import Path Examples

```typescript
// Wallet components
import TransactionHistory from './components/wallet/TransactionHistory';
import TransferModal from './components/wallet/TransferModal';

// Subscription components
import SubscriptionDemo from './components/subscription/SubscriptionDemo';

// Providers
import Providers from './components/providers/Providers';

// Shared components
import BalanceDisplay from './components/shared/BalanceDisplay';

// UI components
import AlertMessage from './components/ui/AlertMessage';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Utilities
import { getConnection } from './lib/rpc/connection';
import { useTransactionSigning } from './lib/hooks/useTransactionSigning';
import { parseError } from './lib/utils/errorHandling';
```

## 🔍 Finding Components

- **Wallet features**: `app/components/wallet/`
- **Subscription features**: `app/components/subscription/`
- **Providers**: `app/components/providers/`
- **Reusable UI**: `app/components/ui/` and `app/components/shared/`
- **Custom hooks**: `app/lib/hooks/`
- **Utilities**: `app/lib/utils/`
- **Constants**: `app/lib/constants/`

