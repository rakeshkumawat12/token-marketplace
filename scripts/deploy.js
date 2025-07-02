const hardhatEnv = require("hardhat");

async function main() {
  const [deployer] = await hardhatEnv.ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  // Deploy Token
  const Token = await hardhatEnv.ethers.getContractFactory("GMNTToken");
  const initialSupply = hardhatEnv.ethers.parseUnits("1000", 0); // No decimals
  const token = await Token.deploy(initialSupply);
  await token.waitForDeployment();
  console.log("Token deployed to:", token.target);

  // Deploy Marketplace
  const TokenMarketPlace = await hardhatEnv.ethers.getContractFactory("GMNTMarketplace");
  const market = await TokenMarketPlace.deploy(token.target);
  await market.waitForDeployment();
  console.log("TokenMarketPlace deployed to:", market.target);

  // Transfer tokens to marketplace
  const tx = await token.transfer(market.target, 500);
  await tx.wait();
  console.log("Transferred 500 tokens to the marketplace.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});