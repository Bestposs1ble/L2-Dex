import React from 'react';
import { useNetwork } from 'wagmi';

interface TransactionStatusProps {
  error: string | null;
  txHash: string | null;
  status: string;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({ error, txHash, status }) => {
  const { chain } = useNetwork();
  
  if (!status && !error && !txHash) return null;

  let statusClass = 'text-gray-500';
  let statusIcon: React.ReactNode = null;

  if (error) {
    statusClass = 'text-red-500';
    statusIcon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 mr-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  } else if (txHash) {
    statusClass = 'text-green-500';
    statusIcon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 mr-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    );
  }

  // 根据当前网络获取区块浏览器URL
  const getExplorerUrl = () => {
    if (!chain || !txHash) return '';
    
    // 根据链ID返回对应的区块浏览器
    switch (chain.id) {
      case 421614: // Arbitrum Sepolia
        return `https://sepolia.arbiscan.io/tx/${txHash}`;
      case 1337: // Ganache
        return `#`; // 本地网络没有区块浏览器
      default:
        return `https://etherscan.io/tx/${txHash}`; // 默认使用 Etherscan
    }
  };

  return (
    <div className={`mt-4 text-center text-sm flex items-center justify-center ${statusClass}`}>
      {statusIcon}
      <span>{status}</span>
      {txHash && chain && chain.id !== 1337 && (
        <a
          href={getExplorerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 underline"
        >
          查看
        </a>
      )}
    </div>
  );
};

export default TransactionStatus; 