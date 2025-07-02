// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract GMNTMarketplace is Ownable {
    using SafeERC20 for IERC20;

    uint256 public tokenPrice = 2e16; // 0.02 Ether per GMNT
    uint256 public sellerCount = 1;
    uint256 public buyerCount = 1;
    uint public prevAdjustedRatio;
    IERC20 public gmntToken;

    event TokenPriceUpdated(uint256 newPrice);
    event TokenBought(address indexed buyer, uint256 amount, uint256 totalCost);
    event TokenSold(address indexed seller, uint256 amount,uint256 totalEarned);
    event TokensWithdrawn(address indexed owner, uint256 amount);
    event EtherWithdrawn(address indexed owner, uint256 amount);
    event CalculateTokenPrice(uint256 priceToPay);

    constructor(address _gmntToken) Ownable(msg.sender) {
        gmntToken = IERC20(_gmntToken);
    }

    function adjustTokenPriceBasedOnDemand() public {
        uint marketDemandRatio = (buyerCount * 1e18) / sellerCount;
        uint smoothingFactor = 1e18;
        uint adjustedRatio = (marketDemandRatio + smoothingFactor) / 2;

        if (prevAdjustedRatio != adjustedRatio) {
            prevAdjustedRatio = adjustedRatio;
            uint newTokenPrice = (tokenPrice * adjustedRatio) / 1e18;
            uint minimumPrice = 2e16;

            if (newTokenPrice < minimumPrice) {
                tokenPrice = minimumPrice;
            } else {
                tokenPrice = newTokenPrice;
            }

            emit TokenPriceUpdated(tokenPrice);
        }
    }

    function calculateTokenPrice(uint _amountOfToken) public returns (uint) {
        require(_amountOfToken > 0, "Amount Of Token must be > 0");
        adjustTokenPriceBasedOnDemand();
        uint amountToPay = (_amountOfToken * tokenPrice) / 1e18;
        console.log("amountToPay", amountToPay);
        emit CalculateTokenPrice(amountToPay);
        return amountToPay;
    }

    function buyGMNTToken(uint256 _amountOfToken) public payable {
        require(_amountOfToken > 0, "Invalid Token amount");

        uint requiredTokenPrice = calculateTokenPrice(_amountOfToken);
        console.log("requiredTokenPrice", requiredTokenPrice);
        require(requiredTokenPrice == msg.value, "Incorrect Ether sent");

        buyerCount++;
        gmntToken.safeTransfer(msg.sender, _amountOfToken);

        emit TokenBought(msg.sender, _amountOfToken, requiredTokenPrice);
    }

    function sellGMNTToken(uint256 _amountOfToken) public {
        require(
            gmntToken.balanceOf(msg.sender) >= _amountOfToken,
            "Insufficient token balance"
        );

        sellerCount++;
        uint priceToPay = calculateTokenPrice(_amountOfToken);

        gmntToken.safeTransferFrom(msg.sender, address(this), _amountOfToken);
        (bool success, ) = payable(msg.sender).call{value: priceToPay}("");
        require(success, "Ether transfer failed");

        emit TokenSold(msg.sender, _amountOfToken, priceToPay);
    }

    function withdrawTokens(uint256 _amount) public onlyOwner {
        require(
            gmntToken.balanceOf(address(this)) >= _amount,
            "Not enough tokens"
        );
        gmntToken.safeTransfer(msg.sender, _amount);
        emit TokensWithdrawn(msg.sender, _amount);
    }

    function withdrawEther(uint256 _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Not enough Ether");
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Ether withdrawal failed");
        emit EtherWithdrawn(msg.sender, _amount);
    }

    receive() external payable {}
}