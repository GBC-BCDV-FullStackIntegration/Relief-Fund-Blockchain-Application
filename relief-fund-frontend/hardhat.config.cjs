require('@nomiclabs/hardhat-ethers');
require("dotenv").config();

const { API_URL, PRIVATE_KEY } = process.env;

// Export the configuration object for Hardhat
module.exports = {
  solidity: "0.8.0",
  paths: {
    artifacts: "./artifacts",
  },
    // Network configurations
  networks: {
    sepolia: {
      url: API_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};
