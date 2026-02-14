import { useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onRemove: (id: string) => void;
}

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ $type: ToastType; $isExiting?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  animation: ${props => props.$isExiting ? slideOut : slideIn} 0.3s ease-in-out;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateX(-4px);
  }

  ${props => {
    switch (props.$type) {
      case 'success':
        return css`
          background: rgba(76, 175, 80, 0.95);
          color: white;
          border-left: 4px solid #4CAF50;
        `;
      case 'error':
        return css`
          background: rgba(244, 67, 54, 0.95);
          color: white;
          border-left: 4px solid #f44336;
        `;
      case 'warning':
        return css`
          background: rgba(255, 193, 7, 0.95);
          color: #333;
          border-left: 4px solid #FFC107;
        `;
      case 'info':
      default:
        return css`
          background: rgba(33, 150, 243, 0.95);
          color: white;
          border-left: 4px solid #2196F3;
        `;
    }
  }}
`;

const ToastIcon = styled.div<{ $type: ToastType }>`
  font-size: 20px;
  flex-shrink: 0;
`;

const ToastMessage = styled.div`
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const getIcon = (type: ToastType): string => {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': default: return 'ℹ️';
  }
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 4000,
  onRemove
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  return (
    <ToastContainer
      $type={type}
      onClick={() => onRemove(id)}
      role="alert"
      aria-live="polite"
    >
      <ToastIcon $type={type}>
        {getIcon(type)}
      </ToastIcon>
      <ToastMessage>{message}</ToastMessage>
      <CloseButton
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
        aria-label="Close notification"
      >
        ×
      </CloseButton>
    </ToastContainer>
  );
};