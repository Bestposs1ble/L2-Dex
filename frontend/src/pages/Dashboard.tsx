import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useDex } from '../hooks/useDex';
import { useTransactionHistory, TransactionType } from '../hooks/useTransactionHistory';
import { ethers } from 'ethers';
import TransactionHistory from '../components/TransactionHistory';

const Dashboard: React.FC = () => {
  const { isConnected, lpBalance, dexAddress } = useWeb3();
  const { getPoolInfo } = useDex();
  const { 
    transactions, 
    loading: txLoading, 
    error: txError, 
    fetchTransactionHistory,
    filterTransactions,
    filterType,
    filterAddress
  } = useTransactionHistory('All');
  
  const [reserveA, setReserveA] = useState<string>('--');
  const [reserveB, setReserveB] = useState<string>('--');
  const [price, setPrice] = useState<string>('--');
  const [loading, setLoading] = useState(false);
  const [hasLiquidity, setHasLiquidity] = useState(false);
  const [totalLpSupply, setTotalLpSupply] = useState<string>('0');

  // 获取池子信息
  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (isConnected) {
        setLoading(true);
        try {
          const info = await getPoolInfo();
          if (info) {
            setReserveA(info.reserveA);
            setReserveB(info.reserveB);
            setPrice(info.price);
            // 检查是否有流动性
            setHasLiquidity(
              parseFloat(info.reserveA) > 0 && 
              parseFloat(info.reserveB) > 0
            );
          } else {
            // 如果 getPoolInfo 返回 null，说明池子可能为空
            setHasLiquidity(false);
          }
          
          // 获取 LP 总供应量
          if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const dexContract = new ethers.Contract(dexAddress, [
              'function totalSupply() view returns (uint256)'
            ], provider);
            const supply = await dexContract.totalSupply();
            setTotalLpSupply(ethers.formatUnits(supply, 18));
          }
        } catch (err) {
          console.error('获取池子信息失败:', err);
          setHasLiquidity(false);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPoolInfo();
    // 每 10 秒刷新一次数据
    const interval = setInterval(fetchPoolInfo, 10000);
    return () => clearInterval(interval);
  }, [isConnected, getPoolInfo, dexAddress]);

  // 手动刷新交易历史
  const handleRefreshHistory = () => {
    fetchTransactionHistory(20);
  };

  // 处理交易历史过滤
  const handleFilterTransactions = (type: TransactionType, address: string | null) => {
    filterTransactions(type, address);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white/80 rounded-xl shadow-lg backdrop-blur-md">
      <h2 className="text-2xl font-bold mb-4 text-center">池子状态 Dashboard</h2>
      
      {loading ? (
        <div className="text-center py-4">加载中...</div>
      ) : !isConnected ? (
        <div className="text-center py-4 text-gray-500">请先连接钱包</div>
      ) : !hasLiquidity ? (
        <div className="text-center py-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <p className="text-yellow-600">池子暂无流动性</p>
          <p className="text-sm text-yellow-500 mt-1">请先在"添加流动性"页面添加初始流动性</p>
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 rounded">
            <div className="font-medium">TokenA 储备量</div>
            <div className="text-lg">{reserveA}</div>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <div className="font-medium">TokenB 储备量</div>
            <div className="text-lg">{reserveB}</div>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <div className="font-medium">实时价格 (B/A)</div>
            <div className="text-lg">{price}</div>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <div className="font-medium">我的 LP 持仓</div>
            <div className="text-lg">{lpBalance}</div>
          </div>
          <div className="p-4 bg-gray-100 rounded col-span-2">
            <div className="font-medium">LP 代币总供应量</div>
            <div className="text-lg">{totalLpSupply}</div>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="font-bold mb-2">交易历史</h3>
        <TransactionHistory 
          transactions={transactions}
          loading={txLoading}
          error={txError}
          onRefresh={handleRefreshHistory}
          onFilter={handleFilterTransactions}
          filterType={filterType}
          filterAddress={filterAddress}
          showFilters={true}
        />
      </div>
    </div>
  );
};

export default Dashboard; 