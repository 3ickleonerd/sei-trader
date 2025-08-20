import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./src",
  },
  networks: {
    "metis-hyperion-testnet": {
      url: "https://hyperion-testnet.metisdevops.link",
    },
  },
  etherscan: {
    apiKey: {
      "metis-hyperion-testnet": "empty",
    },
    customChains: [
      {
        network: "metis-hyperion-testnet",
        chainId: 133717,
        urls: {
          apiURL: "https://hyperion-testnet-explorer-api.metisdevops.link/api",
          browserURL: "https://hyperion-testnet-explorer.metisdevops.link",
        },
      },
    ],
  },
};

export default config;
