import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import * as dotenv from "dotenv";
dotenv.config();
import { EtherscanConfig } from "@nomiclabs/hardhat-etherscan/dist/src/types";

interface Config extends HardhatUserConfig {
  etherscan: EtherscanConfig;
}

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const config: Config = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mainnet: {
      url: `https://arb1.arbitrum.io/rpc`,
      accounts: [PRIVATE_KEY],
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
  etherscan: {
    customChains: [],
    apiKey: { goerli: "T3S7NPQWMYC4ZTSS4YTU3F848XP7JAD2CE" },
  },
};

export default config;
