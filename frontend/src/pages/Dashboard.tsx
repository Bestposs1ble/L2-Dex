import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useDex } from '../hooks/useDex';
import { ethers } from 'ethers';

interface Transaction {
  id: number;
  type: 'Swap' | 'AddLiquidity' | 'RemoveLiquidity';
  from?: string;
  to?: string;
  tokenA?: string;
  tokenB?: string;
  amount?: string;
  timestamp: number;
  hash?: string;
}

// 模拟交易历史数据
const mockTransactions: Transaction[] = [
  { id: 1, type: 'Swap', from: 'TokenA', to: 'TokenB', amount: '10', timestamp: new Date().getTime() - 3600000 },
  { id: 2, type: 'AddLiquidity', tokenA: '20', tokenB: '40', timestamp: new Date().getTime() - 7200000 },
  { id: 3, type: 'RemoveLiquidity', tokenA: '5', tokenB: '10', timestamp: new Date().getTime() - 86400000 },
];

const Dashboard: React.FC = () => {
  const { isConnected, lpBalance, dexAddress } = useWeb3();
  const { getPoolInfo } = useDex();
  
  const [reserveA, setReserveA] = useState<string>('--');
  const [reserveB, setReserveB] = useState<string>('--');
  const [price, setPrice] = useState<string>('--');
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
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

  // 格式化时间戳
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
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
        <h3 className="font-bold mb-2">最近交易历史</h3>
        <div className="text-sm text-gray-500 mb-2">
          注意：当前显示的是模拟数据。未来版本将实现链上交易历史查询功能。
        </div>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">类型</th>
                  <th className="py-2 px-4 border-b text-left">详情</th>
                  <th className="py-2 px-4 border-b text-left">时间</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2 px-4 border-b">{tx.type}</td>
                    <td className="py-2 px-4 border-b">
                      {tx.type === 'Swap' 
                        ? `${tx.amount} ${tx.from} → ${tx.to}`
                        : tx.type === 'AddLiquidity'
                          ? `添加: ${tx.tokenA} TokenA + ${tx.tokenB} TokenB`
                          : `移除: ${tx.tokenA} TokenA + ${tx.tokenB} TokenB`
                      }
                    </td>
                    <td className="py-2 px-4 border-b">{formatTime(tx.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-gray-500">-- 暂无数据 --</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 