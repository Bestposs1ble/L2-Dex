import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useNetwork, useBalance, useSwitchNetwork } from 'wagmi';
import { ethers } from 'ethers';

// 导入合约 ABI
// 注意：这些文件需要在合约编译后从artifacts目录复制到前端
import SimpleDEXAbi from '../abis/SimpleDEX.json';
import MockERC20Abi from '../abis/MockERC20.json';

// 为 window.ethereum 添加类型声明
declare global {
  interface Window {
    ethereum?: any;
  }
}

// 用 import 方式导入合约地址配置
import { CONTRACT_ADDRESSES } from '../config/addresses';
const tokenAAddress = CONTRACT_ADDRESSES.tokenA;
const tokenBAddress = CONTRACT_ADDRESSES.tokenB;
const dexAddress = CONTRACT_ADDRESSES.dex;

// 支持的网络
const SUPPORTED_NETWORKS = [
  {
    id: 421614,
    name: 'Arbitrum Sepolia',
  },
  {
    id: 1337,
    name: 'Ganache',
  }
];

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
  isNetworkSupported: boolean;
  switchToSupportedNetwork: () => Promise<void>;
  networkName: string;
}

const defaultContext: Web3ContextType = {
  isConnected: false,
  address: undefined,
  chainId: undefined,
  tokenABalance: '0',
  tokenBBalance: '0',
  lpBalance: '0',
  // 使用导入的合约地址
  tokenAAddress,
  tokenBAddress,
  dexAddress,
  refreshBalances: async () => {},
  isNetworkSupported: false,
  switchToSupportedNetwork: async () => {},
  networkName: '',
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
  const { switchNetwork } = useSwitchNetwork();
  const [tokenABalance, setTokenABalance] = useState('0');
  const [tokenBBalance, setTokenBBalance] = useState('0');
  const [lpBalance, setLpBalance] = useState('0');
  const [isNetworkSupported, setIsNetworkSupported] = useState(false);
  const [networkName, setNetworkName] = useState('');

  // 检查网络是否支持
  useEffect(() => {
    if (chain) {
      const supported = SUPPORTED_NETWORKS.some(network => network.id === chain.id);
      setIsNetworkSupported(supported);
      
      // 设置网络名称
      const network = SUPPORTED_NETWORKS.find(n => n.id === chain.id);
      setNetworkName(network ? network.name : chain.name || '未知网络');
    } else {
      setIsNetworkSupported(false);
      setNetworkName('');
    }
  }, [chain]);

  const refreshBalances = async () => {
    if (!isConnected || !address || !window.ethereum || !isNetworkSupported) return;
    
    try {
      // 使用 ethers.js 与合约交互获取余额
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 获取 TokenA 余额
      const tokenA = new ethers.Contract(tokenAAddress, MockERC20Abi.abi, provider);
      const balanceA = await tokenA.balanceOf(address);
      setTokenABalance(ethers.formatUnits(balanceA, 18));
      
      // 获取 TokenB 余额
      const tokenB = new ethers.Contract(tokenBAddress, MockERC20Abi.abi, provider);
      const balanceB = await tokenB.balanceOf(address);
      setTokenBBalance(ethers.formatUnits(balanceB, 18));
      
      // 获取 LP 代币余额
      const dex = new ethers.Contract(dexAddress, SimpleDEXAbi.abi, provider);
      const balanceLP = await dex.balanceOf(address);
      setLpBalance(ethers.formatUnits(balanceLP, 18));
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  };

  // 切换到支持的网络
  const switchToSupportedNetwork = async () => {
    if (switchNetwork) {
      // 默认切换到 Arbitrum Sepolia
      await switchNetwork(421614);
    } else {
      console.error('无法切换网络');
    }
  };

  useEffect(() => {
    if (isConnected && isNetworkSupported) {
      refreshBalances();
    }
  }, [isConnected, address, chain, isNetworkSupported]);

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
    isNetworkSupported,
    switchToSupportedNetwork,
    networkName,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
} 