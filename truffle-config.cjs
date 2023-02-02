require('babel-register');
require('babel-polyfill');
require('dotenv').config();

const HDWalletProvider = require("@truffle/hdwallet-provider");
const privateKeys = process.env.PRIVATE_KEYS || ""

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    goerli: {
      provider: function () {
        return new HDWalletProvider(
          privateKeys.split(','), // Array of account private keys
          `${process.env.GOERLI_INFURA_URL}/v3/${process.env.INFURTA_API_KEY_WEB3}`// Url to an Ethereum Node
        )
      },
      gas: 5000000,
      gasPrice: 26350108038,
      network_id: 5,
      networkCheckTimeout: 10000,
      timeoutBlocks: 200
    }
  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}