'use client';

import { useWallet } from '@lazorkit/wallet';
import GlitchText from '@/app/components/GlitchText';
import WalletPanelEnhanced from '@/app/components/WalletPanelEnhanced';

export default function Home() {
  const { isConnected } = useWallet();

  const scrollToSection = (section: 'home' | 'wallet' | 'features') => {
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/10" data-testid="main-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-purple-pink rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-xl font-bold gradient-text">LazorKit Demo</span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('home')}
                className="text-gray-300 hover:text-white transition-colors"
                data-testid="nav-home"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-gray-300 hover:text-white transition-colors"
                data-testid="nav-features"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('wallet')}
                className="px-4 py-2 gradient-purple-pink text-white rounded-lg font-semibold hover:opacity-90 transition-all"
                data-testid="nav-wallet"
              >
                {isConnected ? 'Wallet' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center px-4 pt-16" data-testid="hero-section">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8 animate-float">
            <div className="inline-block glass-strong rounded-2xl p-3 mb-6">
              <span className="text-sm font-semibold text-purple-400">🚀 Superteam Earn Bounty Submission</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <GlitchText speed={0.5} enableShadows={true}>
                LAZORKIT
              </GlitchText>
            </h1>
            
            <p className="text-3xl md:text-4xl font-semibold mb-4 gradient-text">
              Passkey Authentication Meets
            </p>
            <p className="text-3xl md:text-4xl font-semibold mb-8">
              <span className="text-white">Gasless</span>{' '}
              <span className="gradient-text">Solana Transactions</span>
            </p>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
              No seed phrases. No transaction fees. No wallet extensions.
              <br />
              Just your fingerprint or face. Welcome to the future of Web3 UX.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => scrollToSection('wallet')}
                className="px-8 py-4 gradient-purple-pink text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all btn-glow"
                data-testid="cta-try-now"
              >
                Try It Now
              </button>
              <a
                href="https://docs.lazorkit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 glass text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
                data-testid="cta-documentation"
              >
                Documentation
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {[
              { icon: '🔐', label: 'Passkey Auth', value: '100% Secure' },
              { icon: '⚡', label: 'Gasless Txns', value: '$0 Fees' },
              { icon: '🚀', label: 'Setup Time', value: '<5 Min' },
            ].map((stat, i) => (
              <div key={i} className="glass-strong rounded-2xl p-6 card-hover" data-testid={`stat-${i}`}>
                <div className="text-4xl mb-3">{stat.icon}</div>
                <p className="text-2xl font-bold gradient-text mb-1">{stat.value}</p>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="min-h-screen flex items-center justify-center px-4 py-20" data-testid="features-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 gradient-text">
              Why LazorKit?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built for developers who want to ship amazing Web3 experiences without the complexity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Passwordless Passkey Auth',
                description: 'Users authenticate with Face ID, Touch ID, or Windows Hello. No passwords, no seed phrases, no extension installs.',
                gradient: 'gradient-purple-pink',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Gasless Transactions',
                description: 'LazorKit\'s paymaster covers all transaction fees. Your users never worry about having SOL for gas.',
                gradient: 'gradient-blue-purple',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Smart Wallet Infrastructure',
                description: 'Each user gets a programmatically derived smart wallet. Secure, recoverable, and compliant with Solana standards.',
                gradient: 'gradient-purple-pink',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                ),
                title: 'Developer Friendly',
                description: '3 lines of code to get started. React hooks, TypeScript support, and comprehensive documentation.',
                gradient: 'gradient-blue-purple',
              },
            ].map((feature, i) => (
              <div key={i} className="glass-strong rounded-2xl p-8 card-hover" data-testid={`feature-${i}`}>
                <div className={`w-16 h-16 ${feature.gradient} rounded-xl flex items-center justify-center mb-6 text-white`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Code Example */}
          <div className="mt-12 glass-dark rounded-2xl p-8" data-testid="code-example">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Quick Start</h3>
              <span className="text-xs text-gray-500 font-mono">TypeScript</span>
            </div>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`import { LazorkitProvider, useWallet } from '@lazorkit/wallet';

function App() {
  return (
    <LazorkitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      paymasterConfig={{ paymasterUrl: "..." }}
    >
      <YourApp />
    </LazorkitProvider>
  );
}

function YourApp() {
  const { connect, smartWalletPubkey } = useWallet();
  
  return (
    <button onClick={connect}>
      Connect with Passkey
    </button>
  );
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Wallet Section */}
      <section id="wallet" className="min-h-screen flex items-center justify-center px-4 py-20" data-testid="wallet-section">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4">
              <span className="gradient-text">Live Demo</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Try it yourself! Connect with your passkey and send a gasless transaction on Solana Devnet
            </p>
          </div>

          <div className="flex justify-center">
            <WalletPanelEnhanced />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-strong border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 gradient-purple-pink rounded-lg"></div>
              <span className="font-semibold text-gray-400">LazorKit Demo</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a
                href="https://docs.lazorkit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Documentation
              </a>
              <a
                href="https://github.com/lazor-kit/lazor-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://t.me/lazorkit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Telegram
              </a>
            </div>
            
            <p className="text-sm text-gray-500">
              Built for <span className="text-purple-400">Superteam Earn</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
