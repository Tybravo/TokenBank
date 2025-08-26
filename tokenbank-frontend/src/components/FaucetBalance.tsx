import { useState } from 'react';
import axios from 'axios';
import { type Network, NETWORK_CONFIG } from '../lib/suiConfig.ts';

interface FaucetBalanceProps {
  network: Network;
  balance: string | null;
  setBalance: (balance: string | null) => void;
}

const FaucetBalance: React.FC<FaucetBalanceProps> = ({ network, balance, setBalance }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      // Assuming your backend has a /balance endpoint; adjust if needed
      const response = await axios.get(`${NETWORK_CONFIG[network].backendUrl}/balance`);
      setBalance(response.data.balance);
    } catch (err) {
      setError('Failed to check balance. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-lg">
      <button
        onClick={handleCheck}
        className="w-full bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg hover:bg-blue-800 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Check Balance'}
      </button>
      {balance && <p className="mt-4 text-gray-800 font-medium text-center">Faucet Balance: {balance} SUI</p>}
      {error && <p className="mt-4 text-red-600 font-medium text-center">{error}</p>}
    </div>
  );
};

export default FaucetBalance;
