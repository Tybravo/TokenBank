import { useState } from 'react';
import { useWallet } from '@suiet/wallet-kit';
import { ConnectButton } from '@suiet/wallet-kit';
import { FaWallet } from 'react-icons/fa';
import FaucetClaim from './components/FaucetClaim.tsx';
import FaucetBalance from './components/FaucetBalance.tsx';
import { type Network} from './lib/suiConfig.ts';

function App() {
  const { connected, address } = useWallet();
  const [network, setNetwork] = useState<Network>('testnet');
  const [faucetBalance, setFaucetBalance] = useState<string | null>(null);

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNetwork(e.target.value as Network);
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-800">Token Bank</div>
        <div className="flex items-center space-x-4">
          <select
            value={network}
            onChange={handleNetworkChange}
            className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="testnet">Testnet</option>
            <option value="devnet">Devnet</option>
          </select>
          <ConnectButton
            className="bg-blue-900 text-white px-4 py-2 rounded-md shadow-md flex items-center space-x-2 hover:bg-blue-800"
          >
            <div className="flex items-center space-x-2">
              <FaWallet />
              <span>{connected ? 'Disconnect Wallet' : 'Connect Wallet'}</span>
            </div>
          </ConnectButton>
        </div>
      </header>

      {/* Body */}
      <main className="flex-grow flex flex-col items-center justify-center p-8 bg-gray-200">
        <h2 className="text-3xl font-semibold mb-6 text-gray-800">Request Your Token</h2>

        <FaucetClaim network={network} walletAddress={address || ''} />

        <div className="mt-8">
          <FaucetBalance
            network={network}
            balance={faucetBalance}
            setBalance={setFaucetBalance}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-md p-4 text-center mt-auto">
        <p className="text-gray-800 font-medium">Developed by Bank Token</p>
        <p className="text-gray-600 text-sm">Powered by SUI</p>
      </footer>
    </div>
  );
}

export default App;
