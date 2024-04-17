/** @type import('hardhat/config').HardhatUserConfig */
require('@nomiclabs/hardhat-ethers');
require("dotenv").config();

const { API_URL, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.0",
  paths: {
    artifacts: "./artifacts",
  },
  networks: {
    sepolia: {
      url: API_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};
