// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Presale is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    AggregatorV3Interface internal priceFeed;

    struct Phase {
        uint256 tokensAvailable;
        uint256 tokensSold;
        uint256 tokenPrice;
        uint256 minPurchase;
        uint256 maxPurchase;
    }

    mapping(uint256 => Phase) public phases;
    mapping(address => bool) public whitelist; // Addresses whitelisted for Phase 0
    mapping(address => uint256) public balances; // Balances of buyers

    IERC20 public token; // The token being sold
    IERC20 public weth;
    IERC20 public usdc;
    uint256 public totalTokens = 0; // Total number of tokens for sale
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

    constructor(
        IERC20 _token,
        uint256 _endTime,
        IERC20 _weth,
        IERC20 _usdc,
        address _priceFeed
    ) {
        // Aggregator: ETH/USD
        priceFeed = AggregatorV3Interface(_priceFeed);

        token = _token;
        totalTokens = 5000000000000000000000000; // 5000000 token
        endTime = _endTime;
        weth = _weth;
        usdc = _usdc;

        // Phase 0
        phases[0] = Phase({
            minPurchase: 3000000000000000000, // 3 token for test
            // minPurchase: 300000000000000000000, // 300 token,
            maxPurchase: 2500000000000000000000, // 2500 token,
            tokensAvailable: 1500000000000000000000000, // 1500000 token,
            tokenPrice: 400000000000000000, // 0.4 USD,
            tokensSold: 0
        });

        // Phase 1
        phases[1] = Phase({
            minPurchase: 3000000000000000000, // 3 token for test
            // minPurchase: 300000000000000000000, // 300 token,
            maxPurchase: 5000000000000000000000, // 5000 token,
            tokensAvailable: 875000000000000000000000, // 875000 token,
            tokenPrice: 440000000000000000, // 0.44 USD,
            tokensSold: 0
        });

        // Phase 2
        phases[2] = Phase({
            minPurchase: 2000000000000000000, // 2 token for test
            // minPurchase: 200000000000000000000, // 200 token
            maxPurchase: 7500000000000000000000, // 7500 token,
            tokensAvailable: 875000000000000000000000, // 875000 token,
            tokenPrice: 460000000000000000, // 0.46 USD,
            tokensSold: 0
        });

        // Phase 3
        phases[3] = Phase({
            minPurchase: 2000000000000000000, // 2 token for test
            // minPurchase: 200000000000000000000, // 200 token
            maxPurchase: 7500000000000000000000, // 7500 token,
            tokensAvailable: 875000000000000000000000, // 875000 token,
            tokenPrice: 480000000000000000, // 0.48 USD,
            tokensSold: 0
        });

        // Phase 4
        phases[4] = Phase({
            minPurchase: 1000000000000000000, // 1 token for test
            // minPurchase: 100000000000000000000, // 100 token
            maxPurchase: 10000000000000000000000, // 10000 token,
            tokensAvailable: 875000000000000000000000, // 875000 token,
            tokenPrice: 500000000000000000, // 0.5 USD,
            tokensSold: 0
        });
    }

    /**
     * Returns the latest price.
     */
    function getETHLatestPrice() public view returns (uint256) {
        // prettier-ignore
        (
            /* uint80 roundID */,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        // ETH has 8 decimals
        return (uint256(price) * 10 ** 18) / 10 ** 8;
    }

    // Whitelist function for Phase 0
    function whitelistAddresses(
        address[] calldata _addresses
    ) external onlyOwner {
        for (uint256 i = 0; i < _addresses.length; i++) {
            require(
                _addresses[i] != address(0),
                "Whitelist address must be valid"
            );

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

    function buyTokens(
        uint256 _amount,
        bool _isWithWETH
    ) public payable nonReentrant {
        require(
            block.timestamp < endTime || currentPhase < 5,
            "Presale has ended"
        );
        require(
            whitelist[msg.sender] || currentPhase > 0,
            "You are not whitelisted"
        );

        uint256 tokensToBuy = _amount;
        require(tokensToBuy > 0, "Invalid amount");

        // Check if investor is within the min/max range for the current phase
        uint256 min = phases[currentPhase].minPurchase;
        uint256 max = phases[currentPhase].maxPurchase;
        uint256 currentBalance = balances[msg.sender] + tokensToBuy;

        require(
            phases[currentPhase].tokensSold + tokensToBuy <=
                phases[currentPhase].tokensAvailable,
            "Insufficient token amount"
        );

        require(_amount >= min, "Amount is below minimum purchase");
        require(
            max == 0 || _amount <= max,
            "Amount is above maximum purchase"
        );

        if (_isWithWETH) {
            // Transfer WETH from buyer to presale contract
            uint256 wethAllowance = weth.allowance(msg.sender, address(this));
            require(
                wethAllowance >=
                    (tokensToBuy * phases[currentPhase].tokenPrice) /
                        getETHLatestPrice(),
                "Insufficient WETH allowance"
            );

            bool transferSuccess = weth.transferFrom(
                msg.sender,
                address(this),
                (tokensToBuy * phases[currentPhase].tokenPrice) /
                    getETHLatestPrice()
            );
            require(transferSuccess, "WETH transfer failed");
        } else {
            // Transfer USDC from buyer to presale contract
            uint256 usdtAllowance = usdc.allowance(msg.sender, address(this));
            require(
                usdtAllowance >=
                    (tokensToBuy * phases[currentPhase].tokenPrice) / 10 ** 18,
                "Insufficient USDC allowance"
            );

            bool transferSuccess = usdc.transferFrom(
                msg.sender,
                address(this),
                (tokensToBuy * phases[currentPhase].tokenPrice) / 10 ** 18
            );
            require(transferSuccess, "USDC transfer failed");
        }

        // Update investor's investment amount and total amount raised
        balances[msg.sender] = currentBalance;

        phases[currentPhase].tokensSold += tokensToBuy;

        emit TokensPurchased(
            msg.sender,
            tokensToBuy,
            phases[currentPhase].tokenPrice
        );
    }

    function claimTokens(
        uint256 _timestamp
    ) external nonReentrant claimEnabled {
        require(
            block.timestamp > endTime && _timestamp > endTime,
            "Presale is still ongoing"
        );
        uint256 balance = balances[msg.sender] * 10 ** 18;
        require(balance > 0, "No tokens to claim");

        balances[msg.sender] = 0;
        token.transfer(msg.sender, balance);

        emit TokensClaimed(msg.sender, balance);
    }

    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawWeth(address _masterWallet) external onlyOwner {
        require(
            _masterWallet != address(0),
            "Walelt address should be valid address"
        );

        weth.safeTransfer(_masterWallet, weth.balanceOf(address(this)));
    }

    function withdrawUsdc(address _masterWallet) external onlyOwner {
        require(
            _masterWallet != address(0),
            "Walelt address should be valid address"
        );

        usdc.safeTransfer(_masterWallet, usdc.balanceOf(address(this)));
    }
}
