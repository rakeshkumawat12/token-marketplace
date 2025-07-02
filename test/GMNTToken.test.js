const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GMNTToken", function () {
  let token, owner, user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const GMNTToken = await ethers.getContractFactory("GMNTToken");
    token = await GMNTToken.deploy(1000);
    await token.waitForDeployment();
  });

  it("should have correct name and symbol", async () => {
    expect(await token.name()).to.equal("GoldMint Token");
    expect(await token.symbol()).to.equal("GMNT");
  });

  it("should mint 1000 tokens to owner", async () => {
    expect(await token.balanceOf(owner.address)).to.equal(1000);
  });

  it("should override decimals to 0", async () => {
    expect(await token.decimals()).to.equal(0);
  });

  it("should allow transfer of tokens", async () => {
    await token.transfer(user.address, 100);
    expect(await token.balanceOf(user.address)).to.equal(100);
  });
});