import './index.css';
// import '../dist/output.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { WalletProvider } from '@suiet/wallet-kit';
import { defineSlushWallet } from '@suiet/wallet-kit';

const slushWalletConfig = defineSlushWallet({
  appName: 'Token Bank Faucet',  // Your dApp name for Slush Wallet
  network: 'testnet',  // Single network as per the error suggestion
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider
      defaultWallets={[slushWalletConfig]}  // Use defaultWallets to include Slush
    >
      <App />
    </WalletProvider>
  </React.StrictMode>,
);

