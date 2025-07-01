import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useDex } from '../hooks/useDex';
import { useTransactionHistory, TransactionType } from '../hooks/useTransactionHistory';
import { ethers } from 'ethers';
import TokenInput from '../components/TokenInput';
import LoadingButton from '../components/LoadingButton';
import TransactionStatus from '../components/TransactionStatus';
import TransactionHistory from '../components/TransactionHistory';
import TestButton from '../components/TestButton';
import SimpleDEXAbi from '../abis/SimpleDEX.json';

const RemoveLiquidity: React.FC = () => {
  const { isConnected, lpBalance, dexAddress } = useWeb3();
  const { loading, error, txHash, removeLiquidity, getPoolInfo } = useDex();
  const { 
    transactions, 
    loading: txLoading, 
    error: txError, 
    fetchTransactionHistory,
    filterTransactions,
    filterType,
    filterAddress
  } = useTransactionHistory('RemoveLiquidity');
  
  const [lpAmount, setLpAmount] = useState<string>('');
  const [estimatedA, setEstimatedA] = useState<string>('--');
  const [estimatedB, setEstimatedB] = useState<string>('--');
  const [status, setStatus] = useState<string>('');
  const [poolInfo, setPoolInfo] = useState<{reserveA: string, reserveB: string} | null>(null);
  const [totalLpSupply, setTotalLpSupply] = useState<string>('0');
  const [hasLpBalance, setHasLpBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'remove' | 'history'>('remove');
  const [wsError, setWsError] = useState<boolean>(false);
  
  // 添加测试模式状态
  const [showDebugTools, setShowDebugTools] = useState(false);
  
  // 切换测试模式
  const toggleDebugTools = useCallback(() => {
    setShowDebugTools(prev => !prev);
  }, []);

  // 添加调试日志，跟踪loading状态变化 - 使用useEffect减少
  useEffect(() => {
    console.log('[RemoveLiquidity] loading状态变化:', loading);
    console.log('[RemoveLiquidity] 当前状态:', {
      error,
      txHash,
      status,
      lpAmount,
      hasLpBalance,
      isConnected
    });
  }, [loading, error, txHash, status, lpAmount, hasLpBalance, isConnected]);

  // 获取池子信息和 LP 总供应量 - 优化为useCallback
  const fetchPoolInfo = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      // 获取池子信息
      const info = await getPoolInfo();
      if (info) {
        setPoolInfo({
          reserveA: info.reserveA,
          reserveB: info.reserveB
        });
      }
      
      // 获取 LP 总供应量，添加错误处理
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          // 移除WebSocket直接访问，使用try-catch来处理可能的连接错误
          
          const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, provider);
          const supply = await dexContract.totalSupply();
          setTotalLpSupply(ethers.formatUnits(supply, 18));
        } catch (wsErr) {
          console.error('[RemoveLiquidity] 获取LP总供应量失败:', wsErr);
          // WebSocket错误不影响界面显示
          setWsError(true);
        }
      }
      
      // 检查用户是否有 LP 余额
      setHasLpBalance(parseFloat(lpBalance) > 0);
    } catch (err) {
      console.error('[RemoveLiquidity] 获取池子信息失败:', err);
    }
  }, [isConnected, getPoolInfo, dexAddress, lpBalance]);

  // 首次加载数据
  useEffect(() => {
    if (isConnected) {
      fetchPoolInfo();
    }
  }, [isConnected, fetchPoolInfo]);

  // 监听交易状态变化 - 优化为避免无意义的状态更新
  useEffect(() => {
    console.log('[RemoveLiquidity] 交易状态变化:', { loading, error, txHash });
    
    if (loading) {
      // 当按钮已经显示loading状态时，不在状态区域重复显示
      if (status !== '') setStatus('');
    } else if (error) {
      const errorMsg = `错误: ${error}`;
      if (status !== errorMsg) setStatus(errorMsg);
    } else if (txHash) {
      const successMsg = `移除成功! 哈希: ${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
      if (status !== successMsg) {
        setStatus(successMsg);
        // 交易成功后刷新交易历史
        fetchTransactionHistory(20);
        // 交易成功后刷新池子信息
        fetchPoolInfo();
      }
    } else if (status !== '') {
      // 重置状态
      setStatus('');
    }
  }, [loading, error, txHash, fetchTransactionHistory, status, fetchPoolInfo]);

  // 处理 LP Token 输入变化 - 转为useCallback
  const handleLpAmountChange = useCallback((value: string) => {
    setLpAmount(value);
    
    // 估算返还的 Token 数量
    if (poolInfo && value && parseFloat(value) > 0 && parseFloat(totalLpSupply) > 0) {
      const lpRatio = parseFloat(value) / parseFloat(totalLpSupply);
      
      const tokenAEstimate = (lpRatio * parseFloat(poolInfo.reserveA)).toFixed(6);
      const tokenBEstimate = (lpRatio * parseFloat(poolInfo.reserveB)).toFixed(6);
      
      setEstimatedA(tokenAEstimate);
      setEstimatedB(tokenBEstimate);
    } else {
      setEstimatedA('--');
      setEstimatedB('--');
    }
  }, [poolInfo, totalLpSupply]);

  // 处理移除流动性按钮点击 - 转为useCallback
  const handleRemoveLiquidity = useCallback(async () => {
    if (!lpAmount || parseFloat(lpAmount) <= 0) {
      setStatus('请输入有效的 LP Token 数量');
      return;
    }

    console.log('[RemoveLiquidity] 开始移除流动性:', lpAmount);
    try {
      await removeLiquidity(lpAmount);
      console.log('[RemoveLiquidity] 移除流动性成功');
    } catch (err) {
      console.error('[RemoveLiquidity] 移除流动性失败:', err);
      setStatus('移除流动性失败');
    }
  }, [lpAmount, removeLiquidity]);

  // 手动刷新交易历史 - 转为useCallback
  const handleRefreshHistory = useCallback(() => {
    fetchTransactionHistory(20);
  }, [fetchTransactionHistory]);

  // 处理交易历史过滤 - 转为useCallback
  const handleFilterTransactions = useCallback((type: TransactionType, address: string | null) => {
    filterTransactions(type, address);
  }, [filterTransactions]);
  
  // 计算按钮是否应该禁用 - 使用useMemo优化
  const isButtonDisabled = useMemo(() => {
    return !isConnected || parseFloat(lpAmount || '0') <= 0;
  }, [isConnected, lpAmount]);

  // 处理标签切换 - 转为useCallback
  const handleTabChange = useCallback((tab: 'remove' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      fetchTransactionHistory(20);
    }
  }, [fetchTransactionHistory]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white/80 rounded-xl shadow-lg backdrop-blur-md">
      <h2 className="text-2xl font-bold mb-4 text-center">移除流动性</h2>
      
      {/* 调试工具开关 */}
      <div className="mb-2 text-right">
        <button 
          onClick={toggleDebugTools}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {showDebugTools ? '关闭调试' : '显示调试'}
        </button>
      </div>
      
      {/* 调试信息 */}
      {showDebugTools && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <div>loading: {String(loading)}</div>
          <div>error: {error || 'null'}</div>
          <div>txHash: {txHash || 'null'}</div>
          <div>status: {status || 'empty'}</div>
          <div>isConnected: {String(isConnected)}</div>
          <div>hasLpBalance: {String(hasLpBalance)}</div>
          <div>lpAmount: {lpAmount || 'empty'}</div>
          <div>isButtonDisabled: {String(isButtonDisabled)}</div>
          <div>wsError: {String(wsError)}</div>
        </div>
      )}
      
      {/* 测试按钮 */}
      {showDebugTools && (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          <h3 className="text-sm font-medium mb-2">测试按钮</h3>
          <TestButton id="test-primary" variant="primary" />
          <TestButton id="test-success" variant="success" />
          <TestButton id="test-danger" variant="danger" />
        </div>
      )}
      
      {/* 标签页切换 */}
      <div className="flex mb-4 border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'remove' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => handleTabChange('remove')}
        >
          移除流动性
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => handleTabChange('history')}
        >
          交易历史
        </button>
      </div>
      
      {activeTab === 'remove' ? (
        !isConnected ? (
          <div className="text-center py-4 text-gray-500">请先连接钱包</div>
        ) : !hasLpBalance ? (
          <div className="text-center py-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-yellow-600">您没有 LP 代币</p>
            <p className="text-sm text-yellow-500 mt-1">请先在"添加流动性"页面添加流动性</p>
          </div>
        ) : (
          <>
            <TokenInput
              label="LP Token 数量"
              value={lpAmount}
              onChange={handleLpAmountChange}
              balance={lpBalance}
              placeholder="输入 LP Token 数量"
            />
            
            <div className="mb-4 text-sm text-gray-600">
              <div>预估返还:</div>
              <div className="flex justify-between px-2 py-1 bg-gray-50 rounded mt-1">
                <span>TokenA:</span>
                <span className="font-medium">{estimatedA}</span>
              </div>
              <div className="flex justify-between px-2 py-1 bg-gray-50 rounded mt-1">
                <span>TokenB:</span>
                <span className="font-medium">{estimatedB}</span>
              </div>
            </div>
            
            {/* 添加调试信息 */}
            <div className="mb-2 text-xs text-gray-400">
              按钮状态: loading={String(loading)}, disabled={String(isButtonDisabled)}
            </div>
            
            <LoadingButton
              id="remove-liquidity-button"
              loading={loading}
              onClick={handleRemoveLiquidity}
              disabled={isButtonDisabled}
              variant="danger"
            >
              移除流动性
            </LoadingButton>
            
            {/* 只在非loading状态或有错误时显示状态信息 */}
            {(!loading || error) && (
              <TransactionStatus
                error={error}
                txHash={txHash}
                status={status}
              />
            )}
          </>
        )
      ) : (
        <TransactionHistory 
          transactions={transactions}
          loading={txLoading}
          error={txError}
          onRefresh={handleRefreshHistory}
          onFilter={handleFilterTransactions}
          filterType={filterType}
          filterAddress={filterAddress}
        />
      )}
    </div>
  );
};

export default RemoveLiquidity; 