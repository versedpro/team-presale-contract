import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network, run } from "hardhat";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";

async function main() {
  const signers = await ethers.getSigners();
  let deployer: SignerWithAddress | undefined;
  signers.forEach((signer) => {
    if (signer.address === process.env.OWNER_ADDRESS) {
      deployer = signer;
    }
  });
  if (!deployer) {
    throw new Error(`${process.env.OWNER_ADDRESS} not found in signers!`);
  }

  if (
    network.name === "goerli" ||
    network.name === "mainnet" ||
    network.name === "mumbai" ||
    network.name === "matic"
  ) {
    // Saving the info to be logged in the table (deployer address)
    const deployerLog = { Label: "Deploying Address", Info: deployer.address };
    // Saving the info to be logged in the table (deployer address)
    const deployerBalanceLog = {
      Label: "Deployer ETH Balance",
      Info: ethers.utils.formatEther(await deployer!.getBalance()),
    };

    const NFT = await ethers.getContractFactory("Collectible");

    // Deploy the contract
    const NFTInst = await NFT.deploy(
      "AI Fund NFT Collection",
      "AIFNFT",
      "ipfs://Qme8ju6dNDqVwFZExX81jknnrHC1g64r3T9h7rFR1o1kT4/",
      deployer.address
    );
    await NFTInst.deployed();

    try {
      // Verify the contract
      await run("verify:verify", {
        address: NFTInst.address,
        constructorArguments: [],
      });
    } catch (error) {
      if (error instanceof NomicLabsHardhatPluginError) {
        console.log("Contract source code already verified");
      } else {
        console.error(error);
      }
    }

    const NFTLog = {
      Label: "Deployed NFT Contract Address",
      Info: NFTInst.address,
    };

    console.table([deployerLog, deployerBalanceLog, NFTLog]);
  } else {
    throw new Error("Not found network");
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
