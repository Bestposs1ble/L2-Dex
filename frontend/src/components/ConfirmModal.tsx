import React, { useEffect, useRef } from 'react';
import LoadingButton from './LoadingButton';
import { useTheme } from '../contexts/ThemeContext';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  loading?: boolean;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg';
  danger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  loading = false,
  children,
  confirmText = '确认',
  cancelText = '取消',
  size = 'md',
  danger = false,
}) => {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, loading]);
  
  // Close modal when clicking outside
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node) && !loading) {
      onClose();
    }
  };
  
  // Size classes for the modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOutsideClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"></div>
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={`relative z-10 ${sizeClasses[size]} w-full rounded-lg shadow-lg bg-white dark:bg-gray-800 border dark:border-gray-700`}
      >
        <div className={`border-b px-6 py-4 ${danger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${danger ? 'text-red-600 dark:text-red-400' : ''}`}>
              {title}
            </h3>
            <button 
              onClick={loading ? undefined : onClose}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="关闭"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={loading ? undefined : onClose}
            disabled={loading}
            className="px-4 py-2 rounded text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <LoadingButton
            loading={loading}
            onClick={onConfirm}
            variant={danger ? 'danger' : 'primary'}
            size="md"
            className="min-w-[100px]"
          >
            {confirmText}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal; 