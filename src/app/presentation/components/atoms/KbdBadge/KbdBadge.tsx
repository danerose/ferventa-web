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
        padding: '2px 7px',
        fontSize: '10.5px',
        fontWeight: '600',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#475569',
        background: '#f1f5f9',
        border: '1px solid #cbd5e1',
        borderBottom: '2px solid #cbd5e1',
        borderRadius: '5px',
        lineHeight: 1.4,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {keys}
    </kbd>
  );
};
