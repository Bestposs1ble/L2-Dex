import { ethers } from "hardhat";
import { getDeployer, CONTRACT_CONFIG, saveAddressesToFrontend } from "./config";

async function main() {
  console.log("开始部署合约...");

  // 获取部署账户
  const deployer = await getDeployer();

  // 部署 MockERC20 TokenA
  console.log("部署 TokenA...");
  const TokenA = await ethers.getContractFactory("MockERC20");
  const tokenA = await TokenA.deploy(
    CONTRACT_CONFIG.tokenA.name,
    CONTRACT_CONFIG.tokenA.symbol
  );
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log(`TokenA 已部署到: ${tokenAAddress}`);

  // 部署 MockERC20 TokenB
  console.log("部署 TokenB...");
  const TokenB = await ethers.getContractFactory("MockERC20");
  const tokenB = await TokenB.deploy(
    CONTRACT_CONFIG.tokenB.name,
    CONTRACT_CONFIG.tokenB.symbol
  );
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log(`TokenB 已部署到: ${tokenBAddress}`);

  // 部署 SimpleDEX
  console.log("部署 SimpleDEX...");
  const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  const dex = await SimpleDEX.deploy(tokenAAddress, tokenBAddress);
  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();
  console.log(`SimpleDEX 已部署到: ${dexAddress}`);

  // 为部署者铸造一些测试代币
  console.log("为部署者铸造测试代币...");
  const mintAmount = ethers.parseEther("10000"); // 10,000 tokens
  
  await tokenA.mint(deployer.address, mintAmount);
  console.log(`已铸造 ${ethers.formatEther(mintAmount)} 个 TokenA 到部署者账户`);
  
  await tokenB.mint(deployer.address, mintAmount);
  console.log(`已铸造 ${ethers.formatEther(mintAmount)} 个 TokenB 到部署者账户`);

  // ====== 初始化池子流动性 ======
  const initAmount = ethers.parseEther("1000"); // 1000 tokens - 修改为1000个代币的流动性
  // 检查余额
  let balanceA = await tokenA.balanceOf(deployer.address);
  let balanceB = await tokenB.balanceOf(deployer.address);
  console.log('TokenA 余额:', ethers.formatUnits(balanceA, 18));
  console.log('TokenB 余额:', ethers.formatUnits(balanceB, 18));
  // 检查授权
  let allowanceA = await tokenA.allowance(deployer.address, dexAddress);
  let allowanceB = await tokenB.allowance(deployer.address, dexAddress);
  console.log('TokenA 授权:', ethers.formatUnits(allowanceA, 18));
  console.log('TokenB 授权:', ethers.formatUnits(allowanceB, 18));
  // 先授权
  console.log("授权 SimpleDEX 合约 1000 TokenA 和 1000 TokenB...");
  await tokenA.approve(dexAddress, initAmount);
  await tokenB.approve(dexAddress, initAmount);
  // 再次检查授权
  allowanceA = await tokenA.allowance(deployer.address, dexAddress);
  allowanceB = await tokenB.allowance(deployer.address, dexAddress);
  console.log('TokenA 授权(授权后):', ethers.formatUnits(allowanceA, 18));
  console.log('TokenB 授权(授权后):', ethers.formatUnits(allowanceB, 18));
  if (allowanceA < initAmount || allowanceB < initAmount) {
    throw new Error('授权额度不足，无法添加流动性');
  }
  // 添加流动性
  console.log("向池子添加初始流动性: 1000 TokenA + 1000 TokenB...");
  await dex.addLiquidity(initAmount, initAmount);
  console.log("初始流动性添加完成!");
  // ====== END ======

  // 检查余额
  balanceA = await tokenA.balanceOf(deployer.address);
  balanceB = await tokenB.balanceOf(deployer.address);
  console.log('TokenA 余额:', ethers.formatEther(balanceA));
  console.log('TokenB 余额:', ethers.formatEther(balanceB));

  // 检查授权
  allowanceA = await tokenA.allowance(deployer.address, dexAddress);
  allowanceB = await tokenB.allowance(deployer.address, dexAddress);
  console.log('TokenA 授权:', ethers.formatEther(allowanceA));
  console.log('TokenB 授权:', ethers.formatEther(allowanceB));

  // 保存合约地址
  saveAddressesToFrontend({
    tokenA: tokenAAddress,
    tokenB: tokenBAddress,
    dex: dexAddress
  });

  console.log("部署完成!");
}

// 执行部署
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
