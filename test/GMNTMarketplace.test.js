const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GMNTMarketplace", function () {
  let token, market, owner, user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const GMNTToken = await ethers.getContractFactory("GMNTToken");
    token = await GMNTToken.deploy(1000);
    await token.waitForDeployment();

    const GMNTMarketplace = await ethers.getContractFactory("GMNTMarketplace");
    market = await GMNTMarketplace.deploy(token.target);
    await market.waitForDeployment();

    // Transfer tokens to marketplace
    await token.transfer(market.target, 500);
  });

  it("should have token price set", async () => {
    expect(await market.tokenPrice()).to.equal(ethers.parseUnits("0.02", "ether"));
  });

  it("should allow user to buy tokens", async () => {
    const amount = 5;
    const cost = ethers.parseUnits("0.02", "ether") * BigInt(amount);

    await market.connect(user).buyGMNTToken(amount, { value: cost });

    expect(await token.balanceOf(user.address)).to.equal(amount);
  });

  it("should fail if user sends incorrect ETH", async () => {
    await expect(
      market.connect(user).buyGMNTToken(5, { value: ethers.parseEther("0.01") })
    ).to.be.revertedWith("Incorrect token price paid");
  });

  it("should allow user to sell tokens and get ETH back", async () => {
    const amount = 5;
    const cost = ethers.parseUnits("0.02", "ether") * BigInt(amount);

    // Buy tokens first
    await market.connect(user).buyGMNTToken(amount, { value: cost });

    // Approve marketplace to spend tokens
    await token.connect(user).approve(market.target, amount);

    const beforeBalance = await ethers.provider.getBalance(user.address);

    const tx = await market.connect(user).sellGMNTToken(amount);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const afterBalance = await ethers.provider.getBalance(user.address);
    const expectedRefund = BigInt(cost);
    const actualChange = afterBalance - beforeBalance + gasUsed;

    expect(actualChange).to.be.closeTo(expectedRefund, ethers.parseEther("0.001")); // within 0.001 ETH
  });

  it("should allow owner to withdraw tokens", async () => {
    await market.withdrawTokens(100);
    expect(await token.balanceOf(owner.address)).to.equal(600); // 100 withdrawn from market
  });

  it("should allow owner to withdraw Ether", async () => {
    const amount = ethers.parseUnits("0.02", "ether") * BigInt(10);
    await market.connect(user).buyGMNTToken(10, { value: amount });

    const contractEth = await ethers.provider.getBalance(market.target);
    expect(contractEth).to.equal(amount);

    const before = await ethers.provider.getBalance(owner.address);
    const tx = await market.withdrawEther(amount);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const after = await ethers.provider.getBalance(owner.address);

    expect(after - before + gasUsed).to.equal(amount);
  });
});