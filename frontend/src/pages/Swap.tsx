import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useDex } from '../hooks/useDex';
import { useTransactionHistory, TransactionType } from '../hooks/useTransactionHistory';
import TokenInput from '../components/TokenInput';
import LoadingButton from '../components/LoadingButton';
import TransactionStatus from '../components/TransactionStatus';
import TransactionHistory from '../components/TransactionHistory';

const Swap: React.FC = () => {
  const { isConnected, tokenABalance, tokenBBalance } = useWeb3();
  const { loading, error, txHash, swapAForB, swapBForA, getPoolInfo } = useDex();
  const { 
    transactions, 
    loading: txLoading, 
    error: txError, 
    fetchTransactionHistory,
    filterTransactions,
    filterType,
    filterAddress
  } = useTransactionHistory('Swap');
  
  const [direction, setDirection] = useState<'AtoB' | 'BtoA'>('AtoB');
  const [amount, setAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<string>('0.5');
  const [price, setPrice] = useState<string>('--');
  const [estimatedGas, setEstimatedGas] = useState<string>('--');
  const [status, setStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'swap' | 'history'>('swap');

  // 获取实时价格
  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (isConnected) {
        const info = await getPoolInfo();
        if (info) {
          setPrice(info.price);
          // 模拟 gas 费用计算
          setEstimatedGas('0.001 ETH');
        }
      }
    };

    fetchPoolInfo();
    // 每 10 秒刷新一次价格
    const interval = setInterval(fetchPoolInfo, 10000);
    return () => clearInterval(interval);
  }, [isConnected, getPoolInfo]);

  // 监听交易状态变化
  useEffect(() => {
    if (loading) {
      // 当按钮已经显示loading状态时，不在状态区域重复显示
      setStatus('');
    } else if (error) {
      setStatus(`错误: ${error}`);
    } else if (txHash) {
      setStatus(`交易成功! 哈希: ${txHash.slice(0, 6)}...${txHash.slice(-4)}`);
      // 交易成功后刷新交易历史
      fetchTransactionHistory(20);
    } else {
      // 重置状态
      setStatus('');
    }
  }, [loading, error, txHash, fetchTransactionHistory]);

  // 处理兑换方向变化
  const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDirection(e.target.value as 'AtoB' | 'BtoA');
    setAmount(''); // 清空输入金额
  };

  // 处理金额输入变化
  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  // 处理滑点输入变化
  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlippage(e.target.value);
  };

  // 处理兑换按钮点击
  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setStatus('请输入有效金额');
      return;
    }

    try {
      if (direction === 'AtoB') {
        await swapAForB(amount, parseFloat(slippage));
      } else {
        await swapBForA(amount, parseFloat(slippage));
      }
    } catch (err) {
      console.error('交易失败:', err);
      setStatus('交易失败');
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
      <h2 className="text-2xl font-bold mb-4 text-center">Swap 兑换</h2>
      
      {/* 标签页切换 */}
      <div className="flex mb-4 border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'swap' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('swap')}
        >
          兑换
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
      
      {activeTab === 'swap' ? (
        <>
          <div className="mb-4">
            <label className="block mb-1 font-medium">选择代币</label>
            <select 
              className="w-full p-2 rounded border"
              value={direction}
              onChange={handleDirectionChange}
            >
              <option value="AtoB">TokenA → TokenB</option>
              <option value="BtoA">TokenB → TokenA</option>
            </select>
          </div>
          
          <TokenInput 
            label={direction === 'AtoB' ? 'TokenA 数量' : 'TokenB 数量'}
            value={amount}
            onChange={handleAmountChange}
            balance={direction === 'AtoB' ? tokenABalance : tokenBBalance}
            placeholder="输入数量"
          />
          
          <div className="mb-4">
            <label className="block mb-1 font-medium">滑点容忍度 (%)</label>
            <input 
              type="number" 
              className="w-full p-2 rounded border" 
              placeholder="默认 0.5%" 
              value={slippage}
              onChange={handleSlippageChange}
            />
          </div>
          <div className="mb-4 flex justify-between text-sm text-gray-600">
            <span>实时价格: {price}</span>
            <span>Gas 费用: {estimatedGas}</span>
          </div>
          
          <LoadingButton 
            loading={loading}
            onClick={handleSwap}
            disabled={!isConnected || parseFloat(amount || '0') <= 0}
            variant="primary"
          >
            Swap
          </LoadingButton>
          
          {/* 只在非loading状态下显示状态信息 */}
          {(!loading || error) && (
            <TransactionStatus
              error={error}
              txHash={txHash}
              status={status}
            />
          )}
        </>
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

export default Swap; 