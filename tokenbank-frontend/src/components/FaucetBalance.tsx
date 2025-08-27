import { useState } from 'react';
import axios from 'axios';
import { FaSearch, FaSpinner, FaCoins, FaChartLine } from 'react-icons/fa';
import { type Network, NETWORK_CONFIG } from '../lib/suiConfig';

interface FaucetBalanceProps {
  network: Network;
  balance: string | null;
  setBalance: (balance: string | null) => void;
  onLoading?: (loading: boolean) => void;
  onNotification?: (type: 'success' | 'error', message: string) => void;
}

export const FaucetBalance: React.FC<FaucetBalanceProps> = ({ 
  network, 
  balance, 
  setBalance, 
  onLoading, 
  onNotification 
}) => {
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const handleCheck = async () => {
    setLoading(true);
    onLoading?.(true);

    try {
      // Simulate API call - replace with actual backend endpoint
      const response = await axios.get(`${NETWORK_CONFIG[network].backendUrl}/balance`);
      const balanceValue = response.data.balance;
      setBalance(balanceValue);
      setLastChecked(new Date());
      onNotification?.('success', 'Faucet balance updated successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to check balance. Please try again.';
      onNotification?.('error', errorMessage);
      console.error('Balance check error:', err);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  const getBalanceStatus = () => {
    if (!balance) return null;
    const num = parseFloat(balance);
    if (num > 1000) return { status: 'high', color: 'emerald', message: 'Healthy' };
    if (num > 100) return { status: 'medium', color: 'yellow', message: 'Moderate' };
    return { status: 'low', color: 'red', message: 'Low' };
  };

  const balanceStatus = getBalanceStatus();

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Balance Display Card */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-slate-200/50 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/50 -z-10"></div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <FaChartLine className="text-2xl text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Faucet Balance</h3>
          <p className="text-slate-600">Check current faucet reserves</p>
        </div>

        {/* Balance Display */}
        {balance && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 mb-6 relative overflow-hidden shadow-xl">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-20 h-20 border border-white/20 rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 border border-white/10 rounded-full"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FaCoins className="text-yellow-400 text-xl" />
                  <span className="text-slate-300 font-medium">Available Balance</span>
                </div>
                {balanceStatus && (
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1
                    ${balanceStatus.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      balanceStatus.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    <div className={`w-2 h-2 rounded-full 
                      ${balanceStatus.color === 'emerald' ? 'bg-emerald-400' :
                        balanceStatus.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                    <span>{balanceStatus.message}</span>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {formatBalance(balance)}
                  <span className="text-2xl font-normal text-slate-400 ml-2">SUI</span>
                </div>
                <div className="text-slate-400 text-sm">
                  Network: <span className="text-blue-400 font-medium">{network.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Balance State */}
        {!balance && !loading && (
          <div className="text-center py-8 px-4 border-2 border-dashed border-slate-300 rounded-2xl mb-6">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FaSearch className="text-slate-500 text-xl" />
            </div>
            <p className="text-slate-500 font-medium">No balance data available</p>
            <p className="text-slate-400 text-sm mt-1">Click below to check current faucet balance</p>
          </div>
        )}

        {/* Check Balance Button */}
        <button
          onClick={handleCheck}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-2xl font-semibold text-white shadow-xl transition-all duration-300 transform relative overflow-hidden group
            ${loading
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 hover:scale-105 hover:shadow-2xl active:scale-95'
            }`}
        >
          {/* Button Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          <div className="flex items-center justify-center space-x-3 relative z-10">
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Checking Balance...</span>
              </>
            ) : (
              <>
{balance ? <FaCoins /> : <FaSearch />}
                <span>{balance ? 'Refresh Balance' : 'Check Faucet Balance'}</span>
              </>
            )}
          </div>
        </button>

        {/* Last Checked Info */}
        {lastChecked && (
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              Last updated: {lastChecked.toLocaleString()}
            </p>
          </div>
        )}

        {/* Statistics Card */}
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-5 shadow-inner">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">24h</div>
              <div className="text-xs text-slate-600 font-medium">Cooldown</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">10</div>
              <div className="text-xs text-slate-600 font-medium">Max SUI</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="text-center">
              <div className="text-sm font-medium text-slate-700 mb-1"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
