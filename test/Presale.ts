import { ethers } from "hardhat";
import { Signer } from "ethers";
import { expect } from "chai";

describe("Presale", function () {
  let owner: Signer;
  let buyer1: Signer;
  let buyer2: Signer;
  let priceFeed: any;
  let token: any;
  let weth: any;
  let usdc: any;
  let presale: any;

  before(async function () {
    [owner, buyer1, buyer2] = await ethers.getSigners();

    priceFeed = await (
      await ethers.getContractFactory("MockAggregatorV3")
    ).deploy(ethers.BigNumber.from(3500));
    token = await (
      await ethers.getContractFactory("MockERC20")
    ).deploy("Token", "TKN", ethers.BigNumber.from(5000000));
    weth = await (
      await ethers.getContractFactory("MockWETH")
    ).deploy();
    usdc = await (
      await ethers.getContractFactory("MockUSDC")
    ).deploy();

    presale = await (
      await ethers.getContractFactory("Presale")
    ).deploy(token.address, Math.floor(Date.now() / 1000) + 3600, weth.address, usdc.address, priceFeed.address);

    // transfer tokens to the presale contract
    await token.transfer(presale.address, ethers.BigNumber.from(5000000));
  });

  it("should start with the correct phase", async function () {
    expect(await presale.getCurrentPhase()).to.deep.equal({
      minPurchase: ethers.BigNumber.from(300),
      maxPurchase: ethers.BigNumber.from(2500),
      tokensAvailable: ethers.BigNumber.from(1500000),
      tokenPrice: ethers.BigNumber.from(40),
      tokensSold: ethers.BigNumber.from(0),
    });
  });

  it("should allow the owner to change the phase", async function () {
    await expect(presale.setCurrentPhase(1)).to.not.be.reverted;
    expect(await presale.getCurrentPhase()).to.deep.equal({
      minPurchase: ethers.BigNumber.from(300),
      maxPurchase: ethers.BigNumber.from(5000),
      tokensAvailable: ethers.BigNumber.from(875000),
      tokenPrice: ethers.BigNumber.from(44),
      tokensSold: ethers.BigNumber.from(0),
    });
  });

  it("should not allow non-owners to change the phase", async function () {
    await expect(
      presale.connect(buyer1).setCurrentPhase(2)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should allow the owner to enable claiming", async function () {
    await expect(presale.enableClaiming(true)).to.not.be.reverted;
    expect(await presale.claimingEnabled()).to.equal(true);
  });

  it("should not allow non-owners to enable claiming", async function () {
    await expect(
      presale.connect(buyer1).enableClaiming(false)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

}
