import { ethers } from "hardhat";

async function main() {
  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.deploy(
    "0x03a815CBDb046243D63274E2B1cEBdc339290BdE", // AIF on Goerli
    1682899200, // Start of May
    "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6", // WETH address on Goerli
    "0xde637d4c445ca2aae8f782ffac8d2971b93a4998", // USDC address on Goerli
    "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e" // ETH-USD price feed on Goerli
  );

  await presale.deployed();

  console.log("Presale has been deployed successfully: ", presale.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
