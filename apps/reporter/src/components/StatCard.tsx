import React from 'react';

interface StatCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  icon,
  accentColor,
  bgColor,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        transition: 'transform 0.1s ease',
      }}
    >
      <div>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '2px' }}>
          {title}
        </p>
        <p style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>
          {count}
        </p>
      </div>

      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          backgroundColor: bgColor,
          color: accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
    </div>
  );
};

export default StatCard;

