import React from 'react';

interface TokenInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  balance?: string;
  disabled?: boolean;
  placeholder?: string;
}

const TokenInput: React.FC<TokenInputProps> = ({
  label,
  value,
  onChange,
  balance,
  disabled = false,
  placeholder = '输入数量',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleMaxClick = () => {
    if (balance) {
      onChange(balance);
    }
  };

  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium">{label}</label>
      <div className="relative">
        <input
          type="number"
          className={`w-full p-2 rounded border ${disabled ? 'bg-gray-100' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
        />
        {balance && (
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-500">余额: {balance}</span>
            <button
              type="button"
              className="text-xs text-blue-500 hover:text-blue-700 transition"
              onClick={handleMaxClick}
              disabled={disabled}
            >
              最大
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenInput; 