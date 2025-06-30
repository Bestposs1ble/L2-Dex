import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  RainbowKitProvider,
  ConnectButton,
  getDefaultWallets
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import '@rainbow-me/rainbowkit/styles.css';

// 导入页面
import Swap from './pages/Swap';
import AddLiquidity from './pages/AddLiquidity';
import RemoveLiquidity from './pages/RemoveLiquidity';
import Dashboard from './pages/Dashboard';
import Faucet from './pages/Faucet';

// 导入 Web3Provider
import { Web3Provider, useWeb3 } from './contexts/Web3Context';

// 定义 Ganache 本地网络
const ganache = {
  id: 1337,
  name: 'Ganache',
  network: 'ganache',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://localhost:8545'] },
    default: { http: ['http://localhost:8545'] },
  },
};

// 配置 wagmi
const { chains, publicClient } = configureChains(
  [arbitrumSepolia, ganache],
  [publicProvider()]
);

// 使用环境变量或默认值
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '12345678901234567890123456789012';

const { connectors } = getDefaultWallets({
  appName: 'L2 DEX',
  projectId,
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

// 网络切换提示组件
const NetworkAlert = () => {
  const { isConnected, isNetworkSupported, switchToSupportedNetwork, networkName } = useWeb3();
  
  if (!isConnected || isNetworkSupported) return null;
  
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
      <div className="flex">
        <div className="py-1">
          <svg className="h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="font-bold">网络不支持</p>
          <p className="text-sm">当前网络 ({networkName}) 不受支持。请切换到 Arbitrum Sepolia 或 Ganache。</p>
          <button 
            onClick={switchToSupportedNetwork} 
            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm"
          >
            切换网络
          </button>
        </div>
      </div>
    </div>
  );
};

// 应用主组件
const AppContent = () => {
  return (
    <Router>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="w-full p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-700">L2 DEX</h1>
          <ConnectButton />
        </header>
        
        <div className="container mx-auto px-4">
          <NetworkAlert />
        </div>
        
        <nav className="w-full mt-4 bg-white/70 backdrop-blur-md rounded-lg shadow-sm">
          <ul className="flex justify-center p-2">
            <li className="mx-2">
              <Link to="/" className="px-4 py-2 rounded hover:bg-indigo-100 transition">Swap</Link>
            </li>
            <li className="mx-2">
              <Link to="/add-liquidity" className="px-4 py-2 rounded hover:bg-indigo-100 transition">添加流动性</Link>
            </li>
            <li className="mx-2">
              <Link to="/remove-liquidity" className="px-4 py-2 rounded hover:bg-indigo-100 transition">移除流动性</Link>
            </li>
            <li className="mx-2">
              <Link to="/dashboard" className="px-4 py-2 rounded hover:bg-indigo-100 transition">数据看板</Link>
            </li>
            <li className="mx-2">
              <Link to="/faucet" className="px-4 py-2 rounded hover:bg-indigo-100 transition">水龙头</Link>
            </li>
          </ul>
        </nav>
        
        <main className="w-full p-4">
          <Routes>
            <Route path="/" element={<Swap />} />
            <Route path="/add-liquidity" element={<AddLiquidity />} />
            <Route path="/remove-liquidity" element={<RemoveLiquidity />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/faucet" element={<Faucet />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Web3Provider>
          <AppContent />
        </Web3Provider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;
