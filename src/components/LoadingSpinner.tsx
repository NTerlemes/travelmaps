import styled, { keyframes } from 'styled-components';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  overlay?: boolean;
}

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const Container = styled.div<{ $overlay?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;

  ${props => props.$overlay && `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 100;
    backdrop-filter: blur(2px);
  `}
`;

const Spinner = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;

  ${props => {
    switch (props.$size) {
      case 'small':
        return `
          width: 20px;
          height: 20px;
          border-width: 2px;
        `;
      case 'large':
        return `
          width: 48px;
          height: 48px;
          border-width: 4px;
        `;
      case 'medium':
      default:
        return `
          width: 32px;
          height: 32px;
          border-width: 3px;
        `;
    }
  }}
`;

const Message = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  color: #666;
  text-align: center;
  font-weight: 500;

  ${props => {
    switch (props.$size) {
      case 'small':
        return `font-size: 12px;`;
      case 'large':
        return `font-size: 18px;`;
      case 'medium':
      default:
        return `font-size: 14px;`;
    }
  }}
`;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  overlay = false
}) => {
  return (
    <Container $overlay={overlay}>
      <Spinner $size={size} />
      {message && <Message $size={size}>{message}</Message>}
    </Container>
  );
};