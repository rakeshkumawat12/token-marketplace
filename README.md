# GMNT - GoldMint Token Project

A tokenized gold marketplace built with Solidity and Hardhat.

## Contracts
- `GMNTToken.sol`: ERC20 token with 0 decimals
- `GMNTMarketplace.sol`: Buy/Sell GMNT tokens with price adjustment logic

## Setup

```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network hardhat
```