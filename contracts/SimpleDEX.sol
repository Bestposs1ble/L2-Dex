// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleDEX
 * @dev 一个简单的去中心化交易所，支持两种代币之间的交换和流动性提供
 */
contract SimpleDEX is ERC20, Ownable {
    IERC20 public tokenA;
    IERC20 public tokenB;
    
    uint256 public reserveA;
    uint256 public reserveB;
    
    // 最小流动性，防止首次添加流动性时的价格操纵
    uint256 private constant MINIMUM_LIQUIDITY = 10**3;
    
    // 事件
    event AddLiquidity(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event RemoveLiquidity(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(address indexed user, uint256 amountIn, uint256 amountOut, bool isAtoB);
    
    /**
     * @dev 构造函数，设置代币地址
     * @param _tokenA TokenA 地址
     * @param _tokenB TokenB 地址
     */
    constructor(address _tokenA, address _tokenB) ERC20("SimpleDEX-LP", "SLP") Ownable(msg.sender) {
        require(_tokenA != address(0), "SimpleDEX: TOKENA_IS_ZERO_ADDRESS");
        require(_tokenB != address(0), "SimpleDEX: TOKENB_IS_ZERO_ADDRESS");
        require(_tokenA != _tokenB, "SimpleDEX: IDENTICAL_ADDRESSES");
        
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
    
    /**
     * @dev 获取当前储备量
     * @return reserveA TokenA 的储备量
     * @return reserveB TokenB 的储备量
     */
    function getReserves() public view returns (uint256, uint256) {
        return (reserveA, reserveB);
    }
    
    /**
     * @dev 获取 TokenA 兑换 TokenB 的价格
     * @return 价格比例 (TokenB/TokenA)
     */
    function getPriceAtoB() public view returns (uint256) {
        require(reserveA > 0 && reserveB > 0, "SimpleDEX: INSUFFICIENT_LIQUIDITY");
        return reserveB * 1e18 / reserveA;
    }
    
    /**
     * @dev 添加流动性
     * @param amountA TokenA 的数量
     * @param amountB TokenB 的数量
     * @return liquidity 铸造的流动性代币数量
     */
    function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256 liquidity) {
        require(amountA > 0 && amountB > 0, "SimpleDEX: INSUFFICIENT_INPUT_AMOUNT");
        
        // 新增调试 require 检查
        require(tokenA.allowance(msg.sender, address(this)) >= amountA, "SimpleDEX: allowanceA not enough");
        require(tokenB.allowance(msg.sender, address(this)) >= amountB, "SimpleDEX: allowanceB not enough");
        require(tokenA.balanceOf(msg.sender) >= amountA, "SimpleDEX: balanceA not enough");
        require(tokenB.balanceOf(msg.sender) >= amountB, "SimpleDEX: balanceB not enough");
        
        // 转移代币
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);
        
        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            // 首次添加流动性
            liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            
            // 更新储备量
            reserveA = amountA;
            reserveB = amountB;
            
            // 永久锁定最小流动性
            _mint(address(1), MINIMUM_LIQUIDITY); // 使用地址1而不是0地址，避免燃烧问题
            
            // 铸造流动性代币给提供者
            _mint(msg.sender, liquidity);
        } else {
            // 非首次添加流动性
            liquidity = min(
                amountA * _totalSupply / reserveA,
                amountB * _totalSupply / reserveB
            );
            
            require(liquidity > 0, "SimpleDEX: INSUFFICIENT_LIQUIDITY_MINTED");
            
            // 更新储备量
            reserveA += amountA;
            reserveB += amountB;
            
            // 铸造流动性代币
            _mint(msg.sender, liquidity);
        }
        
        emit AddLiquidity(msg.sender, amountA, amountB, liquidity);
        return liquidity;
    }
    
    /**
     * @dev 移除流动性
     * @param lpAmount 流动性代币数量
     * @return amountA 返还的 TokenA 数量
     * @return amountB 返还的 TokenB 数量
     */
    function removeLiquidity(uint256 lpAmount) external returns (uint256 amountA, uint256 amountB) {
        require(lpAmount > 0, "SimpleDEX: INSUFFICIENT_LIQUIDITY");
        
        uint256 _totalSupply = totalSupply();
        amountA = lpAmount * reserveA / _totalSupply;
        amountB = lpAmount * reserveB / _totalSupply;
        
        require(amountA > 0 && amountB > 0, "SimpleDEX: INSUFFICIENT_LIQUIDITY_BURNED");
        
        // 销毁流动性代币
        _burn(msg.sender, lpAmount);
        
        // 转移代币
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
        
        // 更新储备量
        reserveA -= amountA;
        reserveB -= amountB;
        
        emit RemoveLiquidity(msg.sender, amountA, amountB, lpAmount);
        return (amountA, amountB);
    }
    
    /**
     * @dev 将 TokenA 兑换为 TokenB
     * @param amountIn 输入的 TokenA 数量
     * @return amountOut 输出的 TokenB 数量
     */
    function swapAForB(uint256 amountIn) external returns (uint256 amountOut) {
        require(amountIn > 0, "SimpleDEX: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "SimpleDEX: INSUFFICIENT_LIQUIDITY");
        
        // 计算输出数量，使用恒定乘积公式: k = x * y
        // 手续费 0.3%
        uint256 amountInWithFee = amountIn * 997;
        amountOut = amountInWithFee * reserveB / (reserveA * 1000 + amountInWithFee);
        
        require(amountOut > 0, "SimpleDEX: INSUFFICIENT_OUTPUT_AMOUNT");
        
        // 转移代币
        tokenA.transferFrom(msg.sender, address(this), amountIn);
        tokenB.transfer(msg.sender, amountOut);
        
        // 更新储备量
        reserveA += amountIn;
        reserveB -= amountOut;
        
        emit Swap(msg.sender, amountIn, amountOut, true);
        return amountOut;
    }
    
    /**
     * @dev 将 TokenB 兑换为 TokenA
     * @param amountIn 输入的 TokenB 数量
     * @return amountOut 输出的 TokenA 数量
     */
    function swapBForA(uint256 amountIn) external returns (uint256 amountOut) {
        require(amountIn > 0, "SimpleDEX: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "SimpleDEX: INSUFFICIENT_LIQUIDITY");
        
        // 计算输出数量，使用恒定乘积公式: k = x * y
        // 手续费 0.3%
        uint256 amountInWithFee = amountIn * 997;
        amountOut = amountInWithFee * reserveA / (reserveB * 1000 + amountInWithFee);
        
        require(amountOut > 0, "SimpleDEX: INSUFFICIENT_OUTPUT_AMOUNT");
        
        // 转移代币
        tokenB.transferFrom(msg.sender, address(this), amountIn);
        tokenA.transfer(msg.sender, amountOut);
        
        // 更新储备量
        reserveB += amountIn;
        reserveA -= amountOut;
        
        emit Swap(msg.sender, amountIn, amountOut, false);
        return amountOut;
    }
    
    /**
     * @dev 计算平方根
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    /**
     * @dev 返回两个数中的较小值
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
} 