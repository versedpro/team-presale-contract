// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AIFund is ERC20, Ownable {
    // 10,000,000 tokens
    uint256 public constant maxSupply = 10000000000000000000000000;

    uint256 public buyFee;
    uint256 public sellFee;

    address public devTo;
    address public constant burnAddress =
        0x000000000000000000000000000000000000dEaD;

    IERC20 public aifArbPair;

    constructor(address _devTo, IERC20 _aifArbPair) ERC20("AI Fund", "AIF") {
        require(_devTo != address(0), "Dev address is zero");

        _mint(msg.sender, maxSupply);

        devTo = _devTo;
        aifArbPair = _aifArbPair;

        // Buy Fee is 1%
        buyFee = 1;
        // Sell Fee is 1%
        sellFee = 1;
    }

    function transfer(
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        if (msg.sender == address(aifArbPair)) {
            // To deduct 1% of the transaction value and send it to the burn address
            // if the transfer is from the AIF-ARB pair to the user's wallet
            uint256 burnFee = (amount / 100) * sellFee;
            super.transfer(burnAddress, burnFee);
            super.transfer(recipient, amount - burnFee);
        } else if (recipient == address(aifArbPair)) {
            // Tp deduct 1% of the transaction value and send it to the dev wallet
            // if the transfer is from the user's wallet to the AIF-ARB pair
            uint256 devFee = (amount / 100) * buyFee;
            super.transfer(devTo, devFee);
            super.transfer(recipient, amount - devFee);
        } else {
            super.transfer(recipient, amount);
        }

        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        if (sender == address(aifArbPair)) {
            // To deduct 1% of the transaction value and send it to the burn address
            // if the transfer is from the AIF-ARB pair to the user's wallet
            uint256 burnFee = (amount / 100) * sellFee;
            super.transferFrom(sender, burnAddress, burnFee);
            super.transferFrom(sender, recipient, amount - burnFee);
        } else if (recipient == address(aifArbPair)) {
            // Tp deduct 1% of the transaction value and send it to the dev wallet
            // if the transfer is from the user's wallet to the AIF-ARB pair
            uint256 devFee = (amount / 100) * buyFee;
            super.transferFrom(sender, devTo, devFee);
            super.transferFrom(sender, recipient, amount - devFee);
        } else {
            super.transferFrom(sender, recipient, amount);
        }

        return true;
    }
}
