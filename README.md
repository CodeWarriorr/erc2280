<p align="center">
  <img src="https://github.com/ticket721/mTKN/raw/master/assets/logo.png">
</p>

## Purpose

This example showcases the specification for Native Meta Transactions support for ERC-20. It follows instructions from ERC-1776.

## Goal

Use ERC-712 signatures to trigger `transfer`, `transferFrom` or `approve` methods on an ERC-20 token. To do this, we introduce 3 new methods: `signedTransfer`, `signedTransferFrom` and `signedApprove`. Give the ERC-712 signature to anyone willing to put it on the blockchain for you, and it will trigger the required action.

- Setup a standard for wallets and web3 browsers to properly understand these types of signatures and adapt their UI
- Setup a standard for Relays to properly integrate any new tokens following the standard

## Use Case

- **Transfer Tokens without paying for ETH gas**: this a better practice than giving eth to your users so they can make the transactions
- **Pay for gas with the token**: the procotol supports a reward argument that redirects funds to the relayer when signature is properly uploaded.
- **Make your tokens $ETH independent**: Setup a network of relayers (accounts that want to submit signatures for you in exchange of the reward) and the token users will never have to buy ETH to use the token

