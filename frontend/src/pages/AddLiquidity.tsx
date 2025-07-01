import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useDex } from '../hooks/useDex';
import { useTransactionHistory, TransactionType } from '../hooks/useTransactionHistory';
import TokenInput from '../components/TokenInput';
import LoadingButton from '../components/LoadingButton';
import TransactionStatus from '../components/TransactionStatus';
import TransactionHistory from '../components/TransactionHistory';

const AddLiquidity: React.FC = () => {
  const { isConnected, tokenABalance, tokenBBalance, lpBalance } = useWeb3();
  const { loading, error, txHash, addLiquidity, getPoolInfo } = useDex();
  const { 
    transactions, 
    loading: txLoading, 
    error: txError, 
    fetchTransactionHistory,
    filterTransactions,
    filterType,
    filterAddress
  } = useTransactionHistory('AddLiquidity');
  
  const [amountA, setAmountA] = useState<string>('');
  const [amountB, setAmountB] = useState<string>('');
  const [estimatedLp, setEstimatedLp] = useState<string>('--');
  const [status, setStatus] = useState<string>('');
  const [poolRatio, setPoolRatio] = useState<number | null>(null);
  const [isFirstLiquidity, setIsFirstLiquidity] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'history'>('add');

  // 获取池子信息
  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (isConnected) {
        const info = await getPoolInfo();
        if (info) {
          // 计算池子比例 B/A
          const ratio = parseFloat(info.reserveB) / parseFloat(info.reserveA);
          setPoolRatio(ratio);
          setIsFirstLiquidity(false);
        } else {
          // 如果 getPoolInfo 返回 null 或者抛出错误，可能是因为池子还没有流动性
          setPoolRatio(null);
          setIsFirstLiquidity(true);
        }
      }
    };

    fetchPoolInfo();
  }, [isConnected, getPoolInfo]);

  // 监听交易状态变化
  useEffect(() => {
    if (loading) {
      // 当按钮已经显示loading状态时，不在状态区域重复显示
      setStatus('');
    } else if (error) {
      setStatus(`错误: ${error}`);
    } else if (txHash) {
      setStatus(`添加成功! 哈希: ${txHash.slice(0, 6)}...${txHash.slice(-4)}`);
      // 交易成功后刷新交易历史
      fetchTransactionHistory(20);
    } else {
      // 重置状态
      setStatus('');
    }
  }, [loading, error, txHash, fetchTransactionHistory]);

  // 处理 TokenA 输入变化
  const handleAmountAChange = (value: string) => {
    setAmountA(value);
    
    // 如果有池子比例，自动计算 TokenB 数量
    if (poolRatio && value) {
      const tokenBValue = (parseFloat(value) * poolRatio).toFixed(6);
      setAmountB(tokenBValue);
      
      // 估算 LP Token 数量 (简化计算)
      const lpEstimate = (Math.sqrt(parseFloat(value) * parseFloat(tokenBValue)) * 0.99).toFixed(6);
      setEstimatedLp(lpEstimate);
    } else if (isFirstLiquidity && value) {
      // 首次添加流动性时，LP = sqrt(amountA * amountB)
      const lpEstimate = (Math.sqrt(parseFloat(value) * parseFloat(amountB || '0')) * 0.99).toFixed(6);
      setEstimatedLp(parseFloat(lpEstimate) > 0 ? lpEstimate : '--');
    } else {
      setEstimatedLp('--');
    }
  };

  // 处理 TokenB 输入变化
  const handleAmountBChange = (value: string) => {
    setAmountB(value);
    
    // 如果有池子比例，自动计算 TokenA 数量
    if (poolRatio && value) {
      const tokenAValue = (parseFloat(value) / poolRatio).toFixed(6);
      setAmountA(tokenAValue);
      
      // 估算 LP Token 数量 (简化计算)
      const lpEstimate = (Math.sqrt(parseFloat(tokenAValue) * parseFloat(value)) * 0.99).toFixed(6);
      setEstimatedLp(lpEstimate);
    } else if (isFirstLiquidity && value) {
      // 首次添加流动性时，LP = sqrt(amountA * amountB)
      const lpEstimate = (Math.sqrt(parseFloat(amountA || '0') * parseFloat(value)) * 0.99).toFixed(6);
      setEstimatedLp(parseFloat(lpEstimate) > 0 ? lpEstimate : '--');
    } else {
      setEstimatedLp('--');
    }
  };

  // 处理添加流动性按钮点击
  const handleAddLiquidity = async () => {
    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      setStatus('请输入有效金额');
      return;
    }

    try {
      await addLiquidity(amountA, amountB);
    } catch (err) {
      console.error('添加流动性失败:', err);
      setStatus('添加流动性失败');
    }
  };

  // 手动刷新交易历史
  const handleRefreshHistory = () => {
    fetchTransactionHistory(20);
  };

  // 处理交易历史过滤
  const handleFilterTransactions = (type: TransactionType, address: string | null) => {
    filterTransactions(type, address);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white/80 rounded-xl shadow-lg backdrop-blur-md">
      <h2 className="text-2xl font-bold mb-4 text-center">添加流动性</h2>
      
      {/* 标签页切换 */}
      <div className="flex mb-4 border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'add' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('add')}
        >
          添加流动性
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => {
            setActiveTab('history');
            fetchTransactionHistory(20);
          }}
        >
          交易历史
        </button>
      </div>
      
      {activeTab === 'add' ? (
        !isConnected ? (
          <div className="text-center py-4 text-gray-500">请先连接钱包</div>
        ) : (
          <>
            {isFirstLiquidity && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-blue-600 font-medium">首次添加流动性</p>
                <p className="text-sm text-blue-500 mt-1">
                  您将成为第一个提供流动性的用户，可以自由设置代币比例。
                </p>
              </div>
            )}
            
            <TokenInput 
              label="TokenA 数量"
              value={amountA}
              onChange={handleAmountAChange}
              balance={tokenABalance}
              placeholder="输入 TokenA 数量"
            />
            
            <TokenInput 
              label="TokenB 数量"
              value={amountB}
              onChange={handleAmountBChange}
              balance={tokenBBalance}
              placeholder="输入 TokenB 数量"
            />
            
            <div className="mb-4 text-sm text-gray-600">预估可获得 LP Token: {estimatedLp}</div>
            
            <LoadingButton 
              loading={loading}
              onClick={handleAddLiquidity}
              disabled={loading || !isConnected || parseFloat(amountA || '0') <= 0 || parseFloat(amountB || '0') <= 0}
              variant="success"
            >
              添加流动性
            </LoadingButton>
            
            {/* 只在非loading状态下显示状态信息 */}
            {(!loading || error) && (
              <TransactionStatus
                error={error}
                txHash={txHash}
                status={status}
              />
            )}
            
            <div className="mt-4 text-center text-xs text-gray-500">* 添加前将自动进行 approve 授权</div>
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

export default AddLiquidity; 