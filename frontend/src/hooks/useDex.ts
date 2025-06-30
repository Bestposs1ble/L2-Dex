import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

// 导入合约 ABI
import SimpleDEXAbi from '../abis/SimpleDEX.json';
import MockERC20Abi from '../abis/MockERC20.json';

export function useDex() {
  const { address, isConnected, dexAddress, tokenAAddress, tokenBAddress, refreshBalances } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // 获取池子状态
  const getPoolInfo = async () => {
    if (!isConnected) {
      setError('请先连接钱包');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, provider);
      
      // 获取储备量
      const reserves = await dexContract.getReserves();
      
      // 获取价格
      const price = await dexContract.getPriceAtoB();
      
      return {
        reserveA: ethers.formatUnits(reserves[0], 18),
        reserveB: ethers.formatUnits(reserves[1], 18),
        price: ethers.formatUnits(price, 18),
      };
    } catch (err: any) {
      console.error('获取池子信息失败:', err);
      // 针对流动性不足的特殊报错优化
      if (err.reason && err.reason.includes('INSUFFICIENT_LIQUIDITY')) {
        setError('池子暂无流动性，请先添加');
        return null;
      }
      setError('获取池子信息失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 兑换 Token A 为 Token B
  const swapAForB = async (amountIn: string, slippage: number = 0.5) => {
    if (!isConnected || !address) {
      setError('请先连接钱包');
      return null;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, signer);
      const tokenContract = new ethers.Contract(tokenAAddress, MockERC20Abi.abi, signer);
      
      // 先授权
      const amountInWei = ethers.parseUnits(amountIn, 18);
      console.log(`授权 ${amountIn} TokenA...`);
      const approveTx = await tokenContract.approve(dexAddress, amountInWei);
      await approveTx.wait();
      
      // 然后兑换
      console.log(`兑换 ${amountIn} TokenA 为 TokenB...`);
      const tx = await dexContract.swapAForB(amountInWei);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      
      // 刷新余额
      await refreshBalances();
      return true;
    } catch (err) {
      console.error('兑换失败:', err);
      setError('兑换失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 兑换 Token B 为 Token A
  const swapBForA = async (amountIn: string, slippage: number = 0.5) => {
    if (!isConnected || !address) {
      setError('请先连接钱包');
      return null;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, signer);
      const tokenContract = new ethers.Contract(tokenBAddress, MockERC20Abi.abi, signer);
      
      // 先授权
      const amountInWei = ethers.parseUnits(amountIn, 18);
      console.log(`授权 ${amountIn} TokenB...`);
      const approveTx = await tokenContract.approve(dexAddress, amountInWei);
      await approveTx.wait();
      
      // 然后兑换
      console.log(`兑换 ${amountIn} TokenB 为 TokenA...`);
      const tx = await dexContract.swapBForA(amountInWei);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      
      // 刷新余额
      await refreshBalances();
      return true;
    } catch (err) {
      console.error('兑换失败:', err);
      setError('兑换失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 添加流动性
  const addLiquidity = async (amountA: string, amountB: string) => {
    if (!isConnected || !address) {
      setError('请先连接钱包');
      return null;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, signer);
      const tokenAContract = new ethers.Contract(tokenAAddress, MockERC20Abi.abi, signer);
      const tokenBContract = new ethers.Contract(tokenBAddress, MockERC20Abi.abi, signer);
      
      // 先授权 Token A
      const amountAWei = ethers.parseUnits(amountA, 18);
      console.log(`授权 ${amountA} TokenA...`);
      const approveATx = await tokenAContract.approve(dexAddress, amountAWei);
      await approveATx.wait();
      
      // 再授权 Token B
      const amountBWei = ethers.parseUnits(amountB, 18);
      console.log(`授权 ${amountB} TokenB...`);
      const approveBTx = await tokenBContract.approve(dexAddress, amountBWei);
      await approveBTx.wait();
      
      // 添加流动性
      console.log(`添加流动性: ${amountA} TokenA + ${amountB} TokenB...`);
      const tx = await dexContract.addLiquidity(amountAWei, amountBWei);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      
      // 刷新余额
      await refreshBalances();
      return true;
    } catch (err) {
      console.error('添加流动性失败:', err);
      setError('添加流动性失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 移除流动性
  const removeLiquidity = async (lpAmount: string) => {
    if (!isConnected || !address) {
      setError('请先连接钱包');
      return null;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, signer);
      
      // 移除流动性
      const lpAmountWei = ethers.parseUnits(lpAmount, 18);
      console.log(`移除流动性: ${lpAmount} LP...`);
      const tx = await dexContract.removeLiquidity(lpAmountWei);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      
      // 刷新余额
      await refreshBalances();
      return true;
    } catch (err) {
      console.error('移除流动性失败:', err);
      setError('移除流动性失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    txHash,
    getPoolInfo,
    swapAForB,
    swapBForA,
    addLiquidity,
    removeLiquidity,
  };
} 