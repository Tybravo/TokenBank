export type Network = "testnet" | "devnet";

export interface NetworkConfig {
  backendUrl: string;
}

export const NETWORK_CONFIG: Record<Network, NetworkConfig> = {
  testnet: {
    backendUrl: 'http://localhost:3001/api', // Point to local backend
  },
  devnet: {
    backendUrl: 'http://localhost:3001/api', // Same for devnet during local testing
  },
};


// Debug function to check configuration
export const debugNetworkConfig = () => {
  console.log('Network Configuration:', NETWORK_CONFIG);
  return NETWORK_CONFIG;
};
