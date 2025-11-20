import React from 'react';

type LoaderEnums = 'circle' | 'line' | 'breathing' | 'ellipsis';
type Size = 'sm' | 'md' | 'lg' | 'xl';
type Color = 'primary' | 'light' | 'dark';

interface LoaderProps {
  visible?: boolean;
  text?: string;
  size?: Size;
  color?: Color;
  backdrop?: boolean;
  blocking?: boolean;
  type?: LoaderEnums;
  showTextEllipsis?: boolean;
}

const sizeMap = {
  sm: { h: 'h-8', w: 'w-8', dot: 'h-2 w-2', lineHeight: 'h-1', textSize: 'text-sm' },
  md: { h: 'h-12', w: 'w-12', dot: 'h-3 w-3', lineHeight: 'h-1.5', textSize: 'text-base' },
  lg: { h: 'h-16', w: 'w-16', dot: 'h-4 w-4', lineHeight: 'h-2', textSize: 'text-lg' },
  xl: { h: 'h-24', w: 'w-24', dot: 'h-5 w-5', lineHeight: 'h-2.5', textSize: 'text-xl' },
  circle: {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  }
};

const colorMap = {
  primary: {
    border: 'border-border',
    bg: 'bg-card-5',
    text: 'text-primary',
  },
  light: {
    border: 'border-border',
    bg: 'bg-card-5',
    text: 'text-text',
  },
  dark: {
    border: 'border-border',
    bg: 'card',
    text: 'text-text',
  },
};

const Loader: React.FC<LoaderProps> = ({
  visible = true,
  text = '',
  size = 'md',
  color = 'primary',
  backdrop = true,
  blocking = true,
  type = 'circle',
  showTextEllipsis = false,
}) => {
  if (!visible) {
    return null;
  }

  const currentSize = sizeMap[size];
  const currentColor = colorMap[color];

  const getContainerClasses = () => {
    // Replaced 'bg-background' with 'bg-black/40' to achieve 40% opacity (0.4) backdrop
    return [
      'fixed inset-0 z-50 flex items-center justify-center',
      backdrop ? 'bg-black/40' : '', 
      !blocking ? 'pointer-events-none' : '',
    ].join(' ').trim();
  };

  const renderLoader = () => {
    switch (type) {
      case 'circle':
        return (
          <div
            className={`inline-block animate-spin rounded-full border-t-2 border-b-2 border-border ${sizeMap.circle[size]} =`}
            role="status"
            aria-label="Loading"
          ></div>
        );

      case 'line':
        return (
          <div className={`w-full bg-card rounded-full overflow-hidden ${currentSize.lineHeight}`}>
            <div
              className={`h-full rounded-full animate-progress bg-card`}
              style={{ width: '80%' }}
            ></div>
          </div>
        );

      case 'breathing':
        return (
          <div
            className={`rounded-full animate-breathing ${currentSize.h} ${currentSize.w} ${currentColor.bg}`}
          ></div>
        );

      case 'ellipsis':
        const dotClasses = `${currentSize.dot} ${currentColor.bg} rounded-full inline-block animate-ellipsis-bounce`;
        return (
          <div className={`flex items-center justify-center gap-2 ${currentSize.h}`}>
            <span className={dotClasses} style={{ animationDelay: '0.0s' }}></span>
            <span className={dotClasses} style={{ animationDelay: '0.2s' }}></span>
            <span className={dotClasses} style={{ animationDelay: '0.4s' }}></span>
          </div>
        );

      default:
        return null;
    }
  };

  const renderText = () => {
    if (!text) return null;

    return (
      <p className={`text-center w-full ${currentSize.textSize} ${currentColor.text}`}>
        {text}
        {showTextEllipsis && (
          <span className="inline-flex ellipsis-animation">
            <span>.</span><span>.</span><span>.</span>
          </span>
        )}
      </p>
    );
  };

  return (
    <div className={getContainerClasses()}>
      <style>
        {`
          /* Keyframes for smooth animations */
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
          }
          .animate-progress {
            animation: progress 1.5s ease-in-out infinite;
          }

          @keyframes breathing {
            0% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.8; }
          }
          .animate-breathing {
            animation: breathing 2s ease-in-out infinite;
          }

          /* Ellipsis text animation */
          .ellipsis-animation span {
            opacity: 0;
            animation: ellipsis-dot 1.4s infinite;
          }
          .ellipsis-animation span:nth-child(1) {
            animation-delay: 0.0s;
          }
          .ellipsis-animation span:nth-child(2) {
            animation-delay: 0.2s;
          }
          .ellipsis-animation span:nth-child(3) {
            animation-delay: 0.4s;
          }
          @keyframes ellipsis-dot {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
          }

          /* Dot bounce animation */
          @keyframes ellipsis-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-0.5em); }
          }
          .animate-ellipsis-bounce {
            animation: ellipsis-bounce 1s infinite ease-in-out;
          }

          body {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>

      {/* Loader content container, ensuring the loader itself is fully opaque */}
      <div className="flex flex-col items-center gap-4 w-full max-w-xs px-4 bg-white p-6 rounded-sm shadow-lg">
        {renderLoader()}
        {renderText()}
      </div>
    </div>
  );
};

export default Loader;