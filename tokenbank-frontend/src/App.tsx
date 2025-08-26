import { useState } from 'react';
import { useWallet } from '@suiet/wallet-kit';
import { ConnectButton } from '@suiet/wallet-kit';
import { FaWallet } from 'react-icons/fa';
import FaucetClaim from './components/FaucetClaim.tsx';
import FaucetBalance from './components/FaucetBalance.tsx';
import { type Network } from './lib/suiConfig.ts';

function App() {
  const { connected, address } = useWallet();
  const [network, setNetwork] = useState<Network>('testnet');
  const [faucetBalance, setFaucetBalance] = useState<string | null>(null);

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNetwork(e.target.value as Network);
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg p-4 md:p-6 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Token Bank</h1>
        <div className="flex items-center space-x-4 md:space-x-6">
          <select
            value={network}
            onChange={handleNetworkChange}
            className="bg-gray-100 border border-gray-300 rounded-lg p-2 md:p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-md transition duration-200"
          >
            <option value="testnet">Testnet</option>
            <option value="devnet">Devnet</option>
          </select>
          <ConnectButton>
            <button className="bg-blue-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg flex items-center space-x-2 md:space-x-3 hover:bg-blue-800 transition duration-200">
              <FaWallet />
              <span className="font-medium">{connected ? 'Disconnect Wallet' : 'Connect Wallet'}</span>
            </button>
          </ConnectButton>
        </div>
      </header>

      {/* Body */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 md:p-10 bg-gray-200">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-gray-800 shadow-md bg-white p-3 md:p-4 rounded-lg">Request Your Token</h2>

        <FaucetClaim network={network} walletAddress={address || ''} />

        <div className="mt-8 md:mt-10 w-full max-w-md">
          <FaucetBalance
            network={network}
            balance={faucetBalance}
            setBalance={setFaucetBalance}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white shadow-lg p-4 md:p-6 text-center">
        <p className="text-base md:text-lg font-semibold">Developed by Bank Token</p>
        <p className="text-gray-300 text-sm md:text-base mt-1">Powered by SUI</p>
      </footer>
    </div>
  );
}

export default App;
