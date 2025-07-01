import React, { useState, useEffect } from 'react';

interface TestButtonProps {
  id: string;
  variant: 'primary' | 'danger' | 'success';
}

const TestButton: React.FC<TestButtonProps> = ({ id, variant }) => {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  
  // 基础样式
  const baseClasses = 'w-full py-2 rounded transition text-white';
  
  // 变体样式
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600',
    danger: 'bg-red-500 hover:bg-red-600',
    success: 'bg-green-500 hover:bg-green-600'
  };
  
  // 最终样式
  const buttonClass = `${baseClasses} ${loading ? 'bg-gray-400 cursor-not-allowed' : variantClasses[variant]}`;
  
  // 模拟加载状态
  const handleClick = () => {
    if (loading) return;
    
    setLoading(true);
    setCount(prev => prev + 1);
    
    // 3秒后恢复
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };
  
  // 记录渲染次数
  useEffect(() => {
    console.log(`[TestButton ${id}] 渲染, loading=${loading}, count=${count}, class=${buttonClass}`);
  });
  
  return (
    <div className="mb-4">
      <div className="text-xs text-gray-400 mb-1">
        按钮ID: {id}, 点击次数: {count}, 状态: {loading ? '加载中' : '正常'}
      </div>
      <button
        id={id}
        className={buttonClass}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            处理中...
          </div>
        ) : (
          `测试按钮 ${id} (${variant})`
        )}
      </button>
    </div>
  );
};

export default TestButton; 