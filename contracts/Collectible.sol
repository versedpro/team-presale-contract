// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Collectible is
    IERC2981,
    ERC165Storage,
    Ownable,
    ERC1155,
    ERC1155URIStorage
{
    using Strings for uint256;
    using SafeMath for uint256;

    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    string public name;
    string public symbol;

    /// @dev royalty percent ex: 100 = 1%, 10000 = 100%
    uint256 public royaltyPercent = 0;

    /// @dev royalty address
    address public immutable defaultRoyalty;
    mapping(uint256 => address) public royalty;

    /// @dev mint price
    mapping(uint256 => uint256) public mintPrice;

    /// @dev minted token addresses
    mapping(uint256 => uint256) public balanceForTokenId;

    /// @dev max supply
    mapping(uint256 => uint256) public maxSupply;

    bool public isMintingDisabled;

    //Token URI prefix
    string public tokenURIPrefix;

    event Withdraw(address indexed payoutAddress, uint256 amount);
    event Mint(
        address indexed to,
        uint256 tokenId,
        uint256 amount,
        uint256 pricePaid
    );

    /// @notice Constructor Function
    /// @dev
    /// @param _name name of the token ex: Rarible
    /// @param _symbol symbol of the token ex: RARI
    /// @param _tokenURIPrefix token URI Prefix
    /// @param _royalty address which charges creator fee
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _tokenURIPrefix,
        address _royalty
    ) ERC1155(_tokenURIPrefix) {
        name = _name;
        symbol = _symbol;
        tokenURIPrefix = _tokenURIPrefix;
        defaultRoyalty = _royalty;
        isMintingDisabled = false;
        _registerInterface(_INTERFACE_ID_ERC2981);

        maxSupply[0] = 500;
        maxSupply[1] = 4500;
    }

    /// @dev burn token with id and value
    /// @param _owner address where mint to
    /// @param _id token Id which will burn
    /// @param _value token count which will burn
    function burn(address _owner, uint256 _id, uint256 _value) external {
        require(
            _owner == msg.sender ||
                isApprovedForAll(_owner, msg.sender) == true,
            "Need operator approval for 3rd party burns."
        );

        _burn(_owner, _id, _value);
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    /// @notice sets URI and makes the ERC1155 OpenSea compatiable
    /// @dev function which return token URI
    /// @param _id token Id
    function uri(
        uint256 _id
    )
        public
        view
        virtual
        override(ERC1155, ERC1155URIStorage)
        returns (string memory)
    {
        return
            bytes(tokenURIPrefix).length > 0
                ? string(abi.encodePacked(tokenURIPrefix, _id.toString()))
                : super.uri(_id);
    }

    /// @dev mint function.
    /// @param _beneficiary address where mint to
    function mint(
        address _beneficiary,
        uint256 _id,
        uint256 _count
    ) external payable {
        require(
            msg.value >= mintPrice[_id] * _count,
            "The mint price is not enough"
        );
        require(isMintingDisabled == false, "Minting is disabled");

        if (maxSupply[_id] != 0)
            require(
                _count + balanceForTokenId[_id] <= maxSupply[_id],
                "Token quantity exceeds max supply"
            );

        safeMint(_beneficiary, _id, _count);

        emit Mint(_beneficiary, _id, _count, msg.value);
    }

    /// @dev withdraw all ethers to payout wallet.
    function withdraw(address _payoutAddress) public onlyOwner {
        require(_payoutAddress != address(0), "PayoutAddress should be valid");

        (bool withdrawSuccess, ) = payable(_payoutAddress).call{
            value: address(this).balance
        }("");
        require(withdrawSuccess, "Failed to withdraw");

        emit Withdraw(_payoutAddress, address(this).balance);
    }

    /// @notice Get royalty information
    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    )
        external
        view
        override(IERC2981)
        returns (address receiver, uint256 royaltyAmount)
    {
        receiver = royalty[_tokenId] == address(0)
            ? defaultRoyalty
            : royalty[_tokenId];
        royaltyAmount = _salePrice.mul(royaltyPercent).div(10000);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(IERC165, ERC165Storage, ERC1155) returns (bool) {
        return
            interfaceId == type(IERC1155).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /// @notice Returns the chain id of the current blockchain.
    /// @dev This is used to workaround an issue with ganache returning different values from the on-chain chainid() function and
    ///      the eth_chainId RPC method. See https://github.com/protocol/nft-website/issues/121 for context.
    function getChainID() external view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    function setMintPrice(
        uint256 _tokenId,
        uint256 _mintPrice
    ) external onlyOwner {
        mintPrice[_tokenId] = _mintPrice;
    }

    function setMintingDisabled(bool _value) external onlyOwner {
        isMintingDisabled = _value;
    }

    /// @notice Set max supply for given token Id
    /// @param _tokenId Given token Id
    /// @param _maxSupply Desired max supply
    function setMaxSupply(
        uint256 _tokenId,
        uint256 _maxSupply
    ) external onlyOwner {
        maxSupply[_tokenId] = _maxSupply;
    }

    /// @notice Set max supply for given token Id
    /// @param _royaltyPercent Given royatly percent
    function setRoyaltyPercent(uint256 _royaltyPercent) external onlyOwner {
        royaltyPercent = _royaltyPercent;
    }

    function setInfo(
        uint256 _tokenCount,
        uint256[] memory _mintPrices,
        uint256[] memory _maxSupplies,
        uint256 _royaltyPercent
    ) external onlyOwner {
        for (uint256 i = 1; i <= _tokenCount; ++i) {
            mintPrice[i] = _mintPrices[i];
            maxSupply[i] = _maxSupplies[i];
        }

        royaltyPercent = _royaltyPercent;
    }

    ////////////
    /// Internal functions
    ////////////

    /// @dev Creates a new token type
    /// @param _beneficiary address where mint to
    /// @param _id token Id
    /// @param _supply mint supply
    function safeMint(
        address _beneficiary,
        uint256 _id,
        uint256 _supply
    ) internal {
        require(_supply != 0, "Supply should be positive");

        balanceForTokenId[_id] = balanceForTokenId[_id] + _supply;

        _mint(_beneficiary, _id, _supply, "");
    }
}
