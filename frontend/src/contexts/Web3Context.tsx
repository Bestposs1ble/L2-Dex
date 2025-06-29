import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useNetwork, useBalance } from 'wagmi';
import { ethers } from 'ethers';

// 这里将来会导入合约 ABI
// import SimpleDEXAbi from '../abis/SimpleDEX.json';
// import MockERC20Abi from '../abis/MockERC20.json';

interface Web3ContextType {
  isConnected: boolean;
  address: string | undefined;
  chainId: number | undefined;
  tokenABalance: string;
  tokenBBalance: string;
  lpBalance: string;
  tokenAAddress: string;
  tokenBAddress: string;
  dexAddress: string;
  refreshBalances: () => Promise<void>;
}

const defaultContext: Web3ContextType = {
  isConnected: false,
  address: undefined,
  chainId: undefined,
  tokenABalance: '0',
  tokenBBalance: '0',
  lpBalance: '0',
  tokenAAddress: '0x0000000000000000000000000000000000000000',
  tokenBAddress: '0x0000000000000000000000000000000000000000',
  dexAddress: '0x0000000000000000000000000000000000000000',
  refreshBalances: async () => {},
};

const Web3Context = createContext<Web3ContextType>(defaultContext);

export function useWeb3() {
  return useContext(Web3Context);
}

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [tokenABalance, setTokenABalance] = useState('0');
  const [tokenBBalance, setTokenBBalance] = useState('0');
  const [lpBalance, setLpBalance] = useState('0');
  
  // 合约地址 - 这些将来会从配置或环境变量中获取
  const tokenAAddress = '0x0000000000000000000000000000000000000000';
  const tokenBAddress = '0x0000000000000000000000000000000000000000';
  const dexAddress = '0x0000000000000000000000000000000000000000';

  const refreshBalances = async () => {
    if (!isConnected || !address) return;
    
    try {
      // 这里将来会实现实际的余额获取逻辑
      // 使用 ethers.js 与合约交互
      // 例如:
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const tokenA = new ethers.Contract(tokenAAddress, MockERC20Abi, provider);
      // const balanceA = await tokenA.balanceOf(address);
      // setTokenABalance(ethers.utils.formatUnits(balanceA, 18));
      
      // 现在我们只是设置一些模拟数据
      setTokenABalance('1000');
      setTokenBBalance('2000');
      setLpBalance('500');
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  };

  useEffect(() => {
    if (isConnected) {
      refreshBalances();
    }
  }, [isConnected, address, chain]);

  const value = {
    isConnected,
    address,
    chainId: chain?.id,
    tokenABalance,
    tokenBBalance,
    lpBalance,
    tokenAAddress,
    tokenBAddress,
    dexAddress,
    refreshBalances,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
} 