import { ethers } from "hardhat";

async function main() {
  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.deploy(
    "0x10f7c3A078eD8dc078f0528B520488207D38b28e", // AIF on Goerli
    1682899200, // Start of May
    "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6", // WETH address on Goerli
    "0xEEa85fdf0b05D1E0107A61b4b4DB1f345854B952", // USDC address on Goerli
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
