// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @dev 用于测试的ERC20代币，任何人都可以铸造代币
 */
contract MockERC20 is ERC20, Ownable {
    
    /**
     * @dev 构造函数，设置代币名称和符号
     * @param name_ 代币名称
     * @param symbol_ 代币符号
     */
    constructor(
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        // 初始化时不铸造任何代币
    }
    
    /**
     * @dev 铸造代币
     * @param to 接收者地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
    
    /**
     * @dev 为调用者铸造代币，方便测试
     * @param amount 铸造数量
     */
    function faucet(uint256 amount) external {
        _mint(msg.sender, amount);
    }
} 