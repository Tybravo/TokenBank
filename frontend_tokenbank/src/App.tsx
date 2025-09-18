import { useState } from 'react';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FaWallet, FaSpinner } from 'react-icons/fa';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
// import FaucetClaim from './components/FaucetClaim';
// import FaucetBank from './components/FaucetBank';
// import FaucetBalance from './components/FaucetRequest';
import { type Network } from './lib/suiConfig';

// Import dApp Kit CSS
import '@mysten/dapp-kit/dist/index.css';

// Configure networks
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});

const queryClient = new QueryClient();

// Main App Component wrapped with providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider>
          <TokenBankApp />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

// Inner App Component
function TokenBankApp() {
  const currentAccount = useCurrentAccount();
  const [network, setNetwork] = useState<Network>('testnet');
  const [faucetBalance, setFaucetBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNetwork(e.target.value as Network);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: null, message: '' });
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col font-inter">
      {/* Notification Toast */}
      {notification.type && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-500 ease-in-out ${
            notification.type === 'success'
              ? 'bg-emerald-500 text-white border-l-4 border-emerald-600'
              : 'bg-red-500 text-white border-l-4 border-red-600'
          }`}
          style={{
            animation: 'slideInRight 0.5s ease-out',
          }}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-2 h-2 rounded-full ${
                notification.type === 'success' ? 'bg-emerald-200' : 'bg-red-200'
              }`}
            ></div>
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-[#4A90E2] via-[#4A90E2] to-[#4A90E2] text-white shadow-2xl border-b border-[#4A90E2]">
        <div className="container mx-auto px-4 py-6 md:py-3">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaWallet className="text-xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">
                  <span className="text-black">Token</span> <span className="text-white">Bank</span>
                </h1>
                <p className="text-white mr-20">SUI Token Faucet & Reserve</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 md:space-x-6">
              {/* Network Selector */}
              <div className="relative">
                <select
                  value={network}
                  onChange={handleNetworkChange}
                  className="bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all duration-200 appearance-none pr-10 backdrop-blur-sm"
                >
                  <option value="testnet">Testnet</option>
                  <option value="devnet">Devnet</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>

              {/* Connect Button */}
              <ConnectButton
                connectText="Connect to Wallet"
                className="bg-gradient-to-r from-gray-200 to-gray-200 text-white px-6 py-3 rounded-xl shadow-xl flex items-center space-x-3 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 border border-blue-500 connect-wallet-button"
              >
                <FaWallet className="text-lg" />
              </ConnectButton>
            </div>
          </div>

          {/* Connected Address Display */}
          {currentAccount && (
            <div className="mt-4 p-4 bg-slate-700/30 backdrop-blur-sm border border-slate-600 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <p className="text-slate-300 text-sm">
                  Connected: <span className="font-mono text-blue-400">{currentAccount.address}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-transparent to-slate-600"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl">
          {/* Title Section */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-800 via-blue-800 to-slate-700 bg-clip-text text-transparent">
              Get Your SUI Tokens
            </h2>
            <p className="text-slate-600 text-lg">Choose from official faucet, reserve bank, or check balances</p>
          </div>

          {/* Three Cards Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Faucet Claim Component */}
            <div className="flex justify-center">
              {/* <FaucetClaim
                network={network}
                walletAddress={currentAccount?.address || ''}
                onLoading={setIsLoading}
                onNotification={showNotification}
              /> */}
            </div>

            {/* Faucet Bank Component */}
            <div className="flex justify-center">
              {/* <FaucetBank
                network={network}
                walletAddress={currentAccount?.address || ''}
                onLoading={setIsLoading}
                onNotification={showNotification}
              /> */}
            </div>

            {/* Faucet Balance Component */}
            <div className="flex justify-center">
              {/* <FaucetBalance
                network={network}
                balance={faucetBalance}
                setBalance={setFaucetBalance}
                onLoading={setIsLoading}
                onNotification={showNotification}
              /> */}
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Official Faucet</h4>
                    <p className="text-sm text-slate-600">Try the official SUI faucet first. Free tokens with 24-hour rate limits.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">TokenBank Reserve</h4>
                    <p className="text-sm text-slate-600">Backup option when faucet fails. Custom amounts from our reserve wallet.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Check Balances</h4>
                    <p className="text-sm text-slate-600">Monitor both faucet and reserve balances in real-time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4">
              <FaSpinner className="text-4xl text-blue-600 animate-spin" />
              <p className="text-slate-700 font-medium">Processing transaction...</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white shadow-2xl border-t border-slate-700">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FaWallet className="text-sm text-white" />
              </div>
              <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                TokenBank
              </p>
            </div>
            <p className="text-slate-400 mb-2">Powered by SUI Blockchain</p>
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
              <span>Built with</span>
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
              <span>SUI dApp Kit</span>
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
              <span>React</span>
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
