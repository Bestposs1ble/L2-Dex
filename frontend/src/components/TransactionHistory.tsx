import React, { useState } from 'react';
import { useNetwork } from 'wagmi';
import { Transaction, TransactionType } from '../hooks/useTransactionHistory';
import { useWeb3 } from '../contexts/Web3Context';

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onFilter?: (type: TransactionType, address: string | null) => void;
  filterType?: TransactionType;
  filterAddress?: string | null;
  showFilters?: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  transactions, 
  loading, 
  error, 
  onRefresh,
  onFilter,
  filterType = 'All',
  filterAddress = null,
  showFilters = true
}) => {
  const { chain } = useNetwork();
  const { address } = useWeb3();
  const [selectedType, setSelectedType] = useState<TransactionType>(filterType);
  const [showMyTxOnly, setShowMyTxOnly] = useState<boolean>(filterAddress === address && !!address);

  // 格式化时间戳
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // 格式化地址
  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // 获取区块浏览器URL
  const getExplorerUrl = (type: 'tx' | 'address', hash: string) => {
    if (!chain) return '#';
    
    // 根据链ID返回对应的区块浏览器
    switch (chain.id) {
      case 421614: // Arbitrum Sepolia
        return `https://sepolia.arbiscan.io/${type}/${hash}`;
      case 1337: // Ganache
        return `#`; // 本地网络没有区块浏览器
      default:
        return `https://etherscan.io/${type}/${hash}`;
    }
  };

  // 处理类型筛选变化
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as TransactionType;
    setSelectedType(newType);
    if (onFilter) {
      onFilter(newType, showMyTxOnly && address ? address : null);
    }
  };

  // 处理"只看我的交易"变化
  const handleMyTxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setShowMyTxOnly(checked);
    if (onFilter) {
      onFilter(selectedType, checked && address ? address : null);
    }
  };

  // 检查地址是否匹配当前用户
  const isCurrentUser = (txUser: string): boolean => {
    return !!address && txUser.toLowerCase() === address.toLowerCase();
  };

  return (
    <div className="mt-2">
      {showFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <label htmlFor="txType" className="mr-2 text-sm">类型:</label>
            <select 
              id="txType" 
              className="p-1 text-sm border rounded"
              value={selectedType}
              onChange={handleTypeChange}
            >
              <option value="All">全部</option>
              <option value="Swap">交换</option>
              <option value="AddLiquidity">添加流动性</option>
              <option value="RemoveLiquidity">移除流动性</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="myTxOnly" 
              className="mr-1"
              checked={showMyTxOnly}
              onChange={handleMyTxChange}
              disabled={!address}
            />
            <label htmlFor="myTxOnly" className="text-sm">只看我的交易</label>
          </div>
          
          <button 
            onClick={onRefresh}
            disabled={loading}
            className="ml-auto text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-500 mb-2">{error}</div>
      )}
      
      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">类型</th>
                <th className="py-2 px-4 border-b text-left">用户</th>
                <th className="py-2 px-4 border-b text-left">详情</th>
                <th className="py-2 px-4 border-b text-left">时间</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className={`hover:bg-gray-50 ${isCurrentUser(tx.user) ? 'bg-blue-50' : ''}`}>
                  <td className="py-2 px-4 border-b">
                    {tx.type === 'Swap' ? (
                      <span className="text-green-600">交换</span>
                    ) : tx.type === 'AddLiquidity' ? (
                      <span className="text-blue-600">添加流动性</span>
                    ) : (
                      <span className="text-red-600">移除流动性</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <a 
                      href={getExplorerUrl('address', tx.user)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {isCurrentUser(tx.user) ? '我' : formatAddress(tx.user)}
                    </a>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {tx.type === 'Swap' 
                      ? `${tx.amountIn} ${tx.isAtoB ? 'TokenA → ' + tx.amountOut + ' TokenB' : 'TokenB → ' + tx.amountOut + ' TokenA'}`
                      : tx.type === 'AddLiquidity'
                        ? `添加: ${tx.amountA} TokenA + ${tx.amountB} TokenB (获得 ${tx.liquidity} LP)`
                        : `移除: ${tx.liquidity} LP (获得 ${tx.amountA} TokenA + ${tx.amountB} TokenB)`
                    }
                  </td>
                  <td className="py-2 px-4 border-b">
                    <a 
                      href={getExplorerUrl('tx', tx.hash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {formatTime(tx.timestamp)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : loading ? (
        <div className="text-center py-4">加载交易历史中...</div>
      ) : (
        <div className="text-center py-4 text-gray-500">暂无交易记录</div>
      )}
    </div>
  );
};

export default TransactionHistory; 