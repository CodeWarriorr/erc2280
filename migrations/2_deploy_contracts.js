const mTKN = artifacts.require("mTKN");

module.exports = function(deployer) {
  deployer.deploy(mTKN, "test meta token", "tmTKN", 18);
};
