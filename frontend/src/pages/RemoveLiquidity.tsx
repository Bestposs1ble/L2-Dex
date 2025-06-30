import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useDex } from '../hooks/useDex';
import { ethers } from 'ethers';
import TokenInput from '../components/TokenInput';
import LoadingButton from '../components/LoadingButton';
import TransactionStatus from '../components/TransactionStatus';
import SimpleDEXAbi from '../abis/SimpleDEX.json';

const RemoveLiquidity: React.FC = () => {
  const { isConnected, lpBalance, dexAddress } = useWeb3();
  const { loading, error, txHash, removeLiquidity, getPoolInfo } = useDex();
  
  const [lpAmount, setLpAmount] = useState<string>('');
  const [estimatedA, setEstimatedA] = useState<string>('--');
  const [estimatedB, setEstimatedB] = useState<string>('--');
  const [status, setStatus] = useState<string>('--');
  const [poolInfo, setPoolInfo] = useState<{reserveA: string, reserveB: string} | null>(null);
  const [totalLpSupply, setTotalLpSupply] = useState<string>('0');
  const [hasLpBalance, setHasLpBalance] = useState(false);

  // 获取池子信息和 LP 总供应量
  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (isConnected) {
        try {
          // 获取池子信息
          const info = await getPoolInfo();
          if (info) {
            setPoolInfo({
              reserveA: info.reserveA,
              reserveB: info.reserveB
            });
          }
          
          // 获取 LP 总供应量
          if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const dexContract = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, provider);
            const supply = await dexContract.totalSupply();
            setTotalLpSupply(ethers.formatUnits(supply, 18));
          }
          
          // 检查用户是否有 LP 余额
          setHasLpBalance(parseFloat(lpBalance) > 0);
        } catch (err) {
          console.error('获取池子信息失败:', err);
        }
      }
    };

    fetchPoolInfo();
  }, [isConnected, getPoolInfo, dexAddress, lpBalance]);

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
  const handleLpAmountChange = (value: string) => {
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
      
      {!isConnected ? (
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
          
          <LoadingButton
            loading={loading}
            onClick={handleRemoveLiquidity}
            disabled={!isConnected || parseFloat(lpAmount || '0') <= 0}
            className="bg-red-500 hover:bg-red-600"
          >
            移除流动性
          </LoadingButton>
          
          <TransactionStatus
            error={error}
            txHash={txHash}
            status={status}
          />
        </>
      )}
    </div>
  );
};

export default RemoveLiquidity; 