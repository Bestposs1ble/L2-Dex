import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useDex } from '../hooks/useDex';

const AddLiquidity: React.FC = () => {
  const { isConnected, tokenABalance, tokenBBalance, lpBalance } = useWeb3();
  const { loading, error, txHash, addLiquidity, getPoolInfo } = useDex();
  
  const [amountA, setAmountA] = useState<string>('');
  const [amountB, setAmountB] = useState<string>('');
  const [estimatedLp, setEstimatedLp] = useState<string>('--');
  const [status, setStatus] = useState<string>('--');
  const [poolRatio, setPoolRatio] = useState<number | null>(null);

  // 获取池子信息
  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (isConnected) {
        const info = await getPoolInfo();
        if (info) {
          // 计算池子比例 B/A
          const ratio = parseFloat(info.reserveB) / parseFloat(info.reserveA);
          setPoolRatio(ratio);
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
      setStatus(`添加成功! 哈希: ${txHash.slice(0, 6)}...${txHash.slice(-4)}`);
    }
  }, [loading, error, txHash]);

  // 处理 TokenA 输入变化
  const handleAmountAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountA(value);
    
    // 如果有池子比例，自动计算 TokenB 数量
    if (poolRatio && value) {
      const tokenBValue = (parseFloat(value) * poolRatio).toFixed(6);
      setAmountB(tokenBValue);
      
      // 估算 LP Token 数量 (简化计算)
      const lpEstimate = (Math.sqrt(parseFloat(value) * parseFloat(tokenBValue)) * 0.99).toFixed(6);
      setEstimatedLp(lpEstimate);
    } else {
      setEstimatedLp('--');
    }
  };

  // 处理 TokenB 输入变化
  const handleAmountBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountB(value);
    
    // 如果有池子比例，自动计算 TokenA 数量
    if (poolRatio && value) {
      const tokenAValue = (parseFloat(value) / poolRatio).toFixed(6);
      setAmountA(tokenAValue);
      
      // 估算 LP Token 数量 (简化计算)
      const lpEstimate = (Math.sqrt(parseFloat(tokenAValue) * parseFloat(value)) * 0.99).toFixed(6);
      setEstimatedLp(lpEstimate);
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

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white/80 rounded-xl shadow-lg backdrop-blur-md">
      <h2 className="text-2xl font-bold mb-4 text-center">添加流动性</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium">TokenA 数量</label>
        <input 
          type="number" 
          className="w-full p-2 rounded border" 
          placeholder="输入 TokenA 数量" 
          value={amountA}
          onChange={handleAmountAChange}
        />
        <div className="text-sm text-gray-500 mt-1">
          余额: {tokenABalance}
        </div>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">TokenB 数量</label>
        <input 
          type="number" 
          className="w-full p-2 rounded border" 
          placeholder="输入 TokenB 数量" 
          value={amountB}
          onChange={handleAmountBChange}
        />
        <div className="text-sm text-gray-500 mt-1">
          余额: {tokenBBalance}
        </div>
      </div>
      <div className="mb-4 text-sm text-gray-600">预估可获得 LP Token: {estimatedLp}</div>
      <button 
        className={`w-full py-2 ${
          loading 
            ? 'bg-gray-400' 
            : 'bg-green-500 hover:bg-green-600'
        } text-white rounded transition`}
        onClick={handleAddLiquidity}
        disabled={loading || !isConnected}
      >
        {loading ? '处理中...' : '添加流动性'}
      </button>
      <div className={`mt-4 text-center text-sm ${
        error ? 'text-red-500' : txHash ? 'text-green-500' : 'text-gray-500'
      }`}>
        {status}
      </div>
      <div className="mt-4 text-center text-xs text-gray-500">* 添加前将自动进行 approve 授权</div>
    </div>
  );
};

export default AddLiquidity; 