import React from 'react';

interface KbdBadgeProps {
  keys: string;
  style?: React.CSSProperties;
  className?: string;
}

export const KbdBadge: React.FC<KbdBadgeProps> = ({ keys, style, className }) => {
  return (
    <kbd
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        padding: '2px 6px',
        fontSize: '11px',
        fontWeight: '800',
        fontFamily: 'Consolas, Monaco, monospace',
        color: '#ffffff',
        background: '#091426',
        border: '1.5px solid #1e293b',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        lineHeight: 1,
        userSelect: 'none',
        ...style,
      }}
    >
      {keys}
    </kbd>
  );
};
