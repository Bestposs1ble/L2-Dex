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

// 导入 Web3Provider
import { Web3Provider } from './contexts/Web3Context';

// 配置 wagmi
const { chains, publicClient } = configureChains(
  [arbitrumSepolia],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'L2 DEX',
  projectId: '12345678901234567890123456789012', // 这是一个示例项目 ID，实际项目中应该使用真实的 ID
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Web3Provider>
          <Router>
            <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
              <header className="w-full p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-indigo-700">L2 DEX</h1>
                <ConnectButton />
              </header>
              
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
                </ul>
              </nav>
              
              <main className="w-full p-4">
                <Routes>
                  <Route path="/" element={<Swap />} />
                  <Route path="/add-liquidity" element={<AddLiquidity />} />
                  <Route path="/remove-liquidity" element={<RemoveLiquidity />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </main>
            </div>
          </Router>
        </Web3Provider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;
