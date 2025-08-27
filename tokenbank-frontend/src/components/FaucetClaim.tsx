import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaWallet, FaSpinner, FaCopy, FaCheck, FaCoins } from 'react-icons/fa';
import { type Network, NETWORK_CONFIG } from '../lib/suiConfig';

interface FaucetClaimProps {
  network: Network;
  walletAddress: string;
  onLoading?: (loading: boolean) => void;
  onNotification?: (type: 'success' | 'error', message: string) => void;
}

const FaucetClaim: React.FC<FaucetClaimProps> = ({ 
  network, 
  walletAddress: initialAddress, 
  onLoading, 
  onNotification 
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setAddress(initialAddress);
    setIsConnected(!!initialAddress);
  }, [initialAddress]);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onNotification?.('success', 'Address copied to clipboard!');
    }
  };

  const handleClaim = async () => {
    if (!address) {
      onNotification?.('error', 'Please enter a wallet address or connect your wallet');
      return;
    }

    if (address.length < 40) {
      onNotification?.('error', 'Please enter a valid wallet address');
      return;
    }

    setLoading(true);
    onLoading?.(true);

    try {
      // Simulate API call - replace with actual backend endpoint
      const response = await axios.post(`${NETWORK_CONFIG[network].backendUrl}/claim`, {
        address,
        network,
      });
      
      onNotification?.('success', response.data.message || 'Tokens claimed successfully! Check your wallet.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to claim tokens. Please try again.';
      onNotification?.('error', errorMessage);
      console.error('Claim error:', err);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Main Card */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-slate-200/50 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-slate-50/50 -z-10"></div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <FaCoins className="text-2xl text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Claim SUI Tokens</h3>
          <p className="text-slate-600">Get free tokens for testing on {network}</p>
        </div>

        {/* Address Input Section */}
        <div className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Wallet Address
            </label>
            <div className="relative group">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={isConnected ? "Connected wallet address" : "Enter your wallet address (0x...)"}
                className={`w-full border-2 rounded-2xl px-5 py-4 text-slate-800 font-mono text-sm transition-all duration-300 shadow-lg
                  ${isConnected 
                    ? 'border-emerald-300 bg-emerald-50/50 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100' 
                    : 'border-slate-300 bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
                  }
                  focus:outline-none placeholder:text-slate-400 placeholder:font-sans
                  group-hover:shadow-xl transform transition-transform`}
                disabled={isConnected}
              />
              
              {/* Copy Button */}
              {address && (
                <button
                  onClick={handleCopy}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-slate-500 hover:text-blue-600 transition-colors duration-200 rounded-lg hover:bg-blue-50"
                  type="button"
                >
                  {copied ? (
                    <FaCheck className="text-emerald-500" />
                  ) : (
                    <FaCopy className="text-sm" />
                  )}
                </button>
              )}
            </div>
            
            {/* Connected Indicator */}
            {isConnected && (
              <div className="flex items-center space-x-2 mt-3 px-3 py-2 bg-emerald-100 border border-emerald-200 rounded-xl">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-700">Wallet Connected</span>
              </div>
            )}
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={loading || !address}
            className={`w-full py-4 px-6 rounded-2xl font-semibold text-white shadow-xl transition-all duration-300 transform relative overflow-hidden
              ${loading || !address
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-105 hover:shadow-2xl active:scale-95'
              }`}
          >
            {/* Button Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            
            <div className="flex items-center justify-center space-x-3 relative z-10">
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FaWallet />
                  <span>Claim Free SUI Tokens</span>
                </>
              )}
            </div>
          </button>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-5 shadow-inner">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Faucet Information</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Free tokens for testing purposes only</li>
                  <li>• Maximum 10 SUI per request</li>
                  <li>• Cooldown period: 24 hours</li>
                  <li>• Network: {network.toUpperCase()}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaucetClaim;
