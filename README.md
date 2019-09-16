<p align="center">
  <img src="https://github.com/ticket721/mTKN/raw/master/assets/logo.png">
</p>

This repository contains the interface for the `mTKN` standard and the initial EIP Draft content.

---

## Introduction

The popularity of meta transactions is rising thanks to actors of the community (Austin Thomas Griffith, the MetaCartel, and many more). ERC-1776 was published in February 2019 by Ronan Sandford to start a standardization process around the implementation of native meta transactions as extensions of well-known standards. I introduce today the beginning of a discussion to create a precise specification for an ERC-20 (only) extension to add native meta transactions; the `mTKN` standard (meta token). This standard should focus on simplicity, and is a major step in the development of standardized relay networks.

## Goal

Use ERC-712 signatures to trigger `transfer`, `transferFrom` or `approve` methods on an ERC-20 token. To do this, we introduce 3 new methods: `signedTransfer`, `signedTransferFrom` and `signedApprove`. Give the ERC-712 signature to anyone willing to put it on the blockchain for you, and it will trigger the required action.

- Setup a standard for wallets and web3 browsers to properly understand these types of signatures and adapt their UI
- Setup a standard for Relays to properly integrate any new tokens following the standard

## Example Use Cases

- **Transfer Tokens without paying for ETH gas**: this a better practice than giving eth to your users so they can make the transactions
- **Pay for gas with the token**: the procotol supports a reward argument that redirects funds to the relayer when signature is properly uploaded.
- **Make your tokens $ETH independent**: Setup a network of relayers (accounts that want to submit signatures for you in exchange of the reward) and the token users will never have to buy ETH to use the token

## Abstract

The following standard describe a set of functions to trigger the `transfer`, `approve` and `transferFrom` mechanism with meta transactions. It introduces 7 new functions:

- `signedTransfer` & its verifier `verifyTransfer` both take the same arguments. The first one is a state-modifying method while the latter is a constant method meant for argument / signature verification purposes.

- `signedApprove` & its verifier `verifyApprove` both take the same arguments. The first one is a state-modifying method while the latter is a constant method meant for argument / signature verification purposes.

- `signedTransferFrom` & its verifier `verifyTransferFrom` both take the same arguments. The first one is a state-modifying method while the latter is a constant method meant for argument / signature verification purposes.

- `nonceOf` is a constant method used to retrieve the current nonce of an account.

## Specification

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

### EIP-712 Types

#### EIP712Domain

This mandatory type MUST be included in the signed payload.

```solidity

    struct EIP712Domain {
        string  name;
        string  version;
        uint256 chainId;
        address verifyingContract;
    }

```

#### mActors

This type describes the extra actors involved in the meta transaction: the **Signer** and the **Relayer**. 

```solidity

    struct mActors {
        address signer;  // Used to check signature validity
        address relayer; // Used to enforce a relayer address. Set to address(0) if no restrictions required
    }

```

#### mTxParams

This type describes transaction parameters & reward parameters.

```solidity

    struct mTxParams {
        uint256 nonce;    // Nonce of the Signer
        uint256 gasLimit; // Wanted gas limit
        uint256 gasPrice; // Wanted gas price
        uint256 reward;   // Amount of token provided as reward to the relayer
    }

```

#### mTransfer

This types describe the main type used to trigger a `transfer`.

```solidity

    struct mTransfer {
        address recipient; // Destination address of the transfer
        uint256 amount;    // Token amount to transfer
        mActors actors;
        mTxParams txparams;
    }

```

#### mApprove

This type describe the main type used to trigger an `approve`.

```solidity

    struct mApprove {
        address spender; // Target address that would benefit from the approval
        uint256 amount;  // Amount of token that the address can manipulate
        mActors actors;
        mTxParams txparams;
    }

```

#### mTransferFrom

This type describe the main type used to trigger an `transferFrom`.

```solidity

    struct mTransferFrom {
        address sender;    // Balance that transfers the tokens
        address recipient; // Destination of the transfer
        uint256 amount;    // Amount to move from sender to recipient
        mActors actors;
        mTxParams txparams;
    }

```

### mTKN methods

#### `nonceOf`

```solidity
    function nonceOf(address account) public view returns (uint256);
```

##### Notes

The nonce is used to prevent attackers from organizing replay attacks.

##### Main Mechanism

Return the current exepected nonce for given `account`.

#### `verifyTransfer`

```solidity
    function verifyTransfer(
        address recipient, uint256 amount,
        address[2] memory actors, uint256[4] memory txparams, bytes memory signature
    ) public view returns (bool);
```

##### Notes

`actors` is an array of `address`es that MUST contain `signer` as `actors[0]` and `relayer` as `actors[1]`.

`txparams` is an array of `uint256` that MUST contain `nonce` as `txparams[0]`, `gasLimit` as `txparams[1]`, `gasPrice` as `txparams[2]` and `reward` as `txparams[3]`.

##### Main Mechanism

Verifies that a transfer to `recipient` from `signer` of `amount` tokens is possible with the provided signature and with current contract state.

##### Checklist

- The function MUST throw if the `mTransfer` payload signature is invalid (resulting signer is different than provided `signer`).

- The function MUST throw if real `nonce` is not high enough to match the `nonce` provided in the `mTransfer` payload.

- The function MUST throw if provided `gas` is not high enough to match the `gasLimit` provided in the `mTransfer` payload. This should be checked as soon as the function starts. (`gasleft() >= gasLimit`)

- The function MUST throw if provided `gasPrice` is not high enough to match the `gasLimit` provided in the `mTransfer` payload. (`tx.gasprice >= gasPrice`)

- The function MUST throw if provided `relayer` is not `address(0)` AND `relayer` is different than `msg.sender`.

- The function SHOULD throw if the `signer`’s account balance does not have enough tokens to spend on transfer and on reward (`balanceOf(signer) >= amount + reward`).

#### `signedTransfer`

```solidity
    function signedTransfer(
        address recipient, uint256 amount,
        address[2] memory actors, uint256[4] memory txparams, bytes memory signature
    ) public returns (bool);
```

##### Notes

`actors` is an array of `address`es that MUST contain `signer` as `actors[0]` and `relayer` as `actors[1]`.

`txparams` is an array of `uint256` that MUST contain `nonce` as `txparams[0]`, `gasLimit` as `txparams[1]`, `gasPrice` as `txparams[2]` and `reward` as `txparams[3]`.

##### Main Mechanism

Transfers `amount` amount of tokens from `signer`'s balance to address `recipient`, and MUST fire the Transfer event. 

##### Checklist

- The function MUST throw if the `mTransfer` payload signature is invalid (resulting signer is different than provided `signer`).

- The function MUST throw if real `nonce` is not high enough to match the `nonce` provided in the `mTransfer` payload.

- The function MUST throw if provided `gas` is not high enough to match the `gasLimit` provided in the `mTransfer` payload. This should be checked as soon as the function starts. (`gasleft() >= gasLimit`)

- The function MUST throw if provided `gasPrice` is not high enough to match the `gasLimit` provided in the `mTransfer` payload. (`tx.gasprice >= gasPrice`)

- The function MUST throw if provided `relayer` is not `address(0)` AND `relayer` is different than `msg.sender`.

- The function SHOULD throw if the `signer`’s account balance does not have enough tokens to spend on transfer and on reward (`balanceOf(signer) >= amount + reward`).


#### `verifyApprove`

```solidity
    function verifyApprove(
        address spender, uint256 amount,
        address[2] memory actors, uint256[4] memory txparams, bytes memory signature
    ) public view returns (bool);
```

##### Notes

`actors` is an array of `address`es that MUST contain `signer` as `actors[0]` and `relayer` as `actors[1]`.

`txparams` is an array of `uint256` that MUST contain `nonce` as `txparams[0]`, `gasLimit` as `txparams[1]`, `gasPrice` as `txparams[2]` and `reward` as `txparams[3]`.
##### Main Mechanism

Verifies that an approval for `spender` of `amount` tokens on `signer`'s balance is possible with the provided signature and with current contract state.

##### Checklist

- The function MUST throw if the `mApprove` payload signature is invalid (resulting signer is different than provided `signer`).

- The function MUST throw if real `nonce` is not high enough to match the `nonce` provided in the `mApprove` payload.

- The function MUST throw if provided `gas` is not high enough to match the `gasLimit` provided in the `mApprove` payload. This should be checked as soon as the function starts. (`gasleft() >= gasLimit`)

- The function MUST throw if provided `gasPrice` is not high enough to match the `gasLimit` provided in the `mApprove` payload. (`tx.gasprice >= gasPrice`)

- The function MUST throw if provided `relayer` is not `address(0)` AND `relayer` is different than `msg.sender`.

- The function SHOULD throw if the `signer`’s account balance does not have enough tokens to spend on allowance and on reward (`balanceOf(signer) >= amount + reward`).

#### `signedApprove`

```solidity
    function signedApprove(
        address spender, uint256 amount,
        address[2] memory actors, uint256[4] memory txparams, bytes memory signature
    ) public returns (bool);
```

##### Notes

`actors` is an array of `address`es that MUST contain `signer` as `actors[0]` and `relayer` as `actors[1]`.

`txparams` is an array of `uint256` that MUST contain `nonce` as `txparams[0]`, `gasLimit` as `txparams[1]`, `gasPrice` as `txparams[2]` and `reward` as `txparams[3]`.

##### Main Mechanism

Approves `amount` amount of tokens from `signer`'s balance to address `spender`, and MUST fire the Approve event. 

##### Checklist

- The function MUST throw if the `mApprove` payload signature is invalid (resulting signer is different than provided `signer`).

- The function MUST throw if real `nonce` is not high enough to match the `nonce` provided in the `mApprove` payload.

- The function MUST throw if provided `gas` is not high enough to match the `gasLimit` provided in the `mApprove` payload. This should be checked as soon as the function starts. (`gasleft() >= gasLimit`)

- The function MUST throw if provided `gasPrice` is not high enough to match the `gasLimit` provided in the `mApprove` payload. (`tx.gasprice >= gasPrice`)

- The function MUST throw if provided `relayer` is not `address(0)` AND `relayer` is different than `msg.sender`.

- The function SHOULD throw if the `signer`’s account balance does not have enough tokens to spend on allowance and on reward (`balanceOf(signer) >= amount + reward`).

#### `verifyTransferFrom`

```solidity
    function verifyTransferFrom(
        address sender, address recipient, uint256 amount,
        address[2] memory actors, uint256[4] memory txparams, bytes memory signature
    ) public view returns (bool);
```

##### Notes

`actors` is an array of `address`es that MUST contain `signer` as `actors[0]` and `relayer` as `actors[1]`.

`txparams` is an array of `uint256` that MUST contain `nonce` as `txparams[0]`, `gasLimit` as `txparams[1]`, `gasPrice` as `txparams[2]` and `reward` as `txparams[3]`.

##### Main Mechanism

Verifies that a transfer from `sender` to `recipient` of `amount` tokens and that `signer` has at least `amount` allowance from `sender` is possible with the provided signature and with current contract state.

##### Checklist

- The function MUST throw if the `mTransferFrom` payload signature is invalid (resulting signer is different than provided `signer`).

- The function MUST throw if real `nonce` is not high enough to match the `nonce` provided in the `mTransferFrom` payload.

- The function MUST throw if provided `gas` is not high enough to match the `gasLimit` provided in the `mTransferFrom` payload. This should be checked as soon as the function starts. (`gasleft() >= gasLimit`)

- The function MUST throw if provided `gasPrice` is not high enough to match the `gasLimit` provided in the `mTransferFrom` payload. (`tx.gasprice >= gasPrice`)

- The function MUST throw if provided `relayer` is not `address(0)` AND `relayer` is different than `msg.sender`.

- The function SHOULD throw if the `signer`’s account balance does not have enough tokens to spend on reward (`balanceOf(signer) >= reward`).

- The function SHOULD throw if the `signer`’s account allowance from `sender` is at least `amount` (`allowance(sender, signer) >= amount`).

#### `signedTransferFrom`

```solidity
    function signedTransferFrom(
        address sender, address recipient, uint256 amount,
        address[2] memory actors, uint256[4] memory txparams, bytes memory signature
    ) public returns (bool);
    
}
```

##### Notes

`actors` is an array of `address`es that MUST contain `signer` as `actors[0]` and `relayer` as `actors[1]`.

`txparams` is an array of `uint256` that MUST contain `nonce` as `txparams[0]`, `gasLimit` as `txparams[1]`, `gasPrice` as `txparams[2]` and `reward` as `txparams[3]`.

##### Main Mechanism

Triggers transfer from `sender` to `recipient` of `amount` tokens. `signer` MUST have at least `amount` allowance from `sender`. It MUST trigger a Transfer event.

##### Checklist

- The function MUST throw if the `mTransferFrom` payload signature is invalid (resulting signer is different than provided `signer`).

- The function MUST throw if real `nonce` is not high enough to match the `nonce` provided in the `mTransferFrom` payload.

- The function MUST throw if provided `gas` is not high enough to match the `gasLimit` provided in the `mTransferFrom` payload. This should be checked as soon as the function starts. (`gasleft() >= gasLimit`)

- The function MUST throw if provided `gasPrice` is not high enough to match the `gasLimit` provided in the `mTransferFrom` payload. (`tx.gasprice >= gasPrice`)

- The function MUST throw if provided `relayer` is not `address(0)` AND `relayer` is different than `msg.sender`.

- The function SHOULD throw if the `signer`’s account balance does not have enough tokens to spend on reward (`balanceOf(signer) >= reward`).

- The function SHOULD throw if the `signer`’s account allowance from `sender` is at least `amount` (`allowance(sender, signer) >= amount`).

## Important tools & implementation indications

### On-Chain

#### Specification Interface

The interface to use in your implementation can be found [here](./contracts/mTKN.sol).

#### Splitting bytes signature into `r`, `s` & `v`

To lower the amount of arguments for the call, we prefer taking the signature as a `bytes` argument. This functions splits the given `bytes` into `uint8 v`, `bytes32 r` and `bytes32 s`.

```solidity

    function _splitSignature(bytes memory signature) private pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(signature.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := and(mload(add(signature, 65)), 255)
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid v argument");
    }

```

#### Build the EIP-712 Domain

In order to verify the signatures, the `mTKN` compliant contract should use the following method:

- Define the types as structs (`EIP712Domain`, `mActors`, `mTxParams`, `mTransfer`, `mApprove`, `mTransferFrom`)
- Define a `hash` helper function with parametric polymorphism for each type defined above.
- Define a `verify` helper function with parametric polymorphism for each type defined above that is going to be signed (only `mTransfer`, `mApprove` and `mTransferFrom`).

The EIP712Domain should always have the following values for your implementation:

- `name` should be the same as the one returned by the `name` method from the `ERC20` optional specification.
- `version` should be defined as you want
- `chainId` should be the proper ID of the current chain
- `verifyingContract` should be the address of the `mTKN` contract: (`address(this)`)

This is an example implementation of the `mTKNDomain`, that can also be found [here](./contracts/mTKNDomain.sol).

```solidity
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

    struct mTxParams {
        uint256 nonce;
        uint256 gasLimit;
        uint256 gasPrice;
        uint256 reward;
    }

    struct mActors {
        address signer;
        address relayer;
    }

    struct mTransfer {
        address recipient;
        uint256 amount;

        mActors actors;

        mTxParams txparams;
    }

    struct mApprove {
        address spender;
        uint256 amount;

        mActors actors;

        mTxParams txparams;
    }

    struct mTransferFrom {
        address sender;
        address recipient;
        uint256 amount;

        mActors actors;

        mTxParams txparams;
    }

    bytes32 constant MACTORS_TYPEHASH = keccak256(
        "mActors(address signer,address relayer)"
    );

    bytes32 constant MTXPARAMS_TYPEHASH = keccak256(
        "mTxParams(uint256 nonce,uint256 gasLimit,uint256 gasPrice,uint256 reward)"
    );

    bytes32 constant EIP712DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 constant MTRANSFER_TYPEHASH = keccak256(
        "mTransfer(address recipient,uint256 amount,mActors actors,mTxParams txparams)mActors(address signer,address relayer)mTxParams(uint256 nonce,uint256 gasLimit,uint256 gasPrice,uint256 reward)"
    );

    bytes32 constant MAPPROVE_TYPEHASH = keccak256(
        "mApprove(address spender,uint256 amount,mActors actors,mTxParams txparams)mActors(address signer,address relayer)mTxParams(uint256 nonce,uint256 gasLimit,uint256 gasPrice,uint256 reward)"
    );

    bytes32 constant MTRANSFERFROM_TYPEHASH = keccak256(
        "mTransferFrom(address sender,address recipient,uint256 amount,mActors actors,mTxParams txparams)mActors(address signer,address relayer)mTxParams(uint256 nonce,uint256 gasLimit,uint256 gasPrice,uint256 reward)"
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
                transfer.recipient,
                transfer.amount,

                hash(transfer.actors),

                hash(transfer.txparams)
            ));
    }

    function hash(mApprove memory approve) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                MAPPROVE_TYPEHASH,
                approve.spender,
                approve.amount,

                hash(approve.actors),

                hash(approve.txparams)
            ));
    }

    function hash(mActors memory actors) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                MACTORS_TYPEHASH,
                actors.signer,
                actors.relayer
            ));
    }

    function hash(mTxParams memory txparams) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                MTXPARAMS_TYPEHASH,
                txparams.nonce,
                txparams.gasLimit,
                txparams.gasPrice,
                txparams.reward
            ));
    }

    function hash(mTransferFrom memory transfer_from) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                MTRANSFERFROM_TYPEHASH,
                transfer_from.sender,
                transfer_from.recipient,
                transfer_from.amount,

                hash(transfer_from.actors),

                hash(transfer_from.txparams)
            ));
    }


    function verify(mTransfer memory transfer, Signature memory signature) internal view returns (bool) {
        bytes32 digest = keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                hash(transfer)
            ));
        return ecrecover(digest, signature.v, signature.r, signature.s) == transfer.actors.signer;
    }

    function verify(mApprove memory approve, Signature memory signature) internal view returns (bool) {
        bytes32 digest = keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                hash(approve)
            ));
        return ecrecover(digest, signature.v, signature.r, signature.s) == approve.actors.signer;
    }

    function verify(mTransferFrom memory transfer_from, Signature memory signature) internal view returns (bool) {
        bytes32 digest = keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                hash(transfer_from)
            ));
        return ecrecover(digest, signature.v, signature.r, signature.s) == transfer_from.actors.signer;
    }

}
```

### Off-Chain

#### Generate proper EIP-712 signatures with [`@ticket721/e712`](https://www.npmjs.com/package/@ticket721/e712) in Javascript / Typescript

The [`@ticket721/e712`](https://www.npmjs.com/package/@ticket721/e712) npm module can be used to properly generate signatures to make the calls. 

Complete usage examples of `signedTransfer`, `signedApprove`, `signedTransferFrom`, `verifyTransfer`, `verifyApprove` and `verifyTransferFrom` can be found in the [example implementation tests](./test/mtkn.js).

The module exposes a helper class, `MTKNSigner`. Build it with your domain arguments and quickly generate signatures with your private key, or payloads for your web3 browser. You can also verify proofs.
 
##### Example: generate signature with private key available (Typescript)

```typescript
import { MTKNSigner, EIP712Signature }    from '@ticket721/e712';
import { Wallet }                         from 'ethers';
import { BN }                             from 'bn.js';

const domain_name = 'my mtkn';
const domain_version = '1';
const domain_chain_id = 1;
const domain_contract = '0xd0a21D06befee2C5851EbafbcB1131d35B135e87';

const transfer_recipient = '0x19C8239E04ceA1B1C0342E6da5cF3a5Ca54874e1';
const address_zero = '0x0000000000000000000000000000000000000000';


// Build helper class
const mtkn = new MTKNSigner(domain_name, domain_version, domain_chain_id, domain_contract);

// Use your own private keys
const wallet = Wallet.createRandom();

// Generate proof
const sig: EIP712Signature = await mtkn.transfer(transfer_recipient, new BN(1000), {
    signer: wallet.address,
    relayer: address_zero
}, {
    nonce: new BN(0),
    gasLimit: new BN(1000000),
    gasPrice: 1000000,
    reward: 500
}, wallet.privateKey) as EIP712Signature;

// Verify proofs
const verification = await mtkn.verifyTransfer(transfer_recipient, new BN(1000), {
    signer: wallet.address,
    relayer: address_zero
}, {
    nonce: new BN(0),
    gasLimit: new BN(1000000),
    gasPrice: 1000000,
    reward: 500
}, sig.hex);

```

##### Example: generate signature with web3 browser (Typescript)

```typescript
import { MTKNSigner, EIP712Payload }    from '@ticket721/e712';
import { BN }                           from 'bn.js';

const domain_name = 'my mtkn';
const domain_version = '1';
const domain_chain_id = 1;
const domain_contract = '0xd0a21D06befee2C5851EbafbcB1131d35B135e87';

const transfer_recipient = '0x19C8239E04ceA1B1C0342E6da5cF3a5Ca54874e1';
const address_zero = '0x0000000000000000000000000000000000000000';

const my_web3_browser_address = '0x19C8239E04ceA1B1C0342E6da5cF3a5Ca54874e1';

// Build helper class
const mtkn = new MTKNSigner(domain_name, domain_version, domain_chain_id, domain_contract);

// Generate ready-to-sign payload
const payload: EIP712Payload = await mtkn.transfer(transfer_recipient, new BN(1000), {
    signer: my_web3_browser_address,
    relayer: address_zero
}, {
    nonce: new BN(0),
    gasLimit: new BN(1000000),
    gasPrice: 1000000,
    reward: 500
}) as EIP712Payload;

// Sign with web3
web3.currentProvider.sendAsync({
        method: 'eth_signTypedData_v3',
        params: [
            my_web3_browser_address,
            JSON.stringify(payload)
        ],
        from: my_web3_browser_address},
    (error, result) => {
        // do your stuff, signature is in result.result (if no errors)
    });

``` 

### Implementations

- Working example implementation [here](./contracts/mTKNExample.sol) with tests [here](./test/mtkn.js).

### History

- Vitalik discussing it on ethresear.ch (https://ethresear.ch/t/layer-2-gas-payment-abstraction/4513)
- Austin Thomas Griffith implementation on github (https://github.com/austintgriffith/native-meta-transactions)
- ERC-865 (https://github.com/ethereum/EIPs/issues/865)
- ERC-965 (https://github.com/ethereum/EIPs/issues/965)
- ERC-1776 Native Meta Transactions (https://github.com/ethereum/EIPs/issues/1776)

### Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
