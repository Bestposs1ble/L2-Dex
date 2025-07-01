import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { twMerge } from 'tailwind-merge';

// 定义样式类名合并函数
const cn = (...args: any[]) => twMerge(args.filter(Boolean).join(' '));

// 按钮变体类型
type ButtonVariant = 'primary' | 'danger' | 'success';

// 组件接口
interface LoadingButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  variant?: ButtonVariant;
}

// 获取按钮变体样式
const getVariantClasses = (variant: ButtonVariant): string => {
  switch (variant) {
    case 'primary':
      return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 text-white';
    case 'danger':
      return 'bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white';
    case 'success':
      return 'bg-green-500 hover:bg-green-600 focus:ring-green-500 text-white';
    default:
      return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 text-white';
  }
};

// 使用memo优化组件渲染
const LoadingButton: React.FC<LoadingButtonProps> = memo(({ 
  children, 
  onClick, 
  loading = false, 
  disabled = false, 
  className = '',
  id = '',
  variant = 'primary'
}) => {
  // 使用ref跟踪组件是否已挂载，避免内存泄漏
  const isMountedRef = useRef(true);
  
  // 调试用日志
  useEffect(() => {
    if (id) {
      console.log(`[${id}] 按钮状态变化:`, { loading, disabled });
    }
  }, [loading, disabled, id]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 包装onClick处理，避免重复点击
  const handleClick = useCallback(() => {
    if (!loading && !disabled) {
      onClick();
    }
  }, [onClick, loading, disabled]);

  // 获取按钮样式类
  const buttonClasses = cn(
    // 基础样式
    'w-full py-2 px-4 rounded-md font-medium transition-all duration-300 flex justify-center items-center focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:cursor-not-allowed',
    
    // 变体样式
    getVariantClasses(variant),
    
    // 加载和禁用状态样式
    loading && 'opacity-80 cursor-wait',
    disabled && 'opacity-60 hover:bg-opacity-100 bg-opacity-80',
    
    // 自定义样式
    className
  );

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      id={id || undefined}
      type="button"
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
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>处理中...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
});

// 显示组件名称，方便调试
LoadingButton.displayName = 'LoadingButton';

export default LoadingButton; 