'use client';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export default function Loader({ size = 'medium', text, fullScreen = false }: LoaderProps) {
  const sizeMap = {
    small: 32,
    medium: 56,
    large: 80,
  };

  const loaderSize = sizeMap[size];
  const fontSize = loaderSize * 0.4;

  // Technion-style loader with Hebrew letter ת (Tav) - Technion symbol
  const technionLoader = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: loaderSize,
        height: loaderSize,
      }}
    >
      {/* Outer hexagon ring - geometric Technion style */}
      <div
        style={{
          position: 'absolute',
          width: loaderSize,
          height: loaderSize,
          border: '3px solid transparent',
          borderTop: '3px solid #2563eb',
          borderRight: '3px solid #1d4ed8',
          borderRadius: '50%',
          animation: 'spin-loader 1.2s linear infinite',
        }}
      />
      {/* Inner geometric shape */}
      <div
        style={{
          position: 'absolute',
          width: loaderSize * 0.75,
          height: loaderSize * 0.75,
          border: '2px solid transparent',
          borderBottom: '2px solid #3b82f6',
          borderLeft: '2px solid #60a5fa',
          borderRadius: '50%',
          animation: 'spin-loader-reverse 0.9s linear infinite',
        }}
      />
      {/* Technion letter ת (Tav) - the official symbol */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: fontSize,
          fontWeight: 900,
          color: '#1e40af',
          fontFamily: 'Arial, sans-serif',
          animation: 'pulse-loader 1.5s ease-in-out infinite',
          lineHeight: 1,
          textShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
        }}
      >
        {/* Technion */}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          gap: 24,
        }}
      >
        {technionLoader}
        {text && (
          <div 
            style={{ 
              fontSize: 16, 
              color: '#1e293b', 
              fontWeight: 600,
              letterSpacing: '0.3px',
            }}
          >
            {text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: text ? '32px' : '16px',
      }}
    >
      {technionLoader}
      {text && (
        <div 
          style={{ 
            fontSize: 14, 
            color: '#475569', 
            fontWeight: 500,
            letterSpacing: '0.2px',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

