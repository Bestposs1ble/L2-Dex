import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useDex } from '../hooks/useDex';

// 模拟交易历史数据
const mockTransactions = [
  { id: 1, type: 'Swap', from: 'TokenA', to: 'TokenB', amount: '10', timestamp: new Date().getTime() - 3600000 },
  { id: 2, type: 'AddLiquidity', tokenA: '20', tokenB: '40', timestamp: new Date().getTime() - 7200000 },
  { id: 3, type: 'RemoveLiquidity', tokenA: '5', tokenB: '10', timestamp: new Date().getTime() - 86400000 },
];

const Dashboard: React.FC = () => {
  const { isConnected, lpBalance } = useWeb3();
  const { getPoolInfo } = useDex();
  
  const [reserveA, setReserveA] = useState<string>('--');
  const [reserveB, setReserveB] = useState<string>('--');
  const [price, setPrice] = useState<string>('--');
  const [transactions, setTransactions] = useState(mockTransactions);
  const [loading, setLoading] = useState(false);

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
          }
        } catch (err) {
          console.error('获取池子信息失败:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPoolInfo();
    // 每 10 秒刷新一次数据
    const interval = setInterval(fetchPoolInfo, 10000);
    return () => clearInterval(interval);
  }, [isConnected, getPoolInfo]);

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
            <div className="font-medium">实时价格 (A/B)</div>
            <div className="text-lg">{price}</div>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <div className="font-medium">我的 LP 持仓</div>
            <div className="text-lg">{lpBalance}</div>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="font-bold mb-2">最近交易历史</h3>
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