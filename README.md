# L2-DEX 去中心化交易所

L2-DEX 是一个基于 L2 网络（支持 Arbitrum Sepolia 测试网和本地 Ganache 网络）的简单去中心化交易所，提供代币交换和流动性管理功能。

## 项目特点

- 支持两种代币之间的交换（TokenA 和 TokenB）
- 支持添加和移除流动性
- 实时价格和池子状态展示
- 支持 Arbitrum Sepolia 测试网和本地 Ganache 网络
- 使用 React + Vite + Tailwind CSS 构建的现代化前端
- 使用 RainbowKit + wagmi 实现钱包连接和网络切换

## 技术栈

### 区块链部分
- Solidity ^0.8.20
- Hardhat
- OpenZeppelin 合约库
- ethers.js v6

### 前端部分
- React + Vite
- Tailwind CSS
- ethers.js v6
- RainbowKit + wagmi
- React Router

## 项目结构

```
L2-Dex/
  - contracts/              # Solidity 合约
    - SimpleDEX.sol         # 核心 DEX 合约
    - MockERC20.sol         # 测试代币合约
  - scripts/                # 部署脚本
    - deploy.ts             # 部署合约
    - config.ts             # 配置文件
  - frontend/               # 前端应用
    - src/
      - abis/               # 合约 ABI
      - components/         # 可复用组件
      - contexts/           # React 上下文
      - hooks/              # 自定义 Hooks
      - pages/              # 页面组件
  - test/                   # 合约测试
```

## 快速开始

### 环境准备

1. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

2. 创建 `.env` 文件（根据 `.env.example` 模板）

```
# 部署账户私钥（示例私钥，仅用于开发）
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Ganache 本地网络 RPC URL
GANACHE_URL=http://127.0.0.1:8545

# Arbitrum Sepolia 测试网 RPC URL
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# RainbowKit 项目 ID
VITE_WALLET_CONNECT_PROJECT_ID=YOUR_WALLET_CONNECT_PROJECT_ID
```

### 本地开发

1. 启动本地 Ganache 网络

```bash
# 使用 Hardhat 内置节点
npm run node
```

2. 部署合约到本地网络

```bash
# 在新的终端窗口中运行
npm run deploy:ganache
```

3. 启动前端开发服务器

```bash
cd frontend
npm run dev
```

4. 在浏览器中访问 `http://localhost:5173`

### 测试

运行合约测试：

```bash
npm test
```

### 部署到 Arbitrum Sepolia 测试网

1. 确保 `.env` 文件中有正确的 `PRIVATE_KEY` 和 `ARBITRUM_SEPOLIA_RPC_URL`
2. 执行部署命令：

```bash
npm run deploy:arbitrum
```

## 使用指南

### 连接钱包

1. 点击右上角的 "Connect Wallet" 按钮
2. 选择您的钱包（MetaMask、Coinbase 等）
3. 确认连接请求

### 获取测试代币

在本地 Ganache 网络中，部署脚本会自动为部署账户铸造测试代币。您可以使用 MockERC20 合约的 `faucet` 函数为其他账户铸造代币。

### 添加流动性

1. 导航到 "添加流动性" 页面
2. 输入要添加的 TokenA 和 TokenB 数量
3. 点击 "添加流动性" 按钮
4. 确认交易

### 交换代币

1. 导航到 "Swap" 页面
2. 选择交换方向（TokenA → TokenB 或 TokenB → TokenA）
3. 输入要交换的代币数量
4. 设置滑点容忍度（默认 0.5%）
5. 点击 "Swap" 按钮
6. 确认交易

### 移除流动性

1. 导航到 "移除流动性" 页面
2. 输入要移除的 LP Token 数量
3. 查看预估返还的 TokenA 和 TokenB 数量
4. 点击 "移除流动性" 按钮
5. 确认交易

### 查看池子状态

导航到 "数据看板" 页面，查看当前池子状态、价格和交易历史。

## 合约接口

### SimpleDEX.sol

- `addLiquidity(uint256 amountA, uint256 amountB)` - 添加流动性
- `removeLiquidity(uint256 lpAmount)` - 移除流动性
- `swapAForB(uint256 amountIn)` - 将 TokenA 兑换为 TokenB
- `swapBForA(uint256 amountIn)` - 将 TokenB 兑换为 TokenA
- `getPriceAtoB()` - 获取 TokenA 兑换 TokenB 的价格
- `getReserves()` - 获取当前储备量

### MockERC20.sol

- `mint(address to, uint256 amount)` - 铸造代币
- `faucet(uint256 amount)` - 为调用者铸造代币

## 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

MIT
