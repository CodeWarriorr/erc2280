<p align="center">
  <img src="https://github.com/ticket721/mTKN/raw/master/assets/logo.png">
</p>

This repository contains the interface for the `mTKN` standard and the initial EIP Draft content.

---

## Introduction

The popularity of meta transactions is rising thanks to actors of the community (Austin Thomas Griffith, the MetaCartel, Ronan Sandford, and a lot more). ERC-1776 was published in February 2019 to start a standardization process around the implementation of native meta transactions as extensions of well-known standards. I introduce today the beginning of a discussion to create a precise specification for an ERC-20 (only) extension to add native meta transaction, the `mTKN` standard (meta token). This standard should focus on simplicity, and is a major step in the development of standardized relay networks.

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

This mandatory type should be included in the signed payload.

```solidity

    struct EIP712Domain {
        string  name;
        string  version;
        uint256 chainId;
        address verifyingContract;
    }

```

#### mActors

This type describe the extra actors involved in the meta transaction: the **Signer** and the **Relayer**. 

```solidity

    struct mActors {
        address signer;  // Used to check signature validity
        address relayer; // Used to enforce a relayer address. Set to address(0) if no restrictions required
    }

```

#### mTxParams

This type describes transaction parameters & reward parameters

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

## Important tools

### On-Chain

#### Splitting bytes signature into `r`, `s` & `v`

#### Build the EIP-712 Domain

#### Properly verify signatures

### Off-Chain

#### Generate proper EIP-712 signatures with `@ticket721/e712`

### Implementations

## Goal

Use ERC-712 signatures to trigger `transfer`, `transferFrom` or `approve` methods on an ERC-20 token. To do this, we introduce 3 new methods: `signedTransfer`, `signedTransferFrom` and `signedApprove`. Give the ERC-712 signature to anyone willing to put it on the blockchain for you, and it will trigger the required action.

- Setup a standard for wallets and web3 browsers to properly understand these types of signatures and adapt their UI
- Setup a standard for Relays to properly integrate any new tokens following the standard

## Use Case

- **Transfer Tokens without paying for ETH gas**: this a better practice than giving eth to your users so they can make the transactions
- **Pay for gas with the token**: the procotol supports a reward argument that redirects funds to the relayer when signature is properly uploaded.
- **Make your tokens $ETH independent**: Setup a network of relayers (accounts that want to submit signatures for you in exchange of the reward) and the token users will never have to buy ETH to use the token

