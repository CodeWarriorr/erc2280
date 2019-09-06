const e712 = require('@ticket721/e712');
const ethers = require('ethers');

const mTransferType = [
  {
    name: 'signer',
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

const mApproveType = [
  {
    name: 'signer',
    type: 'address'
  },
  {
    name: 'spender',
    type: 'address'
  },
  {
    name: 'amount',
    type: 'uint256'
  },
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

const mTransferFromType = [
  {
    name: 'signer',
    type: 'address'
  },
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
    super(domain(address), ['mTransfer', mTransferType], ['mApprove', mApproveType], ['mTransferFrom', mTransferFromType]
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
    const mTKN = artifacts.require("mTKN");
    const mTKN_instance = await mTKN.deployed();

    const mTKN_signer = new mTKNSigner(mTKN_instance.address);
    const wallet = ethers.Wallet.createRandom();
    const to = accounts[0];

    // Prepare payload data
    const mTransferPayload = {
      signer: wallet.address,
      recipient: to,
      amount: 1234,
      nonce: 0,
      gasLimit: 1000000,
      gasPrice: 1000000,
      reward: 100000
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

    // Execute Meta Transaction
    await mTKN_instance.signedTransfer(
        mTransferPayload.signer,
        mTransferPayload.recipient,
        mTransferPayload.amount,
        mTransferPayload.nonce,
        mTransferPayload.gasLimit,
        mTransferPayload.gasPrice,
        mTransferPayload.reward,

        sig.v,
        '0x' + sig.r,
        '0x' + sig.s
    , {from: accounts[1]});

    console.log('After Meta Tx');
    console.log('Payer & Signer', (await mTKN_instance.balanceOf(wallet.address)).toString());
    console.log('Recipient', (await mTKN_instance.balanceOf(accounts[0])).toString());
    console.log('Relayer', (await mTKN_instance.balanceOf(accounts[1])).toString());

  });

  it('mApprove', async () => {
    const mTKN = artifacts.require("mTKN");
    const mTKN_instance = await mTKN.deployed();

    const mTKN_signer = new mTKNSigner(mTKN_instance.address);
    const wallet = ethers.Wallet.createRandom();
    const to = accounts[0];

    // Prepare payload data
    const mApprovePayload = {
      signer: wallet.address,
      spender: to,
      amount: 1234,
      nonce: 0,
      gasLimit: 1000000,
      gasPrice: 1000000,
      reward: 100000
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

    // Execute Meta Transaction
    await mTKN_instance.signedApprove(
        mApprovePayload.signer,
        mApprovePayload.spender,
        mApprovePayload.amount,
        mApprovePayload.nonce,
        mApprovePayload.gasLimit,
        mApprovePayload.gasPrice,
        mApprovePayload.reward,

        sig.v,
        '0x' + sig.r,
        '0x' + sig.s
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
    const mTKN = artifacts.require("mTKN");
    const mTKN_instance = await mTKN.deployed();

    const mTKN_signer = new mTKNSigner(mTKN_instance.address);
    const wallet = ethers.Wallet.createRandom();
    const from = accounts[0];
    const to = accounts[1];
    const signer = wallet.address;

    // Prepare payload data
    const mTransferFromPayload = {
      signer,
      sender: from,
      recipient: to,
      amount: 1234,
      nonce: 0,
      gasLimit: 1000000,
      gasPrice: 1000000,
      reward: 100000
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

    // Execute Meta Transaction
    await mTKN_instance.signedTransferFrom(
        mTransferFromPayload.signer,
        mTransferFromPayload.sender,
        mTransferFromPayload.recipient,
        mTransferFromPayload.amount,
        mTransferFromPayload.nonce,
        mTransferFromPayload.gasLimit,
        mTransferFromPayload.gasPrice,
        mTransferFromPayload.reward,

        sig.v,
        '0x' + sig.r,
        '0x' + sig.s
        , {from: accounts[2]});

    console.log('After Meta Tx Balances');
    console.log('Signer', (await mTKN_instance.balanceOf(wallet.address)).toString());
    console.log('Sender', (await mTKN_instance.balanceOf(accounts[0])).toString());
    console.log('Recipient', (await mTKN_instance.balanceOf(accounts[1])).toString());
    console.log('Relayer', (await mTKN_instance.balanceOf(accounts[2])).toString());

  });

});
