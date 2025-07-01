import { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import SimpleDEXAbi from '../abis/SimpleDEX.json';

export interface Transaction {
  id: string; // 交易hash + event index 作为唯一ID
  type: 'Swap' | 'AddLiquidity' | 'RemoveLiquidity';
  user: string;
  amountA?: string;
  amountB?: string;
  liquidity?: string;
  amountIn?: string;
  amountOut?: string;
  isAtoB?: boolean;
  timestamp: number;
  blockNumber: number;
  hash: string;
}

export type TransactionType = 'Swap' | 'AddLiquidity' | 'RemoveLiquidity' | 'All';

export function useTransactionHistory(defaultType: TransactionType = 'All') {
  const { isConnected, dexAddress, address } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [pendingRefresh, setPendingRefresh] = useState<boolean>(false);
  const [lastRefreshedBlock, setLastRefreshedBlock] = useState<number>(0);
  const [filterType, setFilterType] = useState<TransactionType>(defaultType);
  const [filterAddress, setFilterAddress] = useState<string | null>(null);
  
  // 使用useRef存储事件监听器，避免重复创建
  const eventListenersRef = useRef<{
    refreshWithDebounce: (() => void) | null;
    eventsUpdateTimer: NodeJS.Timeout | null;
  }>({
    refreshWithDebounce: null,
    eventsUpdateTimer: null
  });

  // 使用useRef存储交易缓存
  const txCacheRef = useRef<{ [key: string]: Transaction }>({});

  // 使用useCallback包装fetchTransactionHistory，避免无限循环
  const fetchTransactionHistory = useCallback(async (limit = 10) => {
    if (!isConnected || !window.ethereum) {
      console.log('[TransactionHistory] 未连接钱包，无法获取交易历史');
      setError('请先连接钱包');
      return;
    }

    if (!dexAddress) {
      console.log('[TransactionHistory] DEX地址为空，无法获取交易历史');
      setError('DEX合约地址无效');
      return;
    }

    // 避免重复加载
    if (loading) {
      console.log('[TransactionHistory] 已有请求进行中，标记为待处理');
      setPendingRefresh(true); // 标记为有一个待处理的刷新请求
      return;
    }

    setLoading(true);
    setError(null);
    setPendingRefresh(false);
    
    console.log('[TransactionHistory] 开始获取交易历史...');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const dexContract = new ethers.Contract(
        dexAddress, 
        SimpleDEXAbi.abi, 
        provider
      );
      
      // 获取当前区块
      const currentBlock = await provider.getBlockNumber();
      console.log(`[TransactionHistory] 当前区块: ${currentBlock}`);
      
      // 如果区块没有变化，且有交易记录，则无需刷新
      if (currentBlock === lastRefreshedBlock && transactions.length > 0) {
        console.log('[TransactionHistory] 区块未变化，无需刷新');
        setLoading(false);
        return;
      }
      
      // 查询过去1000个区块的事件，但如果已经有缓存，我们可以只查询新区块
      const fromBlock = lastRefreshedBlock > 0 ? lastRefreshedBlock + 1 : Math.max(0, currentBlock - 1000);
      
      // 如果没有新区块，且已有交易记录，直接返回
      if (fromBlock > currentBlock && transactions.length > 0) {
        console.log('[TransactionHistory] 没有新区块，无需刷新');
        setLoading(false);
        return;
      }
      
      console.log(`[TransactionHistory] 查询区块范围: ${fromBlock} 到 ${currentBlock}`);
      
      try {
        // 并行获取所有类型的事件
        const [swapEvents, addLiquidityEvents, removeLiquidityEvents] = await Promise.all([
          dexContract.queryFilter(dexContract.filters.Swap(), fromBlock, currentBlock),
          dexContract.queryFilter(dexContract.filters.AddLiquidity(), fromBlock, currentBlock),
          dexContract.queryFilter(dexContract.filters.RemoveLiquidity(), fromBlock, currentBlock)
        ]);
        
        console.log(`[TransactionHistory] 查询到事件: Swap=${swapEvents.length}, AddLiquidity=${addLiquidityEvents.length}, RemoveLiquidity=${removeLiquidityEvents.length}`);
        
        // 只处理新的事件
        if (swapEvents.length === 0 && addLiquidityEvents.length === 0 && removeLiquidityEvents.length === 0) {
          // 没有新事件，只更新区块号
          console.log('[TransactionHistory] 没有新事件');
          setLastRefreshedBlock(currentBlock);
          setLastRefreshTime(Date.now());
          setLoading(false);
          return;
        }
        
        // 处理Swap事件
        const swapTxs = await Promise.all(swapEvents.map(async (event: any) => {
          try {
            const txId = `${event.transactionHash}-${event.index}`;
            
            // 检查缓存
            if (txCacheRef.current[txId]) {
              return txCacheRef.current[txId];
            }
            
            const block = await event.getBlock();
            const tx = {
              id: txId,
              type: 'Swap' as const,
              user: event.args[0],
              amountIn: ethers.formatUnits(event.args[1], 18),
              amountOut: ethers.formatUnits(event.args[2], 18),
              isAtoB: event.args[3],
              timestamp: block.timestamp * 1000, // 转为毫秒
              blockNumber: event.blockNumber,
              hash: event.transactionHash
            };
            
            // 添加到缓存
            txCacheRef.current[txId] = tx;
            return tx;
          } catch (err) {
            console.error('[TransactionHistory] 处理Swap事件失败:', err);
            return null;
          }
        }));
        
        // 处理AddLiquidity事件
        const addLiquidityTxs = await Promise.all(addLiquidityEvents.map(async (event: any) => {
          try {
            const txId = `${event.transactionHash}-${event.index}`;
            
            // 检查缓存
            if (txCacheRef.current[txId]) {
              return txCacheRef.current[txId];
            }
            
            const block = await event.getBlock();
            const tx = {
              id: txId,
              type: 'AddLiquidity' as const,
              user: event.args[0],
              amountA: ethers.formatUnits(event.args[1], 18),
              amountB: ethers.formatUnits(event.args[2], 18),
              liquidity: ethers.formatUnits(event.args[3], 18),
              timestamp: block.timestamp * 1000, // 转为毫秒
              blockNumber: event.blockNumber,
              hash: event.transactionHash
            };
            
            // 添加到缓存
            txCacheRef.current[txId] = tx;
            return tx;
          } catch (err) {
            console.error('[TransactionHistory] 处理AddLiquidity事件失败:', err);
            return null;
          }
        }));
        
        // 处理RemoveLiquidity事件
        const removeLiquidityTxs = await Promise.all(removeLiquidityEvents.map(async (event: any) => {
          try {
            const txId = `${event.transactionHash}-${event.index}`;
            
            // 检查缓存
            if (txCacheRef.current[txId]) {
              return txCacheRef.current[txId];
            }
            
            const block = await event.getBlock();
            const tx = {
              id: txId,
              type: 'RemoveLiquidity' as const,
              user: event.args[0],
              amountA: ethers.formatUnits(event.args[1], 18),
              amountB: ethers.formatUnits(event.args[2], 18),
              liquidity: ethers.formatUnits(event.args[3], 18),
              timestamp: block.timestamp * 1000, // 转为毫秒
              blockNumber: event.blockNumber,
              hash: event.transactionHash
            };
            
            // 添加到缓存
            txCacheRef.current[txId] = tx;
            return tx;
          } catch (err) {
            console.error('[TransactionHistory] 处理RemoveLiquidity事件失败:', err);
            return null;
          }
        }));
        
        // 过滤掉处理失败的事件（null值）
        const validSwapTxs = swapTxs.filter(tx => tx !== null) as Transaction[];
        const validAddLiquidityTxs = addLiquidityTxs.filter(tx => tx !== null) as Transaction[];
        const validRemoveLiquidityTxs = removeLiquidityTxs.filter(tx => tx !== null) as Transaction[];
        
        // 合并所有事件和现有事件
        const newTxs = [...validSwapTxs, ...validAddLiquidityTxs, ...validRemoveLiquidityTxs];
        
        console.log(`[TransactionHistory] 有效新事件数量: ${newTxs.length}`);
        
        // 如果有新事件，将其添加到现有事件列表中
        if (newTxs.length > 0) {
          // 合并并去重
          const txMap = new Map<string, Transaction>();
          
          // 先添加现有事件到Map
          transactions.forEach(tx => txMap.set(tx.id, tx));
          
          // 添加新事件，会自动覆盖已存在的事件
          newTxs.forEach(tx => txMap.set(tx.id, tx));
          
          // 转回数组并排序
          const allTxs = Array.from(txMap.values())
            .sort((a, b) => b.timestamp - a.timestamp) // 按时间降序排列
            .slice(0, Math.max(limit, transactions.length)); // 保留至少与现有事件数量相同的事件
            
          console.log(`[TransactionHistory] 更新交易历史，共${allTxs.length}条记录`);
          setTransactions(allTxs);
        }
      } catch (queryError) {
        console.error('[TransactionHistory] 查询事件失败:', queryError);
        setError('查询区块链事件失败');
      }
      
      setLastRefreshTime(Date.now());
      setLastRefreshedBlock(currentBlock);
    } catch (err) {
      console.error('[TransactionHistory] 获取交易历史失败:', err);
      setError('获取交易历史失败');
    } finally {
      setLoading(false);
      // 如果有待处理的刷新请求，延迟执行
      if (pendingRefresh) {
        setTimeout(() => {
          fetchTransactionHistory(limit);
        }, 1000);
      }
    }
  }, [isConnected, dexAddress, lastRefreshedBlock, transactions.length]);

  // 应用过滤器
  useEffect(() => {
    let filtered = [...transactions];
    
    // 按类型过滤
    if (filterType !== 'All') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }
    
    // 按地址过滤
    if (filterAddress) {
      filtered = filtered.filter(tx => tx.user.toLowerCase() === filterAddress.toLowerCase());
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, filterType, filterAddress]);

  // 监听区块链事件，使用稳定的事件处理
  useEffect(() => {
    if (!isConnected || !window.ethereum || !dexAddress) return;

    console.log('[TransactionHistory] 初始化事件监听...');
    
    // 初始加载
    fetchTransactionHistory(20);

    // 设置定时刷新，每60秒刷新一次，减少页面刷新频率
    const intervalId = setInterval(() => {
      console.log('[TransactionHistory] 定时刷新交易历史');
      fetchTransactionHistory(20);
    }, 60000);

    // 设置事件监听
    const setupEventListeners = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, provider);
        
        // 创建防抖函数，避免短时间内多次触发刷新
        const refreshWithDebounce = () => {
          if (eventListenersRef.current.eventsUpdateTimer) {
            clearTimeout(eventListenersRef.current.eventsUpdateTimer);
          }
          
          // 设置新的计时器，延迟2秒后执行，合并多个事件触发
          eventListenersRef.current.eventsUpdateTimer = setTimeout(() => {
            console.log('[TransactionHistory] 检测到新的链上事件，刷新交易历史');
            fetchTransactionHistory(20);
          }, 2000);
        };
        
        eventListenersRef.current.refreshWithDebounce = refreshWithDebounce;
        
        // 监听所有事件
        dexContract.on('Swap', refreshWithDebounce);
        dexContract.on('AddLiquidity', refreshWithDebounce);
        dexContract.on('RemoveLiquidity', refreshWithDebounce);
        
        console.log('[TransactionHistory] 事件监听器设置成功');
      } catch (err) {
        console.error('[TransactionHistory] 设置事件监听失败:', err);
      }
    };
    
    setupEventListeners();
    
    // 清理函数
    return () => {
      clearInterval(intervalId);
      
      // 移除事件监听
      const cleanupListeners = async () => {
        try {
          if (window.ethereum && dexAddress) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, provider);
            
            if (eventListenersRef.current.refreshWithDebounce) {
              dexContract.off('Swap', eventListenersRef.current.refreshWithDebounce);
              dexContract.off('AddLiquidity', eventListenersRef.current.refreshWithDebounce);
              dexContract.off('RemoveLiquidity', eventListenersRef.current.refreshWithDebounce);
            }
            
            if (eventListenersRef.current.eventsUpdateTimer) {
              clearTimeout(eventListenersRef.current.eventsUpdateTimer);
            }
            
            console.log('[TransactionHistory] 事件监听器已清理');
          }
        } catch (err) {
          console.error('[TransactionHistory] 清理事件监听失败:', err);
        }
      };
      
      cleanupListeners();
    };
  }, [isConnected, dexAddress, fetchTransactionHistory]);

  // 过滤交易历史的函数
  const filterTransactions = useCallback((type: TransactionType = 'All', userAddress: string | null = null) => {
    setFilterType(type);
    setFilterAddress(userAddress);
  }, []);

  // 获取我的交易历史
  const getMyTransactions = useCallback(() => {
    if (address) {
      filterTransactions('All', address);
    }
  }, [address, filterTransactions]);

  // 清除过滤器
  const clearFilters = useCallback(() => {
    setFilterType('All');
    setFilterAddress(null);
  }, []);

  return {
    transactions: filteredTransactions,
    allTransactions: transactions,
    loading,
    error,
    lastRefreshTime,
    fetchTransactionHistory,
    filterTransactions,
    getMyTransactions,
    clearFilters,
    filterType,
    filterAddress
  };
} 