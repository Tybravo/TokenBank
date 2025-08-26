export type Network = "testnet" | "devnet";

export interface NetworkConfig {
  backendUrl: string;
}

export const NETWORK_CONFIG: Record<Network, NetworkConfig> = {
  testnet: {
    backendUrl: 'https://your-testnet-backend.com/api',
  },
  devnet: {
    backendUrl: 'https://your-devnet-backend.com/api', 
  },
};
