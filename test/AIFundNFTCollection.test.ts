import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("AIFundNFTCollection", function () {
  let nftCollection: any;
  let owner: SignerWithAddress;
  let buyer1: SignerWithAddress;
  let buyer2: SignerWithAddress;

  beforeEach(async function () {
    [owner, buyer1, buyer2] = await ethers.getSigners();
    const NFTCollection = await ethers.getContractFactory(
      "AIFundNFTCollection"
    );
    nftCollection = await NFTCollection.deploy("https://api.example.com/");
    await nftCollection.deployed();
  });

  it("should be configured with correct params", async function () {
    const maxSupply = await nftCollection.maxSupply();
    expect(ethers.BigNumber.from(maxSupply)).to.equal(5000);
  });

  it("should mint NFTs correctly", async function () {
    const initialBalance = await nftCollection.balanceOf(buyer1.address);
    const quantity = 3;
    const mintPrice = ethers.BigNumber.from(await nftCollection.mintPrice());
    await nftCollection
      .connect(buyer1)
      .mint(quantity, { value: mintPrice.mul(quantity) });
    const finalBalance = await nftCollection.balanceOf(buyer1.address);
    expect(finalBalance).to.equal(initialBalance.add(quantity));
  });

  it("should sell NFTs with correct price", async function () {
    const quantity = 5;
    const mintPrice = ethers.BigNumber.from(await nftCollection.mintPrice());
    const totalPrice = mintPrice.mul(quantity);

    const oldBalanceOfNft = await ethers.provider.getBalance(
      nftCollection.address
    );

    await nftCollection.connect(buyer1).mint(quantity, {
      value: totalPrice,
    });

    expect(await ethers.provider.getBalance(nftCollection.address)).to.equal(
      oldBalanceOfNft.add(totalPrice)
    );
  });

  it("should mint random NFTs", async function () {
    const quantity = 10;
    let tokenIdsBigNumber: BigNumber[] = [];
    let tokenIds: Number[] = [];
    const mintPrice = ethers.BigNumber.from(await nftCollection.mintPrice());
    // Mint NFTs
    await nftCollection.mint(quantity, { value: mintPrice.mul(quantity) });
    // Store the minted token IDs
    // for (let i = 0; i < quantity; i++) {
    //   tokenIds.push(await nftCollection.tokenOfOwnerByIndex(buyer1.address));
    // }
    tokenIdsBigNumber = await nftCollection.tokenOf(owner.address);
    for (let i = 0; i < quantity; i++) {
      tokenIds[i] = ethers.BigNumber.from(tokenIdsBigNumber[i]).toNumber();
    }
    // Check if token IDs are unique
    const uniqueIds = new Set(tokenIds);
    expect(uniqueIds.size).to.equal(quantity);

    expect(
      tokenIds.every((num, index) => index === 0 || num <= tokenIds[index - 1])
    ).to.equal(false);
  });

  it("should return the correct token URI", async function () {
    const mintPrice = ethers.BigNumber.from(await nftCollection.mintPrice());
    await nftCollection.mint(1, { value: mintPrice.mul(1) });
    const tokenId = (await nftCollection.tokenOf(owner.address))[0];
    const expectedURI = `https://api.example.com/${
      tokenId < 4500 ? "silver" : "gold"
    }`;
    const actualURI = await nftCollection.tokenURI(tokenId);
    expect(actualURI).to.equal(expectedURI);
  });
});
