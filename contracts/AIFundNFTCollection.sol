// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./library/ERC721R.sol";

contract AIFundNFTCollection is ERC721r {
    string public tokenURIPrefix;

    // 5_000 is the number of tokens in the colletion
    constructor(
        string memory _tokenURIPrefix
    ) ERC721r("AI Fund NFT Collection", "AIFNFT", 5_000) {
        tokenURIPrefix = _tokenURIPrefix;
    }

    function mint(uint quantity) public {
        _mintRandom(msg.sender, quantity);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string(
                    abi.encodePacked(
                        baseURI,
                        tokenId < 4500 ? "silver" : "gold"
                    )
                )
                : "";
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return tokenURIPrefix;
    }
}
