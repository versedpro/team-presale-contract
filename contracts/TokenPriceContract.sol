// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract TokenPriceContract is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    int public price;
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    constructor() {
        setPublicChainlinkToken();
        oracle = 0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB; // Replace with the address of your Arbitrum oracle contract
        jobId = "29fa9aa13bf1468788b7cc4a500a45b8"; // Replace with the Job ID of your price feed
        fee = 0.1 * 10 ** 18; // 0.1 LINK (adjust this value according to the oracle service you are using)
    }

    function requestPriceData() public returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillPriceData.selector
        );
        request.addBytes(
            "get",
            "https://api.coingecko.com/api/v3/simple/price?ids=my-native-token&vs_currencies=usd"
        ); // Replace with the URL of your price feed
        request.add("path", "my-native-token.usd");
        request.addInt("times", 100000000); // Multiply by 10^8 to convert to wei
        return sendChainlinkRequestTo(oracle, request, fee);
    }

    function fulfillPriceData(
        bytes32 requestId,
        int256 _price
    ) public recordChainlinkFulfillment(requestId) {
        price = _price;
    }
}
