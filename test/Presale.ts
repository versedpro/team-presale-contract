import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Presale", () => {
  let owner: SignerWithAddress;
  let buyer1: SignerWithAddress;
  let buyer2: SignerWithAddress;
  let presale: any;

  beforeEach(async () => {
    [owner, buyer1, buyer2] = await ethers.getSigners();

    const Presale = await ethers.getContractFactory("Presale");
    presale = await Presale
      .deploy
      // Pass in contract constructor arguments here
      ();
  });

  describe("buyTokens", () => {
    it("should allow whitelisted buyer to purchase tokens", async () => {
      // Whitelist buyer1
      await presale.whitelistAddresses([await buyer1.getAddress()]);

      // Approve the token transfer from the buyer1 account
      const token = await presale.token();
      await token.connect(buyer1).approve(presale.address, 2500);

      // Purchase tokens with USDC
      const usdc = await presale.usdc();
      const phase = await presale.getCurrentPhase();
      const amount = phase.minPurchase;
      await usdc.connect(buyer1).approve(presale.address, amount);
      await presale.connect(buyer1).buyTokens(amount, false);

      // Verify that the buyer1 balance has been updated
      const balance = await presale.balances(await buyer1.getAddress());
      expect(balance).to.equal(amount);
    });

    it("should not allow non-whitelisted buyer to purchase tokens", async () => {
      // Approve the token transfer from the buyer2 account
      const token = await presale.token();
      await token.connect(buyer2).approve(presale.address, 2500);

      // Purchase tokens with USDC
      const usdc = await presale.usdc();
      const phase = await presale.getCurrentPhase();
      const amount = phase.minPurchase;
      await usdc.connect(buyer2).approve(presale.address, amount);

      // Attempt to purchase tokens as non-whitelisted buyer2
      await expect(
        presale.connect(buyer2).buyTokens(amount, false)
      ).to.be.revertedWith("You are not whitelisted");
    });
  });

  // Add more tests for other contract functions here
});
