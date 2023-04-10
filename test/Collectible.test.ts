import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Collectible", () => {
  let collectible: any;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const CollectibleFactory = await ethers.getContractFactory(
      "Collectible",
      owner
    );
    collectible = await CollectibleFactory.deploy(
      "MyNFT",
      "MNFT",
      "https://example.com/",
      owner.address
    );
    await collectible.deployed();
  });

  it("should have the correct name and symbol", async () => {
    expect(await collectible.name()).to.equal("MyNFT");
    expect(await collectible.symbol()).to.equal("MNFT");
  });

  it("should be able to mint a new token", async () => {
    const tokenId = 1;
    const amount = 1;
    const price = ethers.utils.parseEther("0.1");

    await collectible.setMintPrice(tokenId, price);
    await expect(() =>
      collectible
        .connect(user)
        .mint(user.address, tokenId, amount, { value: price })
    ).to.changeEtherBalance(user, price.mul(-1));
    expect(await collectible.balanceOf(user.address, tokenId)).to.equal(amount);
  });

  it("should deploy the contract correctly", async () => {
    expect(collectible.address).to.not.be.undefined;
  });

  it("should set the default royalty address correctly", async () => {
    expect(await collectible.defaultRoyalty()).to.equal(owner.address);
  });

  it("should register the ERC2981 interface", async () => {
    const supportsInterface = await collectible.supportsInterface("0x2a55205a");
    expect(supportsInterface).to.be.true;
  });

  it("should mint a new token when called with valid parameters", async () => {
    const id = 1;
    const count = 1;
    const mintPrice = 100;

    await collectible.setMintPrice(id, mintPrice);
    await collectible.setMaxSupply(id, 10);

    await expect(() =>
      collectible.connect(user).mint(user.address, id, count, {
        value: mintPrice,
      })
    )
      .to.changeEtherBalance(user, mintPrice * count)
      .and.changeTokenBalance(collectible, id, count)
      .and.emit(collectible, "Mint")
      .withArgs(user.address, id, count, mintPrice);
  });

  it("should fail to mint a new token when called with invalid parameters", async () => {
    const id = 1;
    const count = 1;
    const mintPrice = 100;

    await collectible.setMintPrice(id, mintPrice);
    await collectible.setMaxSupply(id, 1);

    await collectible.connect(user).mint(user.address, id, count, {
      value: mintPrice,
    });

    await expect(
      collectible.connect(user).mint(user.address, id, count, {
        value: mintPrice,
      })
    ).to.be.revertedWith("Token quantity exceeds max supply");
  });
});
