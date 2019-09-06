pragma solidity >=0.5.0 <0.6.0;

contract mTKNDomain {

    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct EIP712Domain {
        string  name;
        string  version;
        uint256 chainId;
        address verifyingContract;
    }

    struct mTransfer {
        address signer;
        address recipient;
        uint256 amount;
        uint256 nonce;
        uint256 gasLimit;
        uint256 gasPrice;
        uint256 reward;
    }

    struct mApprove {
        address signer;
        address spender;
        uint256 amount;
        uint256 nonce;
        uint256 gasLimit;
        uint256 gasPrice;
        uint256 reward;
    }

    struct mTransferFrom {
        address signer;
        address sender;
        address recipient;
        uint256 amount;
        uint256 nonce;
        uint256 gasLimit;
        uint256 gasPrice;
        uint256 reward;
    }

    bytes32 constant EIP712DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 constant MTRANSFER_TYPEHASH = keccak256(
        "mTransfer(address signer,address recipient,uint256 amount,uint256 nonce,uint256 gasLimit,uint256 gasPrice,uint256 reward)"
    );

    bytes32 constant MAPPROVE_TYPEHASH = keccak256(
        "mApprove(address signer,address spender,uint256 amount,uint256 nonce,uint256 gasLimit,uint256 gasPrice,uint256 reward)"
    );

    bytes32 constant MTRANSFERFROM_TYPEHASH = keccak256(
        "mTransferFrom(address signer,address sender,address recipient,uint256 amount,uint256 nonce,uint256 gasLimit,uint256 gasPrice,uint256 reward)"
    );

    bytes32 DOMAIN_SEPARATOR;

    constructor (string memory domain_name) public {
        DOMAIN_SEPARATOR = hash(EIP712Domain({
            name: domain_name,
            version: '1',
            chainId: 1,
            verifyingContract: address(this)
            }));
    }

    function hash(EIP712Domain memory eip712Domain) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                EIP712DOMAIN_TYPEHASH,
                keccak256(bytes(eip712Domain.name)),
                keccak256(bytes(eip712Domain.version)),
                eip712Domain.chainId,
                eip712Domain.verifyingContract
            ));
    }

    function hash(mTransfer memory transfer) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                MTRANSFER_TYPEHASH,
                transfer.signer,
                transfer.recipient,
                transfer.amount,
                transfer.nonce,
                transfer.gasLimit,
                transfer.gasPrice,
                transfer.reward
            ));
    }

    function hash(mApprove memory approve) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                MAPPROVE_TYPEHASH,
                approve.signer,
                approve.spender,
                approve.amount,
                approve.nonce,
                approve.gasLimit,
                approve.gasPrice,
                approve.reward
            ));
    }

    function hash(mTransferFrom memory transfer_from) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                MTRANSFERFROM_TYPEHASH,
                transfer_from.signer,
                transfer_from.sender,
                transfer_from.recipient,
                transfer_from.amount,
                transfer_from.nonce,
                transfer_from.gasLimit,
                transfer_from.gasPrice,
                transfer_from.reward
            ));
    }


    function verify(mTransfer memory transfer, Signature memory signature) internal view returns (bool) {
        // Note: we need to use `encodePacked` here instead of `encode`.
        bytes32 digest = keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                hash(transfer)
            ));
        return ecrecover(digest, signature.v, signature.r, signature.s) == transfer.signer;
    }

    function verify(mApprove memory approve, Signature memory signature) internal view returns (bool) {
        // Note: we need to use `encodePacked` here instead of `encode`.
        bytes32 digest = keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                hash(approve)
            ));
        return ecrecover(digest, signature.v, signature.r, signature.s) == approve.signer;
    }

    function verify(mTransferFrom memory transfer_from, Signature memory signature) internal view returns (bool) {
        // Note: we need to use `encodePacked` here instead of `encode`.
        bytes32 digest = keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                hash(transfer_from)
            ));
        return ecrecover(digest, signature.v, signature.r, signature.s) == transfer_from.signer;
    }

}
