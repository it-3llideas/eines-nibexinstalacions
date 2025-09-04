import { Button } from './ui/button';
import { Delete, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  onComplete?: (value: string) => void;
}

export default function PinPad({ value, onChange, maxLength = 6, onComplete }: PinPadProps) {
  const addDigit = (digit: string) => {
    if (value.length < maxLength) {
      const newValue = value + digit;
      onChange(newValue);

      if (newValue.length === maxLength && onComplete) {
        onComplete(newValue);
      }
    }
  };

  const removeDigit = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const clearAll = () => {
    onChange('');
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for all handled keys
      const handledKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Backspace', 'Delete', 'Escape', 'Enter'];
      if (handledKeys.includes(event.key)) {
        event.preventDefault();
      }

      // Handle number keys
      if (event.key >= '0' && event.key <= '9') {
        addDigit(event.key);
      }

      // Handle backspace (remove last digit)
      else if (event.key === 'Backspace') {
        removeDigit();
      }

      // Handle delete or escape (clear all)
      else if (event.key === 'Delete' || event.key === 'Escape') {
        clearAll();
      }

      // Handle enter (complete if full)
      else if (event.key === 'Enter' && value.length === maxLength && onComplete) {
        onComplete(value);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [value, maxLength, onComplete]);

  // Create array of dots to show entered digits
  const displayDots = Array(maxLength).fill(null).map((_, index) => (
    <div
      key={index}
      className={`w-6 h-6 rounded-full border-4 ${
        index < value.length 
          ? 'bg-red-500 border-red-500' 
          : 'bg-transparent border-gray-300'
      }`}
      style={{ 
        backgroundColor: index < value.length ? '#E2372B' : 'transparent',
        borderColor: index < value.length ? '#E2372B' : '#d1d5db'
      }}
    />
  ));

  return (
    <div
      className="flex flex-col items-center space-y-8 focus:outline-none"
      tabIndex={0}
      autoFocus
    >
      {/* Display dots */}
      <div className="flex gap-4 mb-4">
        {displayDots}
      </div>
      
      {/* Number grid */}
      <div className="grid grid-cols-3 gap-4 max-w-md">
        {/* Numbers 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <Button
            key={digit}
            onClick={() => addDigit(digit.toString())}
            className="w-20 h-20 text-3xl font-bold rounded-xl transition-all duration-200 transform hover:scale-110 active:scale-95"
            style={{ 
              backgroundColor: '#f8f9fa',
              color: '#E2372B',
              border: '2px solid #E2372B'
            }}
            variant="outline"
          >
            {digit}
          </Button>
        ))}
        
        {/* Bottom row: Clear, 0, Delete */}
        <Button
          onClick={clearAll}
          className="w-20 h-20 text-lg font-bold rounded-xl transition-all duration-200 transform hover:scale-110 active:scale-95"
          style={{ 
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '2px solid #dc2626'
          }}
          variant="outline"
          title="Borrar todo"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
        
        <Button
          onClick={() => addDigit('0')}
          className="w-20 h-20 text-3xl font-bold rounded-xl transition-all duration-200 transform hover:scale-110 active:scale-95"
          style={{ 
            backgroundColor: '#f8f9fa',
            color: '#E2372B',
            border: '2px solid #E2372B'
          }}
          variant="outline"
        >
          0
        </Button>
        
        <Button
          onClick={removeDigit}
          className="w-20 h-20 text-lg font-bold rounded-xl transition-all duration-200 transform hover:scale-110 active:scale-95"
          style={{ 
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '2px solid #dc2626'
          }}
          variant="outline"
          title="Borrar último"
        >
          <Delete className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Instructions */}
      <p className="text-lg text-gray-500 text-center max-w-sm">
        {value.length === 0 && 'Toca los números o usa el teclado para introducir tu código'}
        {value.length > 0 && value.length < maxLength && `Código: ${value.length}/${maxLength} dígitos`}
        {value.length === maxLength && '¡Código completo! Verificando...'}
      </p>
    </div>
  );
}
