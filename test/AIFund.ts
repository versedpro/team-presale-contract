import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("AIFund contract", function () {
  let AIFund;
  let aifund: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let devTo: SignerWithAddress;
  let aifArbPair: SignerWithAddress;
  let burnAddress: string;

  const maxSupply = ethers.utils.parseEther("10000000");

  beforeEach(async function () {
    [owner, addr1, addr2, devTo, aifArbPair] = await ethers.getSigners();
    burnAddress = "0x000000000000000000000000000000000000dEaD";

    AIFund = await ethers.getContractFactory("AIFund");
    aifund = await AIFund.connect(owner).deploy(
      devTo.address,
      aifArbPair.address
    );

    await aifund.deployed();
  });

  it("should deploy correctly", async function () {
    expect(aifund.address).to.not.equal(0);
    expect(await aifund.totalSupply()).to.equal(maxSupply);
    expect(await aifund.name()).to.equal("AI Fund");
    expect(await aifund.symbol()).to.equal("AIF");
  });

  it("should transfer tokens correctly", async function () {
    const amount = ethers.utils.parseEther("1000");
    await aifund.connect(owner).transfer(addr1.address, amount);

    expect(await aifund.balanceOf(owner.address)).to.equal(
      maxSupply.sub(amount)
    );
    expect(await aifund.balanceOf(addr1.address)).to.equal(amount);
  });

  it("should not allow transferring more than balance", async function () {
    const amount = ethers.utils.parseEther("1000");
    await expect(
      aifund.connect(owner).transfer(addr1.address, maxSupply.add(amount))
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("should not allow transferring to zero address", async function () {
    const amount = ethers.utils.parseEther("1000");
    await expect(
      aifund.connect(owner).transfer(ethers.constants.AddressZero, amount)
    ).to.be.revertedWith("ERC20: transfer to the zero address");
  });

  it("should approve and transferFrom correctly", async function () {
    const amount = ethers.utils.parseEther("1000");
    await aifund.connect(owner).approve(addr1.address, amount);
    await aifund
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, amount);

    expect(await aifund.balanceOf(owner.address)).to.equal(
      maxSupply.sub(amount)
    );
    expect(await aifund.balanceOf(addr2.address)).to.equal(amount);
    expect(await aifund.allowance(owner.address, addr1.address)).to.equal(0);
  });

  it("should not allow transferring from without approval", async function () {
    const amount = ethers.utils.parseEther("1000");
    await expect(
      aifund.connect(addr1).transferFrom(owner.address, addr2.address, amount)
    ).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("should transfer tokens from the AIF-ETH pair to a user with a burn fee", async function () {
    // Let's say AIF-ARB pool has 1000 AIF
    await aifund
      .connect(owner)
      .transfer(aifArbPair.address, ethers.utils.parseEther("1000"));

    // Get the initial balances of the AIF-ETH pair, the user and the burn address
    const initialPairBalance = await aifund.balanceOf(aifArbPair.address);
    const initialUserBalance = await aifund.balanceOf(addr1.address);
    const initialBurnBalance = await aifund.balanceOf(burnAddress);

    // Transfer 10 tokens from the AIF-ETH pair to the user
    await aifund
      .connect(aifArbPair)
      .transfer(addr1.address, ethers.utils.parseEther("10"));

    // Get the final balances of the AIF-ETH pair, the user and the burn address
    const finalPairBalance = await aifund.balanceOf(aifArbPair.address);
    const finalUserBalance = await aifund.balanceOf(addr1.address);
    const finalBurnBalance = await aifund.balanceOf(burnAddress);

    // Calculate the expected values of the balances after the transfer
    const expectedPairBalance = initialPairBalance.sub(
      ethers.utils.parseEther("10")
    );
    const expectedUserBalance = initialUserBalance.add(
      ethers.utils.parseEther("9.9")
    ); // 10 - 1% burn fee
    const expectedBurnBalance = initialBurnBalance.add(
      ethers.utils.parseEther("0.1")
    ); // 1% burn fee

    // Check that the balances match the expected values
    expect(finalPairBalance).to.equal(expectedPairBalance);
    expect(finalUserBalance).to.equal(expectedUserBalance);
    expect(finalBurnBalance).to.equal(expectedBurnBalance);
  });

  it("should transfer tokens from a user to the AIF-ETH pair with a dev fee", async function () {
    // Assume addr1 has 1000 AIFs
    await aifund
      .connect(owner)
      .transfer(addr1.address, ethers.utils.parseEther("1000"));

    // Get the initial balances of the user, the AIF-ETH pair and the dev address
    const initialUserBalance = await aifund.balanceOf(addr1.address);
    const initialPairBalance = await aifund.balanceOf(aifArbPair.address);
    const initialDevBalance = await aifund.balanceOf(devTo.address);

    // Transfer 10 tokens from the user to the AIF-ETH pair
    await aifund
      .connect(addr1)
      .transfer(aifArbPair.address, ethers.utils.parseEther("10"));

    // Get the final balances of the user, the AIF-ETH pair and the dev address
    const finalUserBalance = await aifund.balanceOf(addr1.address);
    const finalPairBalance = await aifund.balanceOf(aifArbPair.address);
    const finalDevBalance = await aifund.balanceOf(devTo.address);

    // Calculate the expected values of the balances after the transfer
    const expectedUserBalance = initialUserBalance.sub(
      ethers.utils.parseEther("10")
    );
    const expectedPairBalance = initialPairBalance.add(
      ethers.utils.parseEther("9.9")
    ); // 10 - 1% dev fee
    const expectedDevBalance = initialDevBalance.add(
      ethers.utils.parseEther("0.1")
    ); // 1% dev fee

    // Check that the balances match the expected values
    expect(finalUserBalance).to.equal(expectedUserBalance);
    expect(finalPairBalance).to.equal(expectedPairBalance);
    expect(finalDevBalance).to.equal(expectedDevBalance);
  });
});
