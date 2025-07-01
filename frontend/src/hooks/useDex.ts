import { useState, useCallback, useRef } from 'react';
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
  
  // 添加节流控制的引用
  const throttleTimerRef = useRef<number | null>(null);
  const lastPoolInfoRef = useRef<any>(null);

  // 添加调试日志函数
  const logDebug = useCallback((message: string, data?: any) => {
    console.log(`[useDex] ${message}`, data || '');
  }, []);

  // 设置加载状态的包装函数，添加日志
  const setLoadingWithLog = useCallback((isLoading: boolean) => {
    logDebug(`设置loading状态: ${isLoading}`);
    setLoading(isLoading);
  }, [logDebug]);

  // 设置错误状态的包装函数，添加日志
  const setErrorWithLog = useCallback((errorMsg: string | null) => {
    if (errorMsg) {
      logDebug(`设置错误: ${errorMsg}`);
    } else {
      logDebug('清除错误');
    }
    setError(errorMsg);
  }, [logDebug]);

  // 设置交易哈希的包装函数，添加日志
  const setTxHashWithLog = useCallback((hash: string | null) => {
    if (hash) {
      logDebug(`设置交易哈希: ${hash}`);
    } else {
      logDebug('清除交易哈希');
    }
    setTxHash(hash);
  }, [logDebug]);

  // 获取池子状态 - 添加节流功能
  const getPoolInfo = useCallback(async (force = false) => {
    if (!isConnected) {
      setErrorWithLog('请先连接钱包');
      return null;
    }

    // 如果已经有一个请求在进行中，返回上次的结果
    if (loading && !force) {
      logDebug('已有请求进行中，返回缓存结果');
      return lastPoolInfoRef.current;
    }
    
    // 节流控制，5秒内不重复请求
    if (throttleTimerRef.current !== null && !force) {
      logDebug('请求被节流，返回缓存结果');
      return lastPoolInfoRef.current;
    }

    setLoadingWithLog(true);
    setErrorWithLog(null);
    
    try {
      logDebug('获取池子信息...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, provider);
      
      // 获取储备量
      const reserves = await dexContract.getReserves();
      
      // 获取价格
      const price = await dexContract.getPriceAtoB();
      
      const result = {
        reserveA: ethers.formatUnits(reserves[0], 18),
        reserveB: ethers.formatUnits(reserves[1], 18),
        price: ethers.formatUnits(price, 18),
      };
      
      // 缓存结果
      lastPoolInfoRef.current = result;
      
      // 设置节流定时器
      if (throttleTimerRef.current === null) {
        throttleTimerRef.current = window.setTimeout(() => {
          throttleTimerRef.current = null;
        }, 5000); // 5秒节流时间
      }
      
      logDebug('获取池子信息成功', result);
      return result;
    } catch (err: any) {
      logDebug('获取池子信息失败', err);
      // 针对流动性不足的特殊报错优化
      if (err.reason && err.reason.includes('INSUFFICIENT_LIQUIDITY')) {
        setErrorWithLog('池子暂无流动性，请先添加');
        return null;
      }
      setErrorWithLog('获取池子信息失败');
      return null;
    } finally {
      setLoadingWithLog(false);
    }
  }, [isConnected, dexAddress, setLoadingWithLog, setErrorWithLog, logDebug, loading]);

  // 兑换 Token A 为 Token B
  const swapAForB = useCallback(async (amountIn: string, slippage: number = 0.5) => {
    if (!isConnected || !address) {
      setErrorWithLog('请先连接钱包');
      return null;
    }

    logDebug(`开始兑换 ${amountIn} TokenA 为 TokenB，滑点: ${slippage}%`);
    setLoadingWithLog(true);
    setErrorWithLog(null);
    setTxHashWithLog(null);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, signer);
      const tokenContract = new ethers.Contract(tokenAAddress, MockERC20Abi.abi, signer);
      
      // 先授权
      const amountInWei = ethers.parseUnits(amountIn, 18);
      logDebug(`授权 ${amountIn} TokenA...`);
      const approveTx = await tokenContract.approve(dexAddress, amountInWei);
      logDebug('授权交易已提交，等待确认...');
      await approveTx.wait();
      logDebug('授权交易已确认');
      
      // 然后兑换
      logDebug(`兑换 ${amountIn} TokenA 为 TokenB...`);
      const tx = await dexContract.swapAForB(amountInWei);
      logDebug('兑换交易已提交，等待确认...');
      const receipt = await tx.wait();
      logDebug('兑换交易已确认', receipt);
      setTxHashWithLog(receipt.hash);
      
      // 刷新余额
      logDebug('刷新余额...');
      await refreshBalances();
      logDebug('兑换完成');
      return true;
    } catch (err) {
      logDebug('兑换失败', err);
      setErrorWithLog('兑换失败');
      return false;
    } finally {
      setLoadingWithLog(false);
    }
  }, [isConnected, address, dexAddress, tokenAAddress, refreshBalances, setLoadingWithLog, setErrorWithLog, setTxHashWithLog, logDebug]);

  // 兑换 Token B 为 Token A
  const swapBForA = useCallback(async (amountIn: string, slippage: number = 0.5) => {
    if (!isConnected || !address) {
      setErrorWithLog('请先连接钱包');
      return null;
    }

    logDebug(`开始兑换 ${amountIn} TokenB 为 TokenA，滑点: ${slippage}%`);
    setLoadingWithLog(true);
    setErrorWithLog(null);
    setTxHashWithLog(null);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, signer);
      const tokenContract = new ethers.Contract(tokenBAddress, MockERC20Abi.abi, signer);
      
      // 先授权
      const amountInWei = ethers.parseUnits(amountIn, 18);
      logDebug(`授权 ${amountIn} TokenB...`);
      const approveTx = await tokenContract.approve(dexAddress, amountInWei);
      logDebug('授权交易已提交，等待确认...');
      await approveTx.wait();
      logDebug('授权交易已确认');
      
      // 然后兑换
      logDebug(`兑换 ${amountIn} TokenB 为 TokenA...`);
      const tx = await dexContract.swapBForA(amountInWei);
      logDebug('兑换交易已提交，等待确认...');
      const receipt = await tx.wait();
      logDebug('兑换交易已确认', receipt);
      setTxHashWithLog(receipt.hash);
      
      // 刷新余额
      logDebug('刷新余额...');
      await refreshBalances();
      logDebug('兑换完成');
      return true;
    } catch (err) {
      logDebug('兑换失败', err);
      setErrorWithLog('兑换失败');
      return false;
    } finally {
      setLoadingWithLog(false);
    }
  }, [isConnected, address, dexAddress, tokenBAddress, refreshBalances, setLoadingWithLog, setErrorWithLog, setTxHashWithLog, logDebug]);

  // 添加流动性
  const addLiquidity = useCallback(async (amountA: string, amountB: string) => {
    if (!isConnected || !address) {
      setErrorWithLog('请先连接钱包');
      return null;
    }

    logDebug(`开始添加流动性: ${amountA} TokenA + ${amountB} TokenB`);
    setLoadingWithLog(true);
    setErrorWithLog(null);
    setTxHashWithLog(null);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, signer);
      const tokenAContract = new ethers.Contract(tokenAAddress, MockERC20Abi.abi, signer);
      const tokenBContract = new ethers.Contract(tokenBAddress, MockERC20Abi.abi, signer);
      
      // 先授权 Token A
      const amountAWei = ethers.parseUnits(amountA, 18);
      logDebug(`授权 ${amountA} TokenA...`);
      const approveATx = await tokenAContract.approve(dexAddress, amountAWei);
      logDebug('TokenA授权交易已提交，等待确认...');
      await approveATx.wait();
      logDebug('TokenA授权交易已确认');
      
      // 再授权 Token B
      const amountBWei = ethers.parseUnits(amountB, 18);
      logDebug(`授权 ${amountB} TokenB...`);
      const approveBTx = await tokenBContract.approve(dexAddress, amountBWei);
      logDebug('TokenB授权交易已提交，等待确认...');
      await approveBTx.wait();
      logDebug('TokenB授权交易已确认');
      
      // 添加流动性
      logDebug(`添加流动性: ${amountA} TokenA + ${amountB} TokenB...`);
      const tx = await dexContract.addLiquidity(amountAWei, amountBWei);
      logDebug('添加流动性交易已提交，等待确认...');
      const receipt = await tx.wait();
      logDebug('添加流动性交易已确认', receipt);
      setTxHashWithLog(receipt.hash);
      
      // 刷新余额
      logDebug('刷新余额...');
      await refreshBalances();
      logDebug('添加流动性完成');
      return true;
    } catch (err) {
      logDebug('添加流动性失败', err);
      setErrorWithLog('添加流动性失败');
      return false;
    } finally {
      setLoadingWithLog(false);
    }
  }, [isConnected, address, dexAddress, tokenAAddress, tokenBAddress, refreshBalances, setLoadingWithLog, setErrorWithLog, setTxHashWithLog, logDebug]);

  // 移除流动性
  const removeLiquidity = useCallback(async (lpAmount: string) => {
    if (!isConnected || !address) {
      setErrorWithLog('请先连接钱包');
      return null;
    }

    logDebug(`开始移除流动性: ${lpAmount} LP`);
    setLoadingWithLog(true);
    setErrorWithLog(null);
    setTxHashWithLog(null);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, signer);
      
      // 移除流动性
      const lpAmountWei = ethers.parseUnits(lpAmount, 18);
      logDebug(`移除流动性: ${lpAmount} LP...`);
      const tx = await dexContract.removeLiquidity(lpAmountWei);
      logDebug('移除流动性交易已提交，等待确认...');
      const receipt = await tx.wait();
      logDebug('移除流动性交易已确认', receipt);
      setTxHashWithLog(receipt.hash);
      
      // 刷新余额
      logDebug('刷新余额...');
      await refreshBalances();
      logDebug('移除流动性完成');
      
      // 强制刷新池子信息
      await getPoolInfo(true);
      
      return true;
    } catch (err) {
      logDebug('移除流动性失败', err);
      setErrorWithLog('移除流动性失败');
      return false;
    } finally {
      logDebug('设置loading状态为false');
      setLoadingWithLog(false);
    }
  }, [isConnected, address, dexAddress, refreshBalances, setLoadingWithLog, setErrorWithLog, setTxHashWithLog, logDebug, getPoolInfo]);

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