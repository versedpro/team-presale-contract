import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Presale Contract", () => {
  let owner: SignerWithAddress;
  let buyer1: SignerWithAddress;
  let buyer2: SignerWithAddress;
  let token: any;
  let weth: any;
  let usdc: any;
  let priceFeed: any;
  let presale: any;

  const PHASE_0 = 0;

  const TOKEN_PRICE_PHASE_0 = ethers.utils.parseEther("0.4");
  const TOKEN_PRICE_PHASE_1 = ethers.utils.parseEther("0.44");
  const TOKEN_PRICE_PHASE_2 = ethers.utils.parseEther("0.46");
  const TOKEN_PRICE_PHASE_3 = ethers.utils.parseEther("0.48");
  const TOKEN_PRICE_PHASE_4 = ethers.utils.parseEther("0.5");

  const MIN_PURCHASE_PHASE_0 = ethers.utils.parseEther("3");
  const MAX_PURCHASE_PHASE_0 = ethers.utils.parseEther("2500");
  const TOKENS_AVAILABLE_PHASE_0 = ethers.utils.parseEther("1500000");

  const MIN_PURCHASE_PHASE_1 = ethers.utils.parseEther("3");
  const MAX_PURCHASE_PHASE_1 = ethers.utils.parseEther("5000");
  const TOKENS_AVAILABLE_PHASE_1 = ethers.utils.parseEther("875000");

  const MIN_PURCHASE_PHASE_2 = ethers.utils.parseEther("2");
  const MAX_PURCHASE_PHASE_2 = ethers.utils.parseEther("7500");
  const TOKENS_AVAILABLE_PHASE_2 = ethers.utils.parseEther("875000");

  const MIN_PURCHASE_PHASE_3 = ethers.utils.parseEther("2");
  const MAX_PURCHASE_PHASE_3 = ethers.utils.parseEther("7500");
  const TOKENS_AVAILABLE_PHASE_3 = ethers.utils.parseEther("875000");

  const MIN_PURCHASE_PHASE_4 = ethers.utils.parseEther("1");
  const MAX_PURCHASE_PHASE_4 = ethers.utils.parseEther("10000");
  const TOKENS_AVAILABLE_PHASE_4 = ethers.utils.parseEther("875000");

  beforeEach(async () => {
    [owner, buyer1, buyer2] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("MockERC20");
    const AIFund = await ethers.getContractFactory("AIFund");
    token = await AIFund.deploy("0x7089e7a1E4d34fAF7aB487ce599cE27D97d340CB");

    weth = await ERC20.deploy("WETH", "WETH", ethers.utils.parseEther("1000"));
    usdc = await ERC20.deploy(
      "USDC",
      "USDC",
      ethers.utils.parseEther("100000")
    );

    priceFeed = await (
      await ethers.getContractFactory("MockAggregatorV3")
    ).deploy();

    presale = await (await ethers.getContractFactory("Presale"))
      .connect(owner)
      .deploy(
        token.address,
        Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        weth.address,
        usdc.address,
        priceFeed.address
      );

    // Provide buyer1 and buyer2 some funds
    await weth.transfer(buyer1.address, ethers.utils.parseEther("10"));
    await weth
      .connect(buyer1)
      .approve(presale.address, ethers.constants.MaxUint256);

    await weth.transfer(buyer1.address, ethers.utils.parseEther("10"));
    await weth
      .connect(buyer2)
      .approve(presale.address, ethers.constants.MaxUint256);

    await usdc.transfer(buyer1.address, ethers.utils.parseEther("1000"));
    await usdc
      .connect(buyer1)
      .approve(presale.address, ethers.constants.MaxUint256);
  });

  /**
   * Test cases
   *  */
  // 1. Test that the constructor sets the correct values for token, totalTokens, endTime, weth, and usdc.
  it("should set the correct values in the constructor", async function () {
    expect(await presale.token()).to.equal(token.address);
    expect(await presale.totalTokens()).to.equal(
      ethers.utils.parseEther("5000000")
    );
    expect(await presale.endTime()).to.equal(
      Math.floor(Date.now() / 1000) + 86400
    );
    expect(await presale.weth()).to.equal(weth.address);
    expect(await presale.usdc()).to.equal(usdc.address);
  });

  // 2. Test that the getCurrentPhase function returns the correct phase information for each phase.
  it("should return the correct phase information for each phase", async function () {
    const phase0 = await presale.getCurrentPhase();
    expect(phase0["minPurchase"]).to.equal(ethers.utils.parseEther("3"));
    expect(phase0["maxPurchase"]).to.equal(ethers.utils.parseEther("2500"));
    expect(phase0["tokensAvailable"]).to.equal(
      ethers.utils.parseEther("1500000")
    );
    expect(phase0["tokenPrice"]).to.equal(TOKEN_PRICE_PHASE_0);
    expect(phase0["tokensSold"]).to.equal(0);
  });

  // 3. Test that the setCurrentPhase function sets the correct phase.
  it("should set the correct phase with setCurrentPhase function", async function () {
    await presale.setCurrentPhase(1);
    expect(await presale.currentPhase()).to.equal(1);

    await presale.setCurrentPhase(4);
    expect(await presale.currentPhase()).to.equal(4);

    await expect(presale.setCurrentPhase(5)).to.be.revertedWith(
      "Invalid phase number"
    );
  });

  // 4. Test that the whitelistAddresses function whitelists addresses correctly.
  it("should whitelist addresses correctly", async function () {
    await presale.whitelistAddresses([buyer1.address, buyer2.address]);
    expect(await presale.whitelist(buyer1.address)).to.be.true;
    expect(await presale.whitelist(buyer2.address)).to.be.true;
  });

  // 5. Test that the enableClaiming function enables claiming correctly.
  // 6. Test that the buyTokens function throws an error if the presale has ended.
  // it("should throw an error if the presale has ended", async () => {
  //   const amount = ethers.utils.parseEther("1");

  //   // Set custom timestamp
  //   await ethers.provider.send("evm_setAutomine", [false]);

  //   // Set the timestamp to April 7th, 2024 at 12:00:00 PM GMT
  //   const timestamp = new Date("2024-04-07T12:00:00Z").getTime() / 1000;
  //   await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);

  //   // Mine a block to update the timestamp
  //   await ethers.provider.send("evm_mine", []);

  //   await expect(presale.buyTokens(amount, true)).to.be.revertedWith(
  //     "Presale has ended"
  //   );
  // });

  // 7. Test that the buyTokens function throws an error if the user is not whitelisted for phase 0.
  it("should throw an error if the user is not whitelisted for phase 0", async () => {
    const amount = ethers.utils.parseEther("1");
    await expect(presale.buyTokens(amount, false)).to.be.revertedWith(
      "You are not whitelisted"
    );
  });

  // 8. Test that the buyTokens function throws an error if the amount of tokens to buy is invalid.
  it("should throw an error if the amount of tokens to buy is invalid", async () => {
    const amount = 0;
    // Set whitelist member
    await presale.whitelistAddresses([owner.address]);
    await expect(presale.buyTokens(amount, false)).to.be.revertedWith(
      "Invalid amount"
    );
  });

  // 9. Test that the buyTokens function throws an error if the user is trying to buy more tokens than are available in the current phase.
  it("should throw an error if the user is trying to buy more tokens than are available in the current phase", async () => {
    const totalTokens = await presale.totalTokens();
    const tokensToBuy = ethers.utils.parseEther("1").add(totalTokens);
    // Set whitelist member
    await presale.whitelistAddresses([owner.address]);
    await expect(presale.buyTokens(tokensToBuy, false)).to.be.revertedWith(
      "Insufficient token amount"
    );
  });

  // 10. Test that the buyTokens function throws an error if the user is trying to buy less than the minimum amount of tokens allowed in the current phase.
  it("should throw an error if the user is trying to buy less than the minimum amount of tokens allowed in the current phase", async () => {
    const minAmount = (await presale.phases(0)).minPurchase;
    const amount = ethers.BigNumber.from(minAmount).sub(
      ethers.utils.parseEther("1")
    );
    // Set whitelist member
    await presale.whitelistAddresses([owner.address]);
    await expect(presale.buyTokens(amount, true)).to.be.revertedWith(
      "Amount is below minimum purchase"
    );
  });

  // 11. Test that the buyTokens function throws an error if the user is trying to buy more than the maximum amount of tokens allowed in the current phase.
  it("should throw an error if the user is trying to buy more tokens than are available in the current phase", async () => {
    const minAmount = (await presale.phases(0)).maxPurchase;
    const amount = ethers.BigNumber.from(minAmount).add(
      ethers.utils.parseEther("1")
    );
    // Set whitelist member
    await presale.whitelistAddresses([owner.address]);
    await expect(presale.buyTokens(amount, true)).to.be.revertedWith(
      "Amount is above maximum purchase"
    );
  });
  // 12. Test that the buyTokens function correctly updates the balances mapping.
  // 13. Test that the buyTokens function correctly updates the tokensSold value for the current phase.
  // 14. Test that the buyTokens function correctly transfers tokens to the buyer.
  // 15. Test that the buyTokens function correctly transfers WETH or USDC from the buyer to the contract (depending on the value of _isWithWETH).
  it("should allow a buyer to purchase tokens with WETH", async function () {
    // Calculate the amount of WETH needed to purchase the desired amount of tokens
    const phase_0 = await presale.phases(0);
    const tokenPrice = phase_0.tokenPrice;
    const wethPrice = await presale.getETHLatestPrice();
    const tokensToBuy = ethers.utils.parseEther("1000");
    const wethToBuy = tokensToBuy.mul(tokenPrice).div(wethPrice);
    // console.log(ethers.utils.formatEther(ethers.BigNumber.from(wethPrice)));

    // Approve the presale to spend the required amount of WETH
    await weth.connect(buyer1).approve(presale.address, wethToBuy);

    // Set whitelist member
    await presale.whitelistAddresses([buyer1.address]);

    // Perform the token purchase
    await presale.connect(buyer1).buyTokens(tokensToBuy, true, {
      value: wethToBuy,
    });

    await expect(await weth.balanceOf(presale.address)).to.be.equal(wethToBuy);
  });

  it("should allow a buyer to purchase tokens with USDC", async function () {
    // Calculate the amount of USDC needed to purchase the desired amount of tokens
    const tokenPrice = (await presale.phases(0)).tokenPrice;
    const tokensToBuy = ethers.utils.parseEther("1000");
    const usdcToBuy = tokensToBuy
      .mul(tokenPrice)
      .div(ethers.utils.parseEther("1"));

    // console.log(ethers.utils.formatEther(ethers.BigNumber.from(usdcToBuy)));

    // Approve the presale to spend the required amount of USDC
    await usdc.connect(buyer1).approve(presale.address, usdcToBuy);

    // Set whitelist member
    await presale.whitelistAddresses([buyer1.address]);

    // Perform the token purchase
    await presale.connect(buyer1).buyTokens(tokensToBuy, false, {
      value: usdcToBuy,
    });

    expect(await usdc.balanceOf(presale.address)).to.be.equal(usdcToBuy);
  });
  // 16. Test that the claimEnabled modifier correctly throws an error if claiming is not enabled.
  // 17. Test that the claimEnabled modifier allows the function to be executed if claiming is enabled.
  // 18. Test that the tokensClaimed event is emitted correctly.
  // 19. Test that the tokensPurchased event is emitted correctly.
});
