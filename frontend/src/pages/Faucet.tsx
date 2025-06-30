import React, { useState } from 'react';
import { ethers } from 'ethers';
import MockERC20Abi from '../abis/MockERC20.json';
import { useWeb3 } from '../contexts/Web3Context';

const Faucet: React.FC = () => {
  const { tokenAAddress, tokenBAddress, isConnected } = useWeb3();
  const [targetAddress, setTargetAddress] = useState('');
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [statusA, setStatusA] = useState('');
  const [statusB, setStatusB] = useState('');

  const handleFaucet = async (tokenAddress: string, setLoading: (b: boolean) => void, setStatus: (s: string) => void) => {
    if (!window.ethereum) {
      setStatus('请安装钱包');
      return;
    }
    if (!ethers.isAddress(targetAddress)) {
      setStatus('请输入有效地址');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new ethers.Contract(tokenAddress, MockERC20Abi.abi, signer);
      const tx = await token.mint(targetAddress, ethers.parseUnits('100', 18));
      await tx.wait();
      setStatus('领取成功！');
    } catch (e: any) {
      setStatus('领取失败: ' + (e?.reason || e?.message || '未知错误'));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white/80 rounded-xl shadow-lg backdrop-blur-md">
      <h2 className="text-2xl font-bold mb-4 text-center">测试币水龙头</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium">领取地址</label>
        <input
          type="text"
          className="w-full p-2 rounded border"
          placeholder="输入要领取的地址"
          value={targetAddress}
          onChange={e => setTargetAddress(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-4">
        <button
          className={`w-full py-2 rounded ${loadingA ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white transition`}
          disabled={loadingA || !isConnected}
          onClick={() => handleFaucet(tokenAAddress, setLoadingA, setStatusA)}
        >
          {loadingA ? '领取中...' : '领取100个 TokenA'}
        </button>
        {statusA && <div className="text-sm text-center text-gray-700">{statusA}</div>}
        <button
          className={`w-full py-2 rounded ${loadingB ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white transition`}
          disabled={loadingB || !isConnected}
          onClick={() => handleFaucet(tokenBAddress, setLoadingB, setStatusB)}
        >
          {loadingB ? '领取中...' : '领取100个 TokenB'}
        </button>
        {statusB && <div className="text-sm text-center text-gray-700">{statusB}</div>}
      </div>
      <div className="mt-4 text-xs text-gray-500 text-center">* 领取后请在钱包导入 TokenA/B 合约地址查看余额</div>
    </div>
  );
};

export default Faucet; 