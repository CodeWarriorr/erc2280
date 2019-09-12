const e712 = require('@ticket721/e712');
const ethers = require('ethers');

const mTransferType = [
  {
    name: 'recipient',
    type: 'address'
  },
  {
    name: 'amount',
    type: 'uint256'
  },

  {
    name: 'actors',
    type: 'mActors'
  },

  {
    name: 'txparams',
    type: 'mTxParams'
  }
];

const mApproveType = [
  {
    name: 'spender',
    type: 'address'
  },
  {
    name: 'amount',
    type: 'uint256'
  },

  {
    name: 'actors',
    type: 'mActors'
  },

  {
    name: 'txparams',
    type: 'mTxParams'
  }
];

const mTransferFromType = [
  {
    name: 'sender',
    type: 'address'
  },
  {
    name: 'recipient',
    type: 'address'
  },
  {
    name: 'amount',
    type: 'uint256'
  },

  {
    name: 'actors',
    type: 'mActors'
  },

  {
    name: 'txparams',
    type: 'mTxParams'
  }
];

const mActors = [
  {
    name: 'signer',
    type: 'address'
  },
  {
    name: 'relayer',
    type: 'address'
  }
];

const mTxParams = [
  {
    name: 'nonce',
    type: 'uint256'
  },
  {
    name: 'gasLimit',
    type: 'uint256'
  },
  {
    name: 'gasPrice',
    type: 'uint256'
  },
  {
    name: 'reward',
    type: 'uint256'
  }
];

const domain = (address) => ({
  name: 'test meta token',
  version: '1',
  chainId: 1,
  verifyingContract: address
});


class mTKNSigner extends e712.EIP712Signer {
  constructor(address) {
    super(domain(address), ['mTransfer', mTransferType], ['mApprove', mApproveType], ['mTransferFrom', mTransferFromType], ['mActors', mActors], ['mTxParams', mTxParams]
    )
  }
}

const snapshot = () => {
  return new Promise((ok, ko) => {
    web3.currentProvider.send({
      method: "evm_snapshot",
      params: [],
      jsonrpc: "2.0",
      id: new Date().getTime()
    }, (error, res) => {
      if (error) {
        return ko(error);
      } else {
        ok(res.result);
      }
    })
  })
};

// Revert the state of the blockchain to previously saved state
const revert = (snap_id) => {
  return new Promise((ok, ko) => {
    web3.currentProvider.send({
      method: "evm_revert",
      params: [snap_id],
      jsonrpc: "2.0",
      id: new Date().getTime()
    }, (error, res) => {
      if (error) {
        return ko(error);
      } else {
        ok(res.result);
      }
    })
  })
};

const ZERO = "0x0000000000000000000000000000000000000000";

contract('mTKN', (accounts) => {

  before(async () => {
    this.snap_id = await snapshot();
  });

  beforeEach(async () => {
    const status = await revert(this.snap_id);
    expect(status).to.be.true;
    this.snap_id = await snapshot();
  });

  it('mTransfer', async () => {
    const mTKN = artifacts.require("mTKNExample");
    const mTKN_instance = await mTKN.deployed();

    const mTKN_signer = new mTKNSigner(mTKN_instance.address);
    const wallet = ethers.Wallet.createRandom();
    const to = accounts[0];

    // Prepare payload data
    const mTransferPayload = {
      recipient: to,
      amount: 1234,

      actors: {
        signer: wallet.address,
        relayer: ZERO
      },

      txparams: {
        nonce: parseInt(await mTKN_instance.nonceOf(wallet.address)),
        gasLimit: 1000000,
        gasPrice: 1000000,
        reward: 100000,
      }
    };

    // Prepare complete EIP712 Payload
    const payload = mTKN_signer.generatePayload(mTransferPayload, 'mTransfer');
    const sig = await mTKN_signer.sign(wallet.privateKey, payload, true);

    // Give tokens to signer balance
    await mTKN_instance.test__mint(wallet.address, 1000000);

    console.log('Before Meta Tx');
    console.log('Payer & Signer', (await mTKN_instance.balanceOf(wallet.address)).toString());
    console.log('Recipient', (await mTKN_instance.balanceOf(accounts[0])).toString());
    console.log('Relayer', (await mTKN_instance.balanceOf(accounts[1])).toString());

    // Execute Constant verifier
    const res = await mTKN_instance.verifyTransfer(
        mTransferPayload.recipient,
        mTransferPayload.amount,

        [
          mTransferPayload.actors.signer,
          mTransferPayload.actors.relayer,
        ],

        [
          mTransferPayload.txparams.nonce,
          mTransferPayload.txparams.gasLimit,
          mTransferPayload.txparams.gasPrice,
          mTransferPayload.txparams.reward,
        ],

        sig.hex
        , {from: accounts[1]});

    expect(res).to.equal(true);

    // Execute Meta Transaction
    await mTKN_instance.signedTransfer(
        mTransferPayload.recipient,
        mTransferPayload.amount,

        [
          mTransferPayload.actors.signer,
          mTransferPayload.actors.relayer,
        ],

        [
          mTransferPayload.txparams.nonce,
          mTransferPayload.txparams.gasLimit,
          mTransferPayload.txparams.gasPrice,
          mTransferPayload.txparams.reward,
        ],

        sig.hex
        , {from: accounts[1]});

    console.log('After Meta Tx');
    console.log('Payer & Signer', (await mTKN_instance.balanceOf(wallet.address)).toString());
    console.log('Recipient', (await mTKN_instance.balanceOf(accounts[0])).toString());
    console.log('Relayer', (await mTKN_instance.balanceOf(accounts[1])).toString());

  });

  it('mApprove', async () => {
    const mTKN = artifacts.require("mTKNExample");
    const mTKN_instance = await mTKN.deployed();

    const mTKN_signer = new mTKNSigner(mTKN_instance.address);
    const wallet = ethers.Wallet.createRandom();
    const to = accounts[0];

    // Prepare payload data
    const mApprovePayload = {
      spender: to,
      amount: 1234,

      actors: {
        signer: wallet.address,
        relayer: ZERO
      },

      txparams: {
        nonce: parseInt(await mTKN_instance.nonceOf(wallet.address)),
        gasLimit: 1000000,
        gasPrice: 1000000,
        reward: 100000,
      }

    };

    // Prepare complete EIP712 Payload
    const payload = mTKN_signer.generatePayload(mApprovePayload, 'mApprove');
    const sig = await mTKN_signer.sign(wallet.privateKey, payload, true);

    // Give tokens to signer balance
    await mTKN_instance.test__mint(wallet.address, 1000000);

    console.log('Before Meta Tx Balances');
    console.log('Payer & Signer', (await mTKN_instance.balanceOf(wallet.address)).toString());
    console.log('Spender', (await mTKN_instance.balanceOf(accounts[0])).toString());
    console.log('Relayer', (await mTKN_instance.balanceOf(accounts[1])).toString());

    console.log('After Meta Tx Allowances');
    console.log('Spender', (await mTKN_instance.allowance(wallet.address, accounts[0])).toString());
    console.log('Relayer', (await mTKN_instance.allowance(wallet.address, accounts[1])).toString());

    // Execute Constant verifier
    const res = await mTKN_instance.verifyApprove(
        mApprovePayload.spender,
        mApprovePayload.amount,

        [
          mApprovePayload.actors.signer,
          mApprovePayload.actors.relayer
        ],

        [
          mApprovePayload.txparams.nonce,
          mApprovePayload.txparams.gasLimit,
          mApprovePayload.txparams.gasPrice,
          mApprovePayload.txparams.reward
        ],

        sig.hex
        , {from: accounts[1]});

    expect(res).to.equal(true);

    // Execute Meta Transaction
    await mTKN_instance.signedApprove(
        mApprovePayload.spender,
        mApprovePayload.amount,

        [
          mApprovePayload.actors.signer,
          mApprovePayload.actors.relayer
        ],

        [
          mApprovePayload.txparams.nonce,
          mApprovePayload.txparams.gasLimit,
          mApprovePayload.txparams.gasPrice,
          mApprovePayload.txparams.reward
        ],

        sig.hex
        , {from: accounts[1]});

    console.log('After Meta Tx Balances');
    console.log('Payer & Signer', (await mTKN_instance.balanceOf(wallet.address)).toString());
    console.log('Spender', (await mTKN_instance.balanceOf(accounts[0])).toString());
    console.log('Relayer', (await mTKN_instance.balanceOf(accounts[1])).toString());

    console.log('After Meta Tx Allowances');
    console.log('Spender', (await mTKN_instance.allowance(wallet.address, accounts[0])).toString());
    console.log('Relayer', (await mTKN_instance.allowance(wallet.address, accounts[1])).toString());

  });

  it('mTransferFrom', async () => {
    const mTKN = artifacts.require("mTKNExample");
    const mTKN_instance = await mTKN.deployed();

    const mTKN_signer = new mTKNSigner(mTKN_instance.address);
    const wallet = ethers.Wallet.createRandom();
    const from = accounts[0];
    const to = accounts[1];
    const signer = wallet.address;

    // Prepare payload data
    const mTransferFromPayload = {
      sender: from,
      recipient: to,
      amount: 1234,

      actors: {
        signer,
        relayer: ZERO
      },

      txparams: {
        nonce: parseInt(await mTKN_instance.nonceOf(wallet.address)),
        gasLimit: 1000000,
        gasPrice: 1000000,
        reward: 100000,
      }

    };

    // Prepare complete EIP712 Payload
    const payload = mTKN_signer.generatePayload(mTransferFromPayload, 'mTransferFrom');
    const sig = await mTKN_signer.sign(wallet.privateKey, payload, true);

    // Give tokens to signer balance
    await mTKN_instance.test__mint(accounts[0], 1234);
    await mTKN_instance.test__mint(wallet.address, 100000);
    await mTKN_instance.approve(wallet.address, 1234, {from: accounts[0]});

    console.log('Before Meta Tx Balances');
    console.log('Signer', (await mTKN_instance.balanceOf(wallet.address)).toString());
    console.log('Sender', (await mTKN_instance.balanceOf(accounts[0])).toString());
    console.log('Recipient', (await mTKN_instance.balanceOf(accounts[1])).toString());
    console.log('Relayer', (await mTKN_instance.balanceOf(accounts[2])).toString());

    // Execute Constant verifier
    const res = await mTKN_instance.verifyTransferFrom(
        mTransferFromPayload.sender,
        mTransferFromPayload.recipient,
        mTransferFromPayload.amount,

        [
          mTransferFromPayload.actors.signer,
          mTransferFromPayload.actors.relayer
        ],

        [
          mTransferFromPayload.txparams.nonce,
          mTransferFromPayload.txparams.gasLimit,
          mTransferFromPayload.txparams.gasPrice,
          mTransferFromPayload.txparams.reward
        ],

        sig.hex
        , {from: accounts[2]});

    expect(res).to.equal(true);

    // Execute Meta Transaction
    await mTKN_instance.signedTransferFrom(
        mTransferFromPayload.sender,
        mTransferFromPayload.recipient,
        mTransferFromPayload.amount,

        [
          mTransferFromPayload.actors.signer,
          mTransferFromPayload.actors.relayer
        ],

        [
          mTransferFromPayload.txparams.nonce,
          mTransferFromPayload.txparams.gasLimit,
          mTransferFromPayload.txparams.gasPrice,
          mTransferFromPayload.txparams.reward
        ],

        sig.hex
        , {from: accounts[2]});

    console.log('After Meta Tx Balances');
    console.log('Signer', (await mTKN_instance.balanceOf(wallet.address)).toString());
    console.log('Sender', (await mTKN_instance.balanceOf(accounts[0])).toString());
    console.log('Recipient', (await mTKN_instance.balanceOf(accounts[1])).toString());
    console.log('Relayer', (await mTKN_instance.balanceOf(accounts[2])).toString());

  });

});
