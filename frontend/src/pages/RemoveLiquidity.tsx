import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useDex } from '../hooks/useDex';

const RemoveLiquidity: React.FC = () => {
  const { isConnected, lpBalance } = useWeb3();
  const { loading, error, txHash, removeLiquidity, getPoolInfo } = useDex();
  
  const [lpAmount, setLpAmount] = useState<string>('');
  const [estimatedA, setEstimatedA] = useState<string>('--');
  const [estimatedB, setEstimatedB] = useState<string>('--');
  const [status, setStatus] = useState<string>('--');
  const [poolInfo, setPoolInfo] = useState<{reserveA: string, reserveB: string} | null>(null);

  // 获取池子信息
  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (isConnected) {
        const info = await getPoolInfo();
        if (info) {
          setPoolInfo({
            reserveA: info.reserveA,
            reserveB: info.reserveB
          });
        }
      }
    };

    fetchPoolInfo();
  }, [isConnected, getPoolInfo]);

  // 监听交易状态变化
  useEffect(() => {
    if (loading) {
      setStatus('处理中...');
    } else if (error) {
      setStatus(`错误: ${error}`);
    } else if (txHash) {
      setStatus(`移除成功! 哈希: ${txHash.slice(0, 6)}...${txHash.slice(-4)}`);
    }
  }, [loading, error, txHash]);

  // 处理 LP Token 输入变化
  const handleLpAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLpAmount(value);
    
    // 估算返还的 Token 数量
    if (poolInfo && value && parseFloat(value) > 0) {
      // 假设总 LP 供应量为 1000 (实际应从合约获取)
      const totalLpSupply = 1000;
      const lpRatio = parseFloat(value) / totalLpSupply;
      
      const tokenAEstimate = (lpRatio * parseFloat(poolInfo.reserveA)).toFixed(6);
      const tokenBEstimate = (lpRatio * parseFloat(poolInfo.reserveB)).toFixed(6);
      
      setEstimatedA(tokenAEstimate);
      setEstimatedB(tokenBEstimate);
    } else {
      setEstimatedA('--');
      setEstimatedB('--');
    }
  };

  // 处理移除流动性按钮点击
  const handleRemoveLiquidity = async () => {
    if (!lpAmount || parseFloat(lpAmount) <= 0) {
      setStatus('请输入有效的 LP Token 数量');
      return;
    }

    try {
      await removeLiquidity(lpAmount);
    } catch (err) {
      console.error('移除流动性失败:', err);
      setStatus('移除流动性失败');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white/80 rounded-xl shadow-lg backdrop-blur-md">
      <h2 className="text-2xl font-bold mb-4 text-center">移除流动性</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium">LP Token 数量</label>
        <input 
          type="number" 
          className="w-full p-2 rounded border" 
          placeholder="输入 LP Token 数量" 
          value={lpAmount}
          onChange={handleLpAmountChange}
        />
        <div className="text-sm text-gray-500 mt-1">
          余额: {lpBalance}
        </div>
      </div>
      <div className="mb-4 text-sm text-gray-600">
        预估返还: TokenA {estimatedA} / TokenB {estimatedB}
      </div>
      <button 
        className={`w-full py-2 ${
          loading 
            ? 'bg-gray-400' 
            : 'bg-red-500 hover:bg-red-600'
        } text-white rounded transition`}
        onClick={handleRemoveLiquidity}
        disabled={loading || !isConnected}
      >
        {loading ? '处理中...' : '移除流动性'}
      </button>
      <div className={`mt-4 text-center text-sm ${
        error ? 'text-red-500' : txHash ? 'text-green-500' : 'text-gray-500'
      }`}>
        {status}
      </div>
    </div>
  );
};

export default RemoveLiquidity; 