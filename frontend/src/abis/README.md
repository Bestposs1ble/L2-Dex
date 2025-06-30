# 合约 ABI 目录

这个目录用于存放智能合约的 ABI 文件，用于前端与合约交互。

## 如何获取 ABI 文件

在项目根目录下编译合约后，可以从 `artifacts` 目录获取 ABI 文件：

1. 编译合约：
```bash
npm run compile
```

2. 复制 ABI 文件到此目录：
```bash
# 创建 SimpleDEX.json
cp ../artifacts/contracts/SimpleDEX.sol/SimpleDEX.json ./SimpleDEX.json

# 创建 MockERC20.json
cp ../artifacts/contracts/MockERC20.sol/MockERC20.json ./MockERC20.json
```

## 文件说明

- `SimpleDEX.json`: DEX 合约的 ABI
- `MockERC20.json`: 测试代币合约的 ABI

## 注意事项

部署合约后，需要更新 `Web3Context.tsx` 中的合约地址。 