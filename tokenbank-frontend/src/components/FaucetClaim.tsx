import { useState } from 'react';
import axios from 'axios';
import { type Network, NETWORK_CONFIG } from '../lib/suiConfig.ts';

interface FaucetClaimProps {
  network: Network;
  walletAddress: string;
}

const FaucetClaim: React.FC<FaucetClaimProps> = ({ network, walletAddress: initialAddress }) => {
  const [address, setAddress] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!address) {
      setError('Please enter a wallet address');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`${NETWORK_CONFIG[network].backendUrl}/claim`, {
        address,
        network,
      });
      setSuccess(response.data.message || 'Tokens claimed successfully!');
    } catch (err) {
      setError('Failed to claim tokens. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Your Wallet Address"
        className="w-full border border-gray-300 rounded-lg p-4 mb-6 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-md transition duration-200"
        disabled={!!initialAddress}
      />
      <button
        onClick={handleClaim}
        className="w-full bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg hover:bg-blue-800 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
        disabled={loading}
      >
        {loading ? 'Claiming...' : 'Claim SUI Token'}
      </button>
      {error && <p className="mt-4 text-red-600 font-medium">{error}</p>}
      {success && <p className="mt-4 text-green-600 font-medium">{success}</p>}
    </div>
  );
};

export default FaucetClaim;
