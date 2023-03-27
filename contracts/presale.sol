// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract Presale is Ownable {
    using SafeERC20 for IERC20;

    AggregatorV3Interface internal priceFeed;

    struct Phase {
        uint256 tokensAvailable;
        uint256 tokensSold;
        uint256 tokenPrice;
        uint256 minPurchase;
        uint256 maxPurchase;
        bool isStarted;
    }

    mapping(uint256 => Phase) public phases;
    mapping(address => bool) public whitelist; // Addresses whitelisted for Phase 0
    mapping(address => uint256) public balances; // Balances of buyers

    IERC20 public token; // The token being sold
    uint256 public totalTokens = 0; // Total number of tokens for sale
    uint256 public tokensSold; // Number of tokens sold so far
    uint256 public endTime; // End time of presale
    uint256 public currentPhase = 0;

    bool public claimingEnabled = false;

    event TokensPurchased(
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice
    );
    event TokensClaimed(address indexed buyer, uint256 amount);
    event ClaimingEnabled(bool enabled);
    event Whitelisted(address indexed account);

    modifier claimEnabled() {
        require(claimingEnabled, "Claiming is currently disabled");
        _;
    }

    constructor(IERC20 _token, uint256 _endTime) {
        // Aggregator: DAI/USD
        priceFeed = AggregatorV3Interface(
            0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
        );

        token = _token;
        totalTokens = 5000000;
        endTime = _endTime;

        // Phase 0
        phases[0] = Phase({
            minPurchase: 300,
            maxPurchase: 2500,
            tokensAvailable: 1500000,
            tokenPrice: 40,
            tokensSold: 0,
            isStarted: true
        });

        // Phase 1
        phases[1] = Phase({
            minPurchase: 300,
            maxPurchase: 5000,
            tokensAvailable: 875000,
            tokenPrice: 44,
            tokensSold: 0,
            isStarted: true
        });

        // Phase 2
        phases[2] = Phase({
            minPurchase: 200,
            maxPurchase: 7500,
            tokensAvailable: 875000,
            tokenPrice: 46,
            tokensSold: 0,
            isStarted: true
        });

        // Phase 3
        phases[3] = Phase({
            minPurchase: 200,
            maxPurchase: 7500,
            tokensAvailable: 875000,
            tokenPrice: 48,
            tokensSold: 0,
            isStarted: true
        });

        // Phase 4
        phases[4] = Phase({
            minPurchase: 100,
            maxPurchase: 10000,
            tokensAvailable: 875000,
            tokenPrice: 50,
            tokensSold: 0,
            isStarted: true
        });
    }

    /**
     * Returns the latest price.
     */
    function getLatestPrice() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundID */,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        return price;
    }

    // Whitelist function for Phase 0
    function whitelistAddresses(
        address[] calldata _addresses
    ) external onlyOwner {
        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelist[_addresses[i]] = true;
            emit Whitelisted(_addresses[i]);
        }
    }

    function getCurrentPhase() public view returns (Phase memory) {
        return phases[currentPhase];
    }

    function setCurrentPhase(uint256 _phase) external onlyOwner {
        require(_phase < 5, "Invalid phase number");
        currentPhase = _phase;
    }

    function enableClaiming(bool _enabled) external onlyOwner {
        claimingEnabled = _enabled;
        emit ClaimingEnabled(_enabled);
    }

    function getTokenAmount() internal returns (uint256) {
        require(msg.value > 0, "Invalid amount");
        // require(block.timestamp < presaleEndTime, "Presale has ended");

        // uint256 amount = _value.mul(exchangeRate);
        // balances[_sender] = balances[_sender].add(amount);
        // totalNativeTokenRaised = totalNativeTokenRaised.add(_value);

        return 1;
    }

    function buyTokens() public payable claimEnabled {
        require(currentPhase < 5, "Presale has ended");
        require(
            whitelist[msg.sender] || currentPhase > 0,
            "You are not whitelisted"
        );

        uint256 tokensToBuy = getTokenAmount();
        require(tokensToBuy > 0, "Invalid amount");

        // Check if investor is within the min/max range for the current phase
        uint256 min = phases[currentPhase].minPurchase;
        uint256 max = phases[currentPhase].maxPurchase;
        uint256 currentBalance = balances[msg.sender] + tokensToBuy;

        require(currentBalance >= min, "Amount is below minimum purchase");
        require(
            max == 0 || currentBalance <= max,
            "Amount is above maximum purchase"
        );

        // Transfer USDT from buyer to presale contract
        uint256 usdtAmount = token.allowance(msg.sender, address(this));
        require(
            usdtAmount >= tokensToBuy * phases[currentPhase].tokenPrice,
            "Insufficient USDT allowance"
        );

        bool transferSuccess = token.transferFrom(
            msg.sender,
            address(this),
            tokensToBuy * phases[currentPhase].tokenPrice
        );
        require(transferSuccess, "USDT transfer failed");

        // Update investor's investment amount and total amount raised
        balances[msg.sender] = currentBalance;
        // totalRaised = totalRaised.add(msg.value);

        emit TokensPurchased(
            msg.sender,
            tokensToBuy,
            phases[currentPhase].tokenPrice
        );
    }

    function claimTokens() external claimEnabled {
        require(block.timestamp > endTime, "Presale is still ongoing");
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No tokens to claim");

        balances[msg.sender] = 0;
        token.transfer(msg.sender, balance);

        emit TokensClaimed(msg.sender, balance);
    }

    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
