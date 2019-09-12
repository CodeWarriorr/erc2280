const mTKNExample = artifacts.require("mTKNExample");

module.exports = function(deployer) {
  deployer.deploy(mTKNExample, "test meta token", "mTKNE", 18);
};
